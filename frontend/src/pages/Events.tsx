import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, Users, UserCheck, Trophy, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { eventService, participantService, eventParticipationService, eventResultService, collegeService } from "@/api/services";
import { FestEvent, EventParticipation, Participant, EventResult, College } from "@/api/types";

export default function Events() {
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [roster, setRoster] = useState<EventParticipation[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");
  const [colleges, setColleges] = useState<College[]>([]);
  const navigate = useNavigate();

  // Check-in form state
  const [checkInDummyId, setCheckInDummyId] = useState("");
  const [checkInTeamId, setCheckInTeamId] = useState("");

  // Search results
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  
  // Bulk copy state
  const [selectedParticipations, setSelectedParticipations] = useState<number[]>([]);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);

  useEffect(() => {
    loadEvents();
    loadColleges();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventDetails(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounceFn = setTimeout(() => {
        searchParticipants();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, collegeFilter, selectedEventId]);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAll({ take: 100, includeRelations: true });
      setEvents(response.items);
    } catch (error) {
      toast.error("Failed to load events");
    }
  };

  const loadColleges = async () => {
    try {
      const response = await collegeService.getAll({ take: 100 });
      setColleges(response.items);
    } catch (error) {
      console.error("Failed to load colleges", error);
    }
  };

  const loadEventDetails = async (eventId: number) => {
    try {
      const [participationsRes, resultsRes] = await Promise.all([
        eventParticipationService.getAll({ filters: JSON.stringify({ eventId }), includeRelations: true, take: 1000 }),
        eventResultService.getAll({ filters: JSON.stringify({ eventId }), includeRelations: true, take: 100 })
      ]);
      setRoster(participationsRes.items);
      setResults(resultsRes.items);
      setSelectedParticipations([]); // Reset selection on event change
    } catch (error) {
      toast.error("Failed to load event details");
    }
  };

  const searchParticipants = async () => {
    try {
      const response = await participantService.getAll({
        search: searchQuery,
        take: 20,
        includeRelations: true
      });

      const rosterIds = new Set(roster.map(r => r.participantId));
      const filtered = response.items.filter(p => !rosterIds.has(p.id));
      
      const finalResults = collegeFilter === "all" 
        ? filtered 
        : filtered.filter(p => p.college?.code === collegeFilter);

      setSearchResults(finalResults);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const handleEditClick = (event: FestEvent) => {
    navigate(`/events/edit/${event.id}`);
  };

  const markPresent = async (participantId: number) => {
    if (!selectedEventId) return;
    try {
      await eventParticipationService.create({
        eventId: selectedEventId,
        participantId,
        dummyId: checkInDummyId || undefined,
        teamId: checkInTeamId || undefined
      });
      toast.success("Participant marked present");
      setCheckInDummyId("");
      setCheckInTeamId("");
      setSearchQuery("");
      loadEventDetails(selectedEventId);
    } catch (error: any) {
      toast.error(error.message || "Failed to mark present");
    }
  };

  const removeFromEvent = async (participationId: number) => {
    if (!selectedEventId) return;
    try {
      await eventParticipationService.delete(participationId);
      toast.success("Participant removed");
      loadEventDetails(selectedEventId);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove participant");
    }
  };

  const setPosition = async (participantId: number, position: "FIRST" | "SECOND" | "THIRD" | null) => {
    if (!selectedEventId) return;
    
    try {
      const existingResult = results.find(r => r.participantId === participantId);
      
      if (position === null) {
        if (existingResult) {
          await eventResultService.delete(existingResult.id);
          toast.success("Position cleared");
        }
      } else {
        const currentHolder = results.find(r => r.position === position);
        if (currentHolder && currentHolder.participantId !== participantId) {
           await eventResultService.delete(currentHolder.id);
        }

        if (existingResult) {
          await eventResultService.update(existingResult.id, { position });
        } else {
          await eventResultService.create({
            eventId: selectedEventId,
            participantId,
            position
          });
        }
        toast.success(`Position set to ${position}`);
      }
      loadEventDetails(selectedEventId);
    } catch (error: any) {
      toast.error(error.message || "Failed to set position");
    }
  };

  const updateParticipation = async (id: number, data: Partial<EventParticipation>) => {
      try {
          await eventParticipationService.update(id, data);
          toast.success("Updated successfully");
          if (selectedEventId) loadEventDetails(selectedEventId);
      } catch (error: any) {
          toast.error(error.message || "Failed to update");
      }
  }

  const deleteEvent = async (eventId: number) => {
    try {
      await eventService.delete(eventId);
      toast.success("Event deleted successfully");
      loadEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    }
  };
  
  const handleBulkCopy = async (toEventId: number) => {
    if (!selectedEventId || selectedParticipations.length === 0) return;

    const participantIdsToCopy = roster
      .filter(r => selectedParticipations.includes(r.id))
      .map(r => r.participantId);

    try {
      await eventParticipationService.bulkCopy({
        fromEventId: selectedEventId,
        toEventId: toEventId,
        participantIds: participantIdsToCopy
      });
      toast.success(`Copied ${participantIdsToCopy.length} participants successfully.`);
      setIsBulkCopyDialogOpen(false);
      setSelectedParticipations([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to copy participants.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedParticipations.length === filteredRoster.length) {
      setSelectedParticipations([]);
    } else {
      setSelectedParticipations(filteredRoster.map(r => r.id));
    }
  };

  const toggleSelectOne = (participationId: number) => {
    setSelectedParticipations(prev =>
      prev.includes(participationId)
        ? prev.filter(id => id !== participationId)
        : [...prev, participationId]
    );
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const filteredRoster = roster.filter(r => {
    const searchTerm = rosterSearchQuery.toLowerCase();
    const participant = r.participant;
    if (!participant) return false;
    return (
      participant.name.toLowerCase().includes(searchTerm) ||
      participant.participantId.toLowerCase().includes(searchTerm) ||
      (r.dummyId && r.dummyId.toLowerCase().includes(searchTerm)) ||
      (r.teamId && r.teamId.toLowerCase().includes(searchTerm))
    );
  });

  if (!selectedEventId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          <p className="text-sm text-muted-foreground">{events.length} events</p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Event Name</TableHead>
                <TableHead className="w-24">Team Size</TableHead>
                <TableHead className="w-32">Participation Pts</TableHead>
                <TableHead className="w-40">Prize Points (1/2/3)</TableHead>
                <TableHead className="w-24">Roster</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium" onClick={() => setSelectedEventId(ev.id)}>{ev.name}</TableCell>
                  <TableCell onClick={() => setSelectedEventId(ev.id)}>{ev.teamSize}</TableCell>
                  <TableCell onClick={() => setSelectedEventId(ev.id)}>{ev.participationPoints}</TableCell>
                  <TableCell className="font-mono text-sm" onClick={() => setSelectedEventId(ev.id)}>
                    {ev.firstPrizePoints} / {ev.secondPrizePoints} / {ev.thirdPrizePoints}
                  </TableCell>
                  <TableCell onClick={() => setSelectedEventId(ev.id)}>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {ev.participations?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditClick(ev); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the "{ev.name}" event.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEvent(ev.id)}>
                            Yes, delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Event management screen
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setSelectedEventId(null); setSearchQuery(""); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{selectedEvent?.name}</h2>
          <p className="text-sm text-muted-foreground">
            Team size: {selectedEvent?.teamSize} · Participation pts: {selectedEvent?.participationPoints}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Team Size</p>
          <p className="text-lg font-bold">{selectedEvent?.teamSize}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Present</p>
          <p className="text-lg font-bold">{roster.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Participation Pts</p>
          <p className="text-lg font-bold">{selectedEvent?.participationPoints}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prize Pts (1/2/3)</p>
          <p className="text-lg font-bold font-mono">
            {selectedEvent?.firstPrizePoints}/{selectedEvent?.secondPrizePoints}/{selectedEvent?.thirdPrizePoints}
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> Mark Participant Present
          </h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges.map((c) => (
                  <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {searchQuery.trim() && (
            <div className="border rounded-md max-h-[250px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead className="w-24">Dummy ID</TableHead>
                    <TableHead className="w-20">Team ID</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4 text-sm">
                        No participants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    searchResults.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.participantId}</TableCell>
                        <TableCell className="text-sm">{p.name}</TableCell>
                        <TableCell className="text-sm">{p.college?.code}</TableCell>
                        <TableCell>
                          <Input
                            className="h-7 w-20 text-xs font-mono"
                            placeholder="Opt."
                            value={checkInDummyId}
                            onChange={(e) => setCheckInDummyId(e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-7 w-16 text-xs font-mono"
                            placeholder="Opt."
                            value={checkInTeamId}
                            onChange={(e) => setCheckInTeamId(e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => markPresent(p.id)}>
                            Present
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Positions
          </h3>
        </div>
        <div className="p-3 grid sm:grid-cols-3 gap-3">
          {(["FIRST", "SECOND", "THIRD"] as const).map((pos) => {
            const holder = results.find((r) => r.position === pos);
            const colors = {
              FIRST: "border-yellow-500/50 bg-yellow-500/5",
              SECOND: "border-muted-foreground/30 bg-muted/30",
              THIRD: "border-orange-500/30 bg-orange-500/5",
            };
            const labels = { FIRST: "🥇 1st Place", SECOND: "🥈 2nd Place", THIRD: "🥉 3rd Place" };
            return (
              <div key={pos} className={`border-2 rounded-lg p-3 ${colors[pos]}`}>
                <p className="text-xs font-semibold mb-2">{labels[pos]}</p>
                {holder ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{holder.participant?.name}</p>
                      <p className="text-xs text-muted-foreground">{holder.participant?.college?.code} · {holder.participant?.participantId}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setPosition(holder.participantId, null)}>
                      Clear
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Not assigned</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="p-3 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold">Present Participants ({filteredRoster.length})</h3>
          <div className="flex items-center gap-2">
            <BulkCopyDialog 
              open={isBulkCopyDialogOpen}
              onOpenChange={setIsBulkCopyDialogOpen}
              events={events.filter(e => e.id !== selectedEventId)}
              onConfirm={handleBulkCopy}
              disabled={selectedParticipations.length === 0}
            />
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search in roster..."
                value={rosterSearchQuery}
                onChange={(e) => setRosterSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedParticipations.length === filteredRoster.length && filteredRoster.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Dummy ID</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoster.map((r) => {
                  const result = results.find(res => res.participantId === r.participantId);
                  return (
                    <TableRow key={r.id} data-state={selectedParticipations.includes(r.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedParticipations.includes(r.id)}
                          onCheckedChange={() => toggleSelectOne(r.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.participant?.participantId}</TableCell>
                      <TableCell className="text-sm">{r.participant?.name}</TableCell>
                      <TableCell className="text-sm">{r.participant?.college?.code}</TableCell>
                      <TableCell>
                        <Input
                          className="h-7 w-20 text-xs font-mono"
                          defaultValue={r.dummyId}
                          onBlur={(e) => {
                              if (e.target.value !== r.dummyId) {
                                  updateParticipation(r.id, { dummyId: e.target.value });
                              }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-7 w-16 text-xs font-mono"
                          defaultValue={r.teamId}
                          onBlur={(e) => {
                              if (e.target.value !== r.teamId) {
                                  updateParticipation(r.id, { teamId: e.target.value });
                              }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={result?.position || "none"}
                          onValueChange={(val) => setPosition(r.participantId, val === "none" ? null : val as "FIRST" | "SECOND" | "THIRD")}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            <SelectItem value="FIRST">🥇 1st</SelectItem>
                            <SelectItem value="SECOND">🥈 2nd</SelectItem>
                            <SelectItem value="THIRD">🥉 3rd</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove participant?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {r.participant?.name} from {selectedEvent?.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeFromEvent(r.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
              })}
              {filteredRoster.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {roster.length > 0 ? "No participants found in your search." : "No participants marked present yet. Use the search above to add them."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

interface BulkCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: FestEvent[];
  onConfirm: (toEventId: number) => void;
  disabled: boolean;
}

function BulkCopyDialog({ open, onOpenChange, events, onConfirm, disabled }: BulkCopyDialogProps) {
  const [targetEventId, setTargetEventId] = useState<string>("");

  const handleConfirm = () => {
    if (targetEventId) {
      onConfirm(Number(targetEventId));
    } else {
      toast.warning("Please select a target event.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs" disabled={disabled}>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Bulk Copy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Copy Participants</DialogTitle>
          <DialogDescription>
            Select a target event to copy the selected participants to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={setTargetEventId} value={targetEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={String(event.id)}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!targetEventId}>Confirm Copy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
