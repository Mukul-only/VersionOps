import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, UserX, Eye, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { participantService, collegeService } from "@/api/services";
import { Participant, College } from "@/api/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {z} from "zod";

const yearEnum = z.enum(["ONE", "TWO"]);


export default function Participants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailParticipant, setDetailParticipant] = useState<Participant | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantData, setParticipantData] = useState<Partial<Participant> & { collegeId?: number }>({});

  const loadParticipants = useCallback(async () => {
    try {
      const response = await participantService.getAll({
        search: search,
        take: 50,
        includeRelations: true
      });
      setParticipants(response.items);
    } catch (error) {
      toast.error("Failed to load participants");
    }
  }, [search]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      void loadParticipants();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, loadParticipants]);

  useEffect(() => {
    if (detailId) {
      void loadParticipantDetails(detailId);
    }
  }, [detailId, loadParticipants]);

  const loadInitialData = async () => {
    try {
      const [participantsRes, collegesRes] = await Promise.all([
        participantService.getAll({ take: 50, includeRelations: true }),
        collegeService.getAll({ take: 500 }),
      ]);
      setParticipants(participantsRes.items);
      setColleges(collegesRes.items);
    } catch (error) {
      toast.error("Failed to load initial data");
    }
  };

  const loadParticipantDetails = async (id: number) => {
    try {
      const data = await participantService.getById(id, true);
      setDetailParticipant(data);
    } catch (error) {
      toast.error("Failed to load participant details");
    }
  };

  const handleEditClick = (participant: Participant) => {
    setEditingParticipant(participant);
    setParticipantData({
      name: participant.name,
      email: participant.email,
      year: participant.year,
      phone: participant.phone,
      hackerearthUser: participant.hackerearthUser,
      collegeId: participant.college?.id,
    });
  };

  const handleUpdate = async () => {
    if (!editingParticipant) return;
    try {
      const { college, ...payload } = participantData;
      await participantService.update(editingParticipant.id, payload);
      toast.success("Participant updated successfully");
      setEditingParticipant(null);
      await loadParticipants();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update participant");
      } else {
        toast.error("Failed to update participant");
      }
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === participants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(participants.map((p) => p.id)));
    }
  };

  const bulkCheckIn = async () => {
    try {
      const promises = Array.from(selected).map(id => participantService.checkIn(id));
      await Promise.all(promises);
      toast.success(`${selected.size} participants checked in`);
      setSelected(new Set());
      await loadParticipants();
    } catch (error) {
      toast.error("Some check-ins failed");
    }
  };

  const checkIn = async (id: number) => {
    try {
      await participantService.checkIn(id);
      toast.success("Participant checked in");
      await loadParticipants();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Check-in failed");
      } else {
        toast.error("Check-in failed");
      }
    }
  };

  const bulkNoShow = async () => {
    try {
      const promises = Array.from(selected).map(id => participantService.update(id, { festStatus: 'NO_SHOW' }));
      await Promise.all(promises);
      toast.success(`${selected.size} participants marked no-show`);
      setSelected(new Set());
      await loadParticipants();
    } catch (error) {
      toast.error("Some updates failed");
    }
  };

  const deleteParticipant = async (participantId: number) => {
    try {
      await participantService.delete(participantId);
      toast.success("Participant deleted successfully");
      await loadParticipants();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to delete participant");
      } else {
        toast.error("Failed to delete participant");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Participants</h2>
          <p className="text-sm text-muted-foreground">{participants.length} loaded</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or college..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-xl"
        />
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" onClick={bulkCheckIn}>
            <UserCheck className="mr-1 h-3.5 w-3.5" /> Bulk Check-In
          </Button>
          <Button size="sm" variant="destructive" onClick={bulkNoShow}>
            <UserX className="mr-1 h-3.5 w-3.5" /> Mark No-Show
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"><Checkbox checked={selected.size === participants.length && participants.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>College</TableHead>
              <TableHead className="w-16">Year</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.id} className={selected.has(p.id) ? "bg-primary/5" : ""}>
                <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></TableCell>
                <TableCell className="font-mono text-xs">{p.participantId}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.college?.code}</TableCell>
                <TableCell>{p.year}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                <TableCell>
                  {p.festStatus === 'NO_SHOW' ? <Badge variant="destructive" className="text-xs">No-Show</Badge>
                  : p.festStatus === 'CHECKED_IN' ? <Badge className="bg-green-600 text-white text-xs">Checked In</Badge>
                  : <Badge variant="secondary" className="text-xs">{p.festStatus}</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailId(p.id)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => checkIn(p.id)}><UserCheck className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(p)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this participant?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the participant "{p.name}".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteParticipant(p.id)}>Yes, delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {participants.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No participants found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingParticipant} onOpenChange={() => setEditingParticipant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>Update the details for {editingParticipant?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={participantData.name || ''} onChange={(e) => setParticipantData({...participantData, name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" value={participantData.email || ''} onChange={(e) => setParticipantData({...participantData, email: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year</Label>
              <Select value={participantData.year} onValueChange={(value: z.infer<typeof yearEnum>) => setParticipantData({...participantData, year: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={yearEnum.enum.ONE}>First</SelectItem>
                  <SelectItem value={yearEnum.enum.TWO}>Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input id="phone" value={participantData.phone || ''} onChange={(e) => setParticipantData({...participantData, phone: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hackerearth" className="text-right">HackerEarth</Label>
              <Input id="hackerearth" value={participantData.hackerearthUser || ''} onChange={(e) => setParticipantData({...participantData, hackerearthUser: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="college" className="text-right">College</Label>
              <Select 
                value={String(participantData.collegeId || '')} 
                onValueChange={(value) => setParticipantData({...participantData, collegeId: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailId} onOpenChange={() => { setDetailId(null); setDetailParticipant(null); }}>
        <SheetContent>
          {detailParticipant && (
            <>
              <SheetHeader>
                <SheetTitle>{detailParticipant.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">ID</p><p className="font-mono font-medium">{detailParticipant.participantId}</p></div>
                  <div><p className="text-muted-foreground">College</p><p className="font-medium">{detailParticipant.college?.name} ({detailParticipant.college?.code})</p></div>
                  <div><p className="text-muted-foreground">Year</p><p className="font-medium">{detailParticipant.year}</p></div>
                  <div><p className="text-muted-foreground">Status</p><p className="font-medium">{detailParticipant.festStatus}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Email</p><p className="font-medium">{detailParticipant.email}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Phone</p><p className="font-medium">{detailParticipant.phone || 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">HackerEarth</p><p className="font-medium">{detailParticipant.hackerearthUser || 'N/A'}</p></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
