import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { userService } from "@/api/services";
import { mapped_toast } from "@/lib/toast_map.ts";
import { useAuth } from "@/contexts/AuthContext";

type User = { id: string; name: string; email: string; role: string; createdAt: string };

const ROLE_COLORS: Record<string, string> = {
  ADMIN:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  OPERATOR:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DESK:        "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PARTICIPANT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const MANAGEABLE_ROLES = ["OPERATOR", "DESK"];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPERATOR" });
  const [editForm, setEditForm] = useState({ name: "", password: "", role: "" });

  useEffect(() => { void load(); }, []);

  const load = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data.filter(u => MANAGEABLE_ROLES.includes(u.role)));
    } catch {
      mapped_toast("Failed to load users", "error");
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      mapped_toast("All fields are required", "error");
      return;
    }
    try {
      await userService.create(form);
      mapped_toast("User created successfully", "success");
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "OPERATOR" });
      await load();
    } catch (e: any) {
      mapped_toast(e?.message || "Failed to create user", "error");
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    const payload: Record<string, string> = {};
    if (editForm.name) payload.name = editForm.name;
    if (editForm.password) payload.password = editForm.password;
    if (editForm.role) payload.role = editForm.role;
    try {
      await userService.update(editingUser.id, payload);
      mapped_toast("User updated", "success");
      setEditingUser(null);
      await load();
    } catch {
      mapped_toast("Failed to update user", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userService.remove(id);
      mapped_toast("User deleted", "success");
      await load();
    } catch {
      mapped_toast("Failed to delete user", "error");
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ name: u.name, password: "", role: u.role });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage Operator and Desk accounts</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New User
        </Button>
      </div>

      <div className="w-full overflow-x-auto pb-8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-transparent border-none shadow-none">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-40">Created</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={ROLE_COLORS[u.role]}>{u.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        disabled={u.id === currentUser?.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{u.name}". They will no longer be able to log in.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(u.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No operator or desk accounts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Create a new Operator or Desk account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="DESK">Desk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update details for {editingUser?.name}. Leave password blank to keep it unchanged.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="DESK">Desk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
