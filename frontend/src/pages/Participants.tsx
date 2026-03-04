import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, UserX, Eye, Trash2, Pencil, RotateCcw } from "lucide-react";
 ;
import { participantService, collegeService, eventService } from "@/api/services";
import { Participant, College, FestEvent } from "@/api/types";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {z} from "zod";

const yearEnum = z.enum(["ONE", "TWO"]);

type Filters = {
  festStatus?: string;
  collegeId?: number | null;
};

export default function Participants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailParticipant, setDetailParticipant] = useState<Participant | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantData, setParticipantData] = useState<Partial<Participant> & { collegeId?: number }>({});

  const [participantsAccessDenied, setParticipantsAccessDenied] = useState(false);
  const [collegesAccessDenied, setCollegesAccessDenied] = useState(false);
  const [eventsAccessDenied, setEventsAccessDenied] = useState(false);
  const [participantDetailsAccessDenied, setParticipantDetailsAccessDenied] = useState(false);

  const loadParticipants = useCallback(async () => {
    try {
      const activeFilters: Record<string, string | number | null | undefined> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          activeFilters[key] = value;
        }
      }

      const response = await participantService.getAll({
        search: search,
        take: 150,
        includeRelations: true,
        filters: JSON.stringify(activeFilters),
      });
      setParticipants(response?.items || []);
      setParticipantsAccessDenied(false);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setParticipantsAccessDenied(true);
        setParticipants([]);
        return;
      }
      console.error("Failed to load participants");
      setParticipants([]);
    }
  }, [search, filters]);

  const loadInitialData = useCallback(async () => {
    const [participantsRes, collegesRes, eventsRes] = await Promise.allSettled([
      participantService.getAll({ take: 50, includeRelations: true }),
      collegeService.getAll({ take: 500 }),
      eventService.getAll({ take: 500 }),
    ]);

    if (participantsRes.status === 'fulfilled') {
      setParticipants(participantsRes.value.items || []);
      setParticipantsAccessDenied(false);
    } else {
      if ((participantsRes.reason as any)?.response?.status === 403) {
        setParticipants([]);
        setParticipantsAccessDenied(true);
      } else {
        console.error("Failed to load participants");
        setParticipants([]);
      }
    }

    if (collegesRes.status === 'fulfilled') {
      setColleges(collegesRes.value.items || []);
      setCollegesAccessDenied(false);
    } else {
      if ((collegesRes.reason as any)?.response?.status === 403) {
        setColleges([]);
        setCollegesAccessDenied(true);
      } else {
        console.error("Failed to load colleges");
        setColleges([]);
      }
    }

    if (eventsRes.status === 'fulfilled') {
      setEvents(eventsRes.value.items || []);
      setEventsAccessDenied(false);
    } else {
      if ((eventsRes.reason as any)?.response?.status === 403) {
        setEvents([]);
        setEventsAccessDenied(true);
      } else {
        console.error("Failed to load events");
        setEvents([]);
      }
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      void loadParticipants();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, loadParticipants]);

  const loadParticipantDetails = useCallback(async (id: number) => {
    setParticipantDetailsAccessDenied(false);
    setDetailParticipant(null);
    try {
      const data = await participantService.getById(id, true);
      // console.log(data)
      setDetailParticipant(data || null);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setParticipantDetailsAccessDenied(true);
        setDetailParticipant(null);
        return;
      }
      console.error("Failed to load participant details");
      setDetailParticipant(null);
    }
  }, []);

  useEffect(() => {
    if (detailId) {
      void loadParticipantDetails(detailId);
    }
  }, [detailId, loadParticipantDetails]);

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
      console.log("Participant updated successfully");
      setEditingParticipant(null);
      await loadParticipants();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.error("You do not have permission to perform this action.");
        return;
      }
      console.error(error.message || "Failed to update participant");
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
      console.log(`${selected.size} participants checked in`);
      setSelected(new Set());
      await loadParticipants();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.error("You do not have permission to perform this action.");
        return;
      }
      console.error("Some check-ins failed");
    }
  };

  const bulkNoShow = async () => {
    try {
      const promises = Array.from(selected).map(id => participantService.noShow(id));
      await Promise.all(promises);
      console.log(`${selected.size} participants marked as no-show`);
      setSelected(new Set());
      await loadParticipants();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.error("You do not have permission to perform this action.");
        return;
      }
      console.error("Some updates failed");
    }
  };

  const deleteParticipant = async (participantId: number) => {
    try {
      await participantService.delete(participantId);
      console.log("Participant deleted successfully");
      await loadParticipants();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.error("You do not have permission to perform this action.");
        return;
      }
      console.error(error.message || "Failed to delete participant");
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  const getEventName = (eventId: number) => {
    if (eventsAccessDenied) return 'Event data unavailable';
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  };

  const updateParticipantStatus = async (participantId: number, action: "CHECK_IN" | "NO_SHOW" | "RESET") => {
    try {
      if (action === 'CHECK_IN') {
        await participantService.checkIn(participantId);
      } else if (action === 'NO_SHOW') {
        await participantService.noShow(participantId);
      } else if (action === 'RESET') {
        await participantService.resetStatus(participantId);
      }
      console.log(`Participant status updated`);
      await loadParticipants();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.error("You do not have permission to perform this action.");
        return;
      }
      console.error(error.message || "Failed to update status");
    }
  };

  const handleCloseDetailSheet = () => {
    setDetailId(null);
    setDetailParticipant(null);
    setParticipantDetailsAccessDenied(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Participants</h2>
            {!participantsAccessDenied && <p className="text-sm text-muted-foreground">{participants.length} loaded</p>}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-xl"
              disabled={participantsAccessDenied}
            />
          </div>
          
          <Select
            value={filters.festStatus || ""}
            onValueChange={(value) => handleFilterChange("festStatus", value)}
            disabled={participantsAccessDenied}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGISTERED">Registered</SelectItem>
              <SelectItem value="CHECKED_IN">Checked In</SelectItem>
              <SelectItem value="NO_SHOW">No-Show</SelectItem>
            </SelectContent>
          </Select>

          {!collegesAccessDenied && colleges.length > 0 && (
            <Select
              value={String(filters.collegeId || "")}
              onValueChange={(value) => handleFilterChange("collegeId", parseInt(value))}
              disabled={participantsAccessDenied}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by College" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" onClick={clearFilters} disabled={participantsAccessDenied}>Clear</Button>
        </div>

        {selected.size > 0 && !participantsAccessDenied && (
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

        {participantsAccessDenied ? (
          <div className="border rounded-lg flex items-center justify-center h-64">
            <p className="text-muted-foreground">You do not have access to participants data.</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="relative overflow-y-auto max-h-[calc(12*3.5rem+3.2rem)]">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                  <TableRow>
                    <TableHead className="w-[4%]"><Checkbox checked={selected.size === participants.length && participants.length > 0} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead className="w-[10%]">ID</TableHead>
                    <TableHead className="w-[20%]">Name</TableHead>
                    <TableHead className="w-[10%]">College</TableHead>
                    <TableHead className="w-[8%]">Year</TableHead>
                    <TableHead className="w-[20%]">Email</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[18%] text-right">Actions</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground truncate">{p.email}</TableCell>
                      <TableCell>
                        {p.festStatus === 'NO_SHOW' ? <Badge variant="destructive" className="text-xs">No-Show</Badge>
                        : p.festStatus === 'CHECKED_IN' ? <Badge className="bg-green-600 text-white text-xs">Checked In</Badge>
                        : <Badge variant="secondary" className="text-xs">{p.festStatus}</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateParticipantStatus(p.id, 'CHECK_IN')}><UserCheck className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Check-In</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateParticipantStatus(p.id, 'NO_SHOW')}><UserX className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark No-Show</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateParticipantStatus(p.id, 'RESET')}><RotateCcw className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset to Registered</TooltipContent>
                          </Tooltip>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailId(p.id)}><Eye className="h-4 w-4" /></Button>
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
          </div>
        )}

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
              {!collegesAccessDenied && (
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
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet open={!!detailId} onOpenChange={(isOpen) => !isOpen && handleCloseDetailSheet()}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{participantDetailsAccessDenied ? "Access Denied" : detailParticipant ? detailParticipant.name : "Loading..."}</SheetTitle>
              <SheetDescription>
                {participantDetailsAccessDenied
                  ? "You do not have access to view this participant."
                  : detailParticipant
                  ? `Viewing details for participant ${detailParticipant.participantId}.`
                  : "Loading participant details..."}
              </SheetDescription>
            </SheetHeader>
            {detailParticipant && !participantDetailsAccessDenied && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">ID</p><p className="font-mono font-medium">{detailParticipant.participantId}</p></div>
                  <div><p className="text-muted-foreground">College</p><p className="font-medium">{detailParticipant.college?.name} ({detailParticipant.college?.code})</p></div>
                  <div><p className="text-muted-foreground">Year</p><p className="font-medium">{detailParticipant.year}</p></div>
                  <div><p className="text-muted-foreground">Status</p><p className="font-medium">{detailParticipant.festStatus}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Email</p><p className="font-medium">{detailParticipant.email}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Phone</p><p className="font-medium">{detailParticipant.phone || 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">HackerEarth</p><p className="font-medium">{detailParticipant.hackerearthUser || 'N/A'}</p></div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Event Participations</h4>
                  {detailParticipant.participations && detailParticipant.participations.length > 0 ? (
                    <div className="space-y-2">
                      {detailParticipant.participations.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <span className="text-sm">{getEventName(p.eventId)}</span>
                          {p.teamId && <Badge variant="secondary" className="text-xs">Team: {p.teamId}</Badge>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No event participations.</p>}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Event Results</h4>
                  {detailParticipant.results && detailParticipant.results.length > 0 ? (
                    <div className="space-y-2">
                      {detailParticipant.results.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <span className="text-sm">{getEventName(r.eventId)}</span>
                          <Badge className="text-xs" variant={r.position === 'FIRST' ? 'default' : r.position === 'SECOND' ? 'secondary' : 'outline'}>
                            {r.position}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No event results.</p>}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
