import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Users as UsersIcon, Mail, Shield, ShieldCheck } from "lucide-react";
import { userService, collegeService } from "@/api/services";
import type { College } from "@/api/types";
import { mapped_toast } from "@/lib/toast_map.ts";
import { useAuth } from "@/contexts/AuthContext";

import { cn } from "@/lib/utils";

type User = { id: string; name: string; email: string; role: string; createdAt: string };

const ROLE_COLORS: Record<string, string> = {
  ADMIN:       "bg-primary/10 text-primary border-primary/20",
  OPERATOR:    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  DESK:        "bg-orange-500/10 text-orange-400 border-orange-500/20",
  PARTICIPANT: "bg-white/5 text-white/40 border-white/10",
};

const MANAGEABLE_ROLES = ["OPERATOR", "DESK", "PARTICIPANT"];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPERATOR", collegeId: "" });
  const [editForm, setEditForm] = useState({ name: "", password: "", role: "" });

  useEffect(() => { void load(); void loadColleges(); }, []);

  const load = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data.filter(u => MANAGEABLE_ROLES.includes(u.role)));
    } catch {
      mapped_toast("Failed to load users", "error");
    }
  };

  const loadColleges = async () => {
    try {
      const data = await collegeService.getAll();
      setColleges(data.items);
    } catch {
      mapped_toast("Failed to load colleges", "error");
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      mapped_toast("All fields are required", "error");
      return;
    }
    if (form.role === "PARTICIPANT" && !form.collegeId) {
      mapped_toast("College is required for participants", "error");
      return;
    }
    try {
      const payload: any = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === "PARTICIPANT") {
        payload.collegeId = parseInt(form.collegeId);
      }
      await userService.create(payload);
      mapped_toast("User created successfully", "success");
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "OPERATOR", collegeId: "" });
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
    <div className="space-y-12 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div>
          <h1 className="text-heading">Users</h1>
          <p className="text-muted-foreground mt-1">{users.length} users</p>
        </div>
        
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> 
          Add User
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                    {u.name.charAt(0)}
                  </div>
                  <span className="font-medium">{u.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn(ROLE_COLORS[u.role])}>
                  {u.role}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" 
                          disabled={u.id === currentUser?.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(u.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border rounded-2xl p-6 max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="Email address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, collegeId: "" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="DESK">Desk</SelectItem>
                    <SelectItem value="PARTICIPANT">Participant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="Password"
                />
              </div>
            </div>

            {form.role === "PARTICIPANT" && (
              <div className="space-y-2">
                <Label>College</Label>
                <Select value={form.collegeId} onValueChange={(v) => setForm({ ...form, collegeId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id.toString()}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => { if(!o) setEditingUser(null); }}>
        <DialogContent className="bg-card border-border rounded-2xl p-6 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update details for {editingUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                placeholder="Enter name"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="DESK">Desk</SelectItem>
                  <SelectItem value="PARTICIPANT">Participant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={editForm.password} 
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
