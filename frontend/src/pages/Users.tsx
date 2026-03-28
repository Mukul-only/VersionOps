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
import { userService } from "@/api/services";
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
    <div className="space-y-12 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div className="relative">
          <p className="section-label mb-2 opacity-100 text-primary font-bold tracking-[0.2em] dot-prefix pl-3 uppercase">Administration</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter heading-display leading-[0.85] uppercase">
            User<br />
            <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1px var(--on-surface-variant)', opacity: 0.3 }}>Nodes</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-4 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span>
            {users.length} active operators synchronized
          </p>
        </div>
        
        <Button 
          onClick={() => setCreateOpen(true)}
          className="btn-teal-gradient h-12 px-8 rounded-full text-xs font-black tracking-[0.2em] uppercase shadow-lg shadow-teal/20 self-start md:self-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Initiate_User
        </Button>
      </div>

      <div className="bg-surface-low/30 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl border border-white/5 backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">Identity</TableHead>
              <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">Communication</TableHead>
              <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5 w-28">Access_Level</TableHead>
              <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5 w-40">Entry_Date</TableHead>
              <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5 w-24 text-right">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="group border-none hover:bg-white/5 transition-colors duration-500 rounded-3xl overflow-hidden mb-2">
                <TableCell className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-bold text-white tracking-tight">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="p-5 text-muted-foreground font-mono text-xs">{u.email}</TableCell>
                <TableCell className="p-5">
                  <Badge variant="outline" className={cn("pill px-3 py-1 font-black text-[10px] tracking-widest uppercase", ROLE_COLORS[u.role])}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="p-5 text-muted-foreground/60 font-medium text-[10px] uppercase tracking-widest">
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="p-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-primary transition-all" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-all"
                          disabled={u.id === currentUser?.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="stat-card border-white/10 backdrop-blur-3xl rounded-[2.5rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="heading-display text-2xl">Purge_Identity?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This action will permanently synchronize the removal of "{u.name}" from the system. 
                            The identity path will be terminated.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full border-white/10 hover:bg-white/5 uppercase text-[10px] font-black tracking-widest px-6 h-12">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(u.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full uppercase text-[10px] font-black tracking-widest px-6 h-12"
                          >
                            Purge_Data
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
                <TableCell colSpan={5} className="text-center py-24">
                  <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground/40 uppercase">NO_SYSTEM_NODES_ACTIVE</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="backdrop-blur-3xl rounded-[2.5rem] p-0 max-w-lg shadow-none overflow-hidden border-2 border-[#1A1A1A] [&>button]:text-white" style={{ backgroundColor: '#0D0D0D' }}>
          <div className="relative h-full w-full p-10 grain-overlay">
            <DialogHeader className="mb-12 relative z-10 text-center md:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <div className="h-px w-6 bg-white/40" />
                <p className="text-[9px] font-black tracking-[0.4em] text-white/60 uppercase">NODE_PROVISIONING</p>
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter heading-display leading-none uppercase text-white">
                Connect<br />
                <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1px rgba(255, 255, 255, 0.4)', opacity: 0.8 }}>Node</span>
              </DialogTitle>
              <DialogDescription className="text-white/40 font-medium text-[9px] uppercase tracking-[0.2em] mt-4">
                Initialize administrative presence within the deep obsidian perimeter.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 relative z-10">
              <div className="space-y-4 group">
                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-white transition-colors px-2">Identity_Name</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="Full Name..." 
                  className="h-14 bg-[#000000] border-none focus-visible:ring-0 rounded-2xl px-6 font-bold tracking-tight shadow-[inset_0_2px_8px_rgba(0,0,0,1)] placeholder:text-neutral-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 group">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-white transition-colors px-2">Access_Tier</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="h-14 bg-[#000000] border-none focus:ring-0 rounded-2xl px-6 font-black tracking-widest text-[9px] uppercase shadow-[inset_0_2px_8px_rgba(0,0,0,1)] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0D0D0D] border-white/10 backdrop-blur-3xl rounded-xl">
                      <SelectItem value="OPERATOR" className="font-black text-[9px] tracking-widest uppercase py-3 pl-10 pr-3 text-white hover:bg-white/5 transition-colors cursor-pointer">Operator</SelectItem>
                      <SelectItem value="DESK" className="font-black text-[9px] tracking-widest uppercase py-3 pl-10 pr-3 text-white hover:bg-white/5 transition-colors cursor-pointer">Desk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 group">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-white transition-colors px-2">Security_Key</Label>
                  <Input 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    placeholder="Whisper Key..." 
                    className="h-14 bg-[#000000] border-none focus-visible:ring-0 rounded-2xl px-6 font-bold tracking-tight shadow-[inset_0_2px_8px_rgba(0,0,0,1)] placeholder:text-neutral-500 text-white"
                  />
                </div>
              </div>

              <div className="space-y-4 group">
                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-white transition-colors px-2">Comm_Channel</Label>
                <Input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="Email Coordinate..." 
                  className="h-14 bg-[#000000] border-none focus-visible:ring-0 rounded-2xl px-6 font-bold tracking-tight shadow-[inset_0_2px_8px_rgba(0,0,0,1)] placeholder:text-neutral-500 text-white"
                />
              </div>
            </div>

            <DialogFooter className="mt-14 flex-col gap-4 relative z-10">
              <Button 
                onClick={handleCreate} 
                className="bg-[#65d5c0] text-black hover:bg-[#65d5c0]/90 h-14 rounded-full text-[10px] font-black tracking-[0.4em] uppercase shadow-xl shadow-cyan-500/10 transition-all w-full border-t border-white/20"
              >
                Connect_Node
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCreateOpen(false)} 
                className="h-10 text-[9px] font-black tracking-[0.3em] uppercase hover:bg-white/5 text-neutral-500 transition-all"
              >
                Abort
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => { if(!o) setEditingUser(null); }}>
        <DialogContent className="stat-card border-none backdrop-blur-3xl rounded-[3rem] p-0 max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden border-t border-white/10">
          <div className="relative h-full w-full p-10 grain-overlay">
            <DialogHeader className="mb-12 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-primary/40" />
                <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">CALIBRATE_NODE</p>
              </div>
              <DialogTitle className="text-5xl font-black tracking-tighter heading-display leading-[0.9] uppercase">
                Node<br />
                <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1px var(--on-surface-variant)', opacity: 0.2 }}>Calibration</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/40 font-medium text-[10px] uppercase tracking-[0.2em] mt-4">
                Adjusting parameters for identity node: {editingUser?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-primary transition-colors px-2">Identity_Label</Label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                    <Input 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                      className="h-14 bg-surface-lowest border-none focus-visible:ring-0 rounded-2xl px-6 font-bold tracking-tight shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground/10 text-white relative z-10"
                    />
                  </div>
                </div>

                <div className="col-span-7 space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-primary transition-colors px-2">Access_Hierarchy</Label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                      <SelectTrigger className="h-14 bg-surface-lowest border-none focus:ring-0 rounded-2xl px-6 font-black tracking-widest text-[10px] uppercase shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] relative z-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-low border-white/5 backdrop-blur-3xl rounded-2xl overflow-hidden shadow-2xl">
                        <SelectItem value="OPERATOR" className="font-black text-[10px] tracking-widest uppercase p-4">Operator</SelectItem>
                        <SelectItem value="DESK" className="font-black text-[10px] tracking-widest uppercase p-4">Desk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="col-span-5 space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-focus-within:text-primary transition-colors px-2">Key_Reset</Label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                    <Input 
                      type="password" 
                      value={editForm.password} 
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                      placeholder="Optional..." 
                      className="h-14 bg-surface-lowest border-none focus-visible:ring-0 rounded-2xl px-6 font-bold tracking-tight shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground/20 text-white relative z-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-16 flex-col md:flex-row gap-4 items-center relative z-10">
              <Button 
                variant="ghost" 
                onClick={() => setEditingUser(null)} 
                className="rounded-full h-12 px-6 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-white/5 text-muted-foreground/30 transition-all"
              >
                Cancel_Calibration
              </Button>
              <Button 
                onClick={handleEdit} 
                className="btn-teal-gradient h-14 px-12 rounded-full text-[10px] font-black tracking-[0.5em] uppercase shadow-xl shadow-teal/20 hover:shadow-teal/40 transition-all flex-1 w-full"
              >
                Apply_Node_Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
