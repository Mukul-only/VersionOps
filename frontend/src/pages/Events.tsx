import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, Users, UserCheck, Pencil, Trash2, Copy, Save } from "lucide-react";

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
import {mapped_toast} from "@/lib/toast_map.ts";

type Position = "FIRST" | "SECOND" | "THIRD";

type PendingChanges = {
  participations: {
    [participationId: number]: {
      dummyId?: string;
      teamId?: string;
    };
  };
};

export default function Events() {
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FestEvent | null>(null);
  const [roster, setRoster] = useState<EventParticipation[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");
  const [colleges, setColleges] = useState<College[]>([]);
  const navigate = useNavigate();

  const [detailsDenied, setDetailsDenied] = useState(false);
  const [participantsDenied, setParticipantsDenied] = useState(false);
  const [resultsDenied, setResultsDenied] = useState(false);

  const [checkInDetails, setCheckInDetails] = useState<{ [participantId: number]: { dummyId: string; teamId: string } }>({});

  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [defaultParticipants, setDefaultParticipants] = useState<Participant[]>([]);
  const [baseList, setBaseList] = useState<Participant[]>([]);
  
  const [selectedParticipations, setSelectedParticipations] = useState<number[]>([]);
  const [isBulkCopyDialogOpen, setIsBulkCopyDialogOpen] = useState(false);

  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({ participations: {} });

  const loadEvents = useCallback(async () => {
    try {
      const response = await eventService.getAll({ 
        take: 100, 
        includeRelations: true,
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });
      setEvents(response.items || []);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        mapped_toast('you do have access to events', 'warning', true)
        return;
      }
      mapped_toast("Failed to load events", "error");
      console.error("Failed to load events", error);
    }
  }, []);

  const loadColleges = useCallback(async () => {
    try {
      const response = await collegeService.getAll({ 
        take: 100,
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });
      setColleges(response.items || []);
    } catch (error: any) {
      if (error?.response?.status === 403) return;
    }
  }, []);

  useEffect(() => {
    void loadEvents();
    void loadColleges();
  }, [loadEvents, loadColleges]);

  const loadEventDetails = useCallback(async (eventId: number) => {
    setDetailsDenied(false);
    setParticipantsDenied(false);
    setResultsDenied(false);

    const apiOptions = {
        suppressForbiddenRedirect: true,
        suppressErrorToast: true,
    };

    const [detailsResult, participationsResult, resultsResult] = await Promise.allSettled([
        eventService.getOne(eventId, { ...apiOptions, includeRelations: true }),
        eventParticipationService.getAll({ filters: JSON.stringify({ eventId }), ...apiOptions, includeRelations: true, take: 1000 }),
        eventResultService.getAll({ filters: JSON.stringify({ eventId }), ...apiOptions, includeRelations: true, take: 100 })
    ]);

    if (detailsResult.status === 'fulfilled') {
        setSelectedEvent(detailsResult.value);
    } else if ((detailsResult.reason as any)?.response?.status === 403) {
        setDetailsDenied(true);
    }

    if (participationsResult.status === 'fulfilled') {
        setRoster(participationsResult.value.items || []);
    } else if ((participationsResult.reason as any)?.response?.status === 403) {
        setParticipantsDenied(true);
        setRoster([]);
    }

    if (resultsResult.status === 'fulfilled') {
        setResults(resultsResult.value.items || []);
    } else if ((resultsResult.reason as any)?.response?.status === 403) {
        setResultsDenied(true);
        setResults([]);
    }

    const hasNon403Error = [detailsResult, participationsResult, resultsResult].some(
        (r) => r.status === 'rejected' && (r.reason as any)?.response?.status !== 403
    );

    if (hasNon403Error) {
        mapped_toast("Failed to load some event data.", "error");
        console.error("Failed to load some event data.");
    }

    setSelectedParticipations([]);
    setPendingChanges({ participations: {} });
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      void loadEventDetails(selectedEventId);
    } else {
      setSelectedEvent(null);
      setRoster([]);
      setResults([]);
      setDefaultParticipants([]);
      setSearchResults([]);
      setPendingChanges({ participations: {} });
    }
  }, [selectedEventId, loadEventDetails]);

  const loadDefaultParticipants = useCallback(async () => {
    const apiOptions = {
      suppressForbiddenRedirect: true,
      suppressErrorToast: true,
    };
    try {
      const countResponse = await participantService.getAll({ take: 1, ...apiOptions });
      const totalParticipants = countResponse.total;

      if (totalParticipants > 0) {
        const take = 30;
        const maxSkip = totalParticipants > take ? totalParticipants - take : 0;
        const randomSkip = Math.floor(Math.random() * maxSkip);

        const response = await participantService.getAll({
          take: take,
          skip: randomSkip,
          includeRelations: true,
          ...apiOptions
        });

        const rosterIds = new Set((roster || []).map(r => r.participantId));
        const filtered = (response.items || []).filter(p => !rosterIds.has(p.id));
        
        setDefaultParticipants(filtered.slice(0, 10));
      } else {
        setDefaultParticipants([]);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) return;
    }
  }, [roster]);

  useEffect(() => {
    if (selectedEventId && !participantsDenied) {
      void loadDefaultParticipants();
    }
  }, [roster, selectedEventId, loadDefaultParticipants, participantsDenied]);

  const searchParticipants = useCallback(async () => {
    try {
      const response = await participantService.getAll({
        search: searchQuery,
        take: 20,
        includeRelations: true,
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });

      const rosterIds = new Set((roster || []).map(r => r.participantId));
      const filtered = (response.items || []).filter(p => !rosterIds.has(p.id));
      
      setSearchResults(filtered);
    } catch (error: any) {
      if (error?.response?.status === 403) return;
    }
  }, [searchQuery, roster]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounceFn = setTimeout(() => {
        void searchParticipants();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedEventId, searchParticipants]);

  useEffect(() => {
    let cancelled = false;

    const setSafeBaseList = (items: Participant[]) => {
      if (!cancelled) {
        setBaseList(items);
      }
    };

    const syncBaseList = async () => {
      if (searchQuery.trim()) {
        setSafeBaseList(searchResults || []);
        return;
      }

      if (collegeFilter === "all") {
        setSafeBaseList(defaultParticipants || []);
        return;
      }

      const selectedCollege = (colleges || []).find((college) => college.code === collegeFilter);
      if (!selectedCollege) {
        setSafeBaseList([]);
        return;
      }

      try {
        const response = await participantService.getAll({
          take: 150,
          includeRelations: true,
          filters: JSON.stringify({ collegeId: selectedCollege.id }),
          suppressForbiddenRedirect: true,
          suppressErrorToast: true,
        });

        const rosterIds = new Set((roster || []).map((r) => r.participantId));
        const filtered = (response.items || []).filter((p) => !rosterIds.has(p.id));
        setSafeBaseList(filtered);
      } catch (error: any) {
        if (error?.response?.status === 403) return;
        setSafeBaseList([]);
      }
    };

    void syncBaseList();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, searchResults, collegeFilter, defaultParticipants, colleges, roster]);

  const handleEditClick = (event: FestEvent) => {
    navigate(`/events/edit/${event.id}`);
  };

  const handleCheckInChange = (participantId: number, field: 'dummyId' | 'teamId', value: string) => {
    setCheckInDetails(prev => ({
        ...prev,
        [participantId]: {
            ...(prev[participantId] || { dummyId: '', teamId: '' }),
            [field]: value,
        },
    }));
  };

  const markPresent = async (participantId: number) => {
    if (!selectedEventId) return;
    try {
      const details = checkInDetails[participantId];
      await eventParticipationService.create({
        eventId: selectedEventId,
        participantId,
        dummyId: details?.dummyId || undefined,
        teamId: details?.teamId || undefined
      },
      {
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });
      mapped_toast('Participant marked present', 'success')
      setCheckInDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[participantId];
          return newDetails;
      });
      // setSearchQuery("");
      await loadEventDetails(selectedEventId);
    } catch (error: any) {
        if (error?.response?.status === 403) {
            mapped_toast('you do not have permission to mark participant present', 'warning', true)
            return;
        } else {
            mapped_toast('Failed to mark participant present', 'error')
            const errorMessage = error instanceof Error ? error.message : "Failed to mark present";
            console.error(errorMessage);
        }
    }
  };

  const removeFromEvent = async (participationId: number) => {
    if (!selectedEventId) return;
    try {
      await eventParticipationService.delete(participationId, {
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });
      mapped_toast('Participant removed', 'success')
      await loadEventDetails(selectedEventId);
    } catch (error: any) {
        if (error?.response?.status === 403) {
            mapped_toast('you do not have permission to remove participant', 'warning', true)
            return;
        } else {
            mapped_toast('Failed to remove participant', 'error')
            const errorMessage = error instanceof Error ? error.message : "Failed to remove participant";
            console.error(errorMessage);
        }
    }
  };

  const handleFieldChange = (participationId: number, field: 'dummyId' | 'teamId', value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      participations: {
        ...prev.participations,
        [participationId]: {
          ...prev.participations[participationId],
          [field]: value,
        },
      },
    }));
  };

  const handlePositionChange = async (participantId: number, newPosition: Position | null) => {
    if (!selectedEventId) return;

    const currentResult = (results || []).find(r => r.participantId === participantId);
    const otherResultWithNewPosition = newPosition ? (results || []).find(r => r.position === newPosition) : null;

    const optimisticResults = (results || []).map(r => {
      if (r.participantId === participantId) return { ...r, position: newPosition };
      if (otherResultWithNewPosition && r.id === otherResultWithNewPosition.id) return { ...r, position: null };
      return r;
    }).filter((r): r is EventResult & { position: Position } => r.position !== null);
    
    if (!currentResult && newPosition) {
        const newResult: EventResult = {
            id: -1, // temp id
            eventId: selectedEventId, 
            participantId, 
            position: newPosition,
            createdAt: new Date().toISOString(),
        };
        optimisticResults.push(newResult);
    }
    setResults(optimisticResults);

    const apiOptions = {
      suppressForbiddenRedirect: true,
      suppressErrorToast: true,
    };

    try {
      if (otherResultWithNewPosition) {
        await eventResultService.delete(otherResultWithNewPosition.id, apiOptions);
      }

      if (newPosition) {
        if (currentResult) {
          await eventResultService.update(currentResult.id, { position: newPosition }, apiOptions);
        } else {
          await eventResultService.create({ eventId: selectedEventId, participantId, position: newPosition},{ ...apiOptions });
        }
        console.log(`Position updated to ${newPosition}`);
      } else {
        if (currentResult) {
          await eventResultService.delete(currentResult.id, apiOptions);
          console.log("Position removed");
        }
      }
    } catch (error: any) {
        if (error?.response?.status === 403) {
            mapped_toast('you do not have permission to update position', 'warning')
            return;
        } else {
            mapped_toast('Failed to update position', 'error')
            const errorMessage = error instanceof Error ? error.message : "Failed to update position";
            console.error(errorMessage);
        }
    } finally {
      try {
        const resultsRes = await eventResultService.getAll({ 
          filters: JSON.stringify({ eventId: selectedEventId }), 
          includeRelations: true, 
          take: 100,
          ...apiOptions
        });
        setResults(resultsRes.items || []);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          mapped_toast('you do not have permission to update position', 'warning', true)
          setResultsDenied(true);
          setResults([]);
        }

      }
    }
  };

  const handleParticipationUpdate = async () => {
    if (!selectedEventId) return;

    const apiOptions = {
      suppressForbiddenRedirect: true,
      suppressErrorToast: true,
    };

    const participationPromises = Object.entries(pendingChanges.participations).map(([id, data]) =>
      eventParticipationService.update(Number(id), data, apiOptions)
    );

    if (participationPromises.length === 0) {
      console.log("No changes to save.");
      return;
    }

    try {
      await Promise.all(participationPromises);
      mapped_toast('Participant details updated', 'success')
      await loadEventDetails(selectedEventId);
    } catch (error: any) {
        if (error?.response?.status === 403) {
            return;
        } else {
            mapped_toast('Failed to save some changes', 'error')
            const errorMessage = error instanceof Error ? error.message : "Failed to save some changes.";
            console.error(errorMessage);
        }
    }
  };

  const deleteEvent = async (eventId: number) => {
    try {
      await eventService.delete(eventId, {
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });
      mapped_toast('Event deleted successfully', 'success')
      await loadEvents();
    } catch (error: any) {
        if (error?.response?.status === 403) {
            mapped_toast('you do not have permission to delete event', 'warning')
            return;
        } else {
            mapped_toast('Failed to delete event', 'error')
            const errorMessage = error instanceof Error ? error.message : "Failed to delete event";
            console.error(errorMessage);
        }
    }
  };
  
  const handleBulkCopy = async (toEventId: number) => {
    if (!selectedEventId || selectedParticipations.length === 0) return;

    const participantIdsToCopy = (roster || [])
      .filter(r => selectedParticipations.includes(r.id))
      .map(r => r.participantId);

    try {
      await eventParticipationService.bulkCopy({
        fromEventId: selectedEventId,
        toEventId: toEventId,
        participantIds: participantIdsToCopy,
      }, {
        suppressForbiddenRedirect: true,
        suppressErrorToast: true
      });
      mapped_toast('Participants copied successfully', 'success')
      setIsBulkCopyDialogOpen(false);
      setSelectedParticipations([]);
    } catch (error: any) {
        if (error?.response?.status === 403) {
            mapped_toast('you do not have permission to copy participants', 'warning')
            return;
        } else {
            mapped_toast('Failed to copy participants', 'error')
            const errorMessage = error instanceof Error ? error.message : "Failed to copy participants.";
            console.error(errorMessage);
        }
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

  const filteredRoster = (roster || []).filter(r => {
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

  const participantsToShow = collegeFilter === "all"
    ? (baseList || [])
    : (baseList || []).filter(p => p.college?.code === collegeFilter);
  
  const hasPendingChanges = Object.keys(pendingChanges.participations).length > 0;

  if (!selectedEventId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>
          <p className="text-sm text-muted-foreground">{(events || []).length} events</p>
        </div>
        <div className="w-full overflow-x-auto pb-8">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-transparent border-none shadow-none">
                <TableHead>Event Name</TableHead>
                <TableHead className="w-24">Team Size</TableHead>
                <TableHead className="w-32">Participation Pts</TableHead>
                <TableHead className="w-40">Prize Points (1/2/3)</TableHead>
                <TableHead className="w-24">Roster</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(events || []).map((ev) => (
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
                          <AlertDialogAction onClick={() => void deleteEvent(ev.id)}>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setSelectedEventId(null); setSearchQuery(""); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{selectedEvent?.name || "Event"}</h2>
          {!detailsDenied && (
            <p className="text-sm text-muted-foreground">
              Team size: {selectedEvent?.teamSize} · Participation pts: {selectedEvent?.participationPoints}
            </p>
          )}
        </div>
      </div>

      {!detailsDenied && (
        <div className="border rounded-lg p-4 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Team Size</p>
            <p className="text-lg font-bold">{selectedEvent?.teamSize}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-lg font-bold">{(roster || []).length}</p>
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
      )}

      {!participantsDenied && (
        <>
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
                    {(colleges || []).map((c) => (
                      <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/*<Select value={dummyFilter} onValueChange={setDummyFilter}>*/}
                {/*  <SelectTrigger className="w-28 h-9 text-xs">*/}
                {/*    <SelectValue placeholder="Dummy Filter" />*/}
                {/*  </SelectTrigger>*/}
                {/*  <SelectContent>*/}
                {/*    <SelectItem value="all">All Dummy</SelectItem>*/}
                {/*    <SelectItem value="assigned">Assigned</SelectItem>*/}
                {/*    <SelectItem value="unassigned">Unassigned</SelectItem>*/}
                {/*  </SelectContent>*/}
                {/*</Select>*/}
              </div>

              <div className="w-full h-56 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-transparent z-10">
                    <TableRow className="hover:bg-transparent bg-transparent border-none shadow-none">
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead className="w-24">Dummy ID</TableHead>
                      <TableHead className="w-20">Team ID</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantsToShow.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4 text-sm">
                          {searchQuery.trim() ? "No participants found." : "No participants to show."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      participantsToShow.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.participantId}</TableCell>
                          <TableCell className="text-sm">{p.name}</TableCell>
                          <TableCell className="text-sm">{p.college?.code}</TableCell>
                          <TableCell>
                            <Input
                              className="h-7 w-20 text-xs font-mono"
                              placeholder="Opt."
                              value={checkInDetails[p.id]?.dummyId || ''}
                              onChange={(e) => handleCheckInChange(p.id, 'dummyId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 w-16 text-xs font-mono"
                              placeholder="Opt."
                              value={checkInDetails[p.id]?.teamId || ''}
                              onChange={(e) => handleCheckInChange(p.id, 'teamId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="default" className="h-7 w-7" onClick={() => void markPresent(p.id)}>
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold">Present Participants ({filteredRoster.length})</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!hasPendingChanges}
                  onClick={() => void handleParticipationUpdate()}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Update Details
                </Button>
                <BulkCopyDialog
                  open={isBulkCopyDialogOpen}
                  onOpenChange={setIsBulkCopyDialogOpen}
                  events={(events || []).filter(e => e.id !== selectedEventId)}
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
            <div className="w-full h-56 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-transparent z-10">
                  <TableRow className="hover:bg-transparent bg-transparent border-none shadow-none">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedParticipations.length === filteredRoster.length && filteredRoster.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>HackerEarth ID</TableHead>
                    <TableHead>Dummy ID</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoster.map((r) => {
                      const result = (results || []).find(res => res.participantId === r.participantId);
                      const pendingParticipation = pendingChanges.participations[r.id] || {};
                      const dummyIdValue = pendingParticipation.dummyId !== undefined ? pendingParticipation.dummyId : (r.dummyId || '');
                      const teamIdValue = pendingParticipation.teamId !== undefined ? pendingParticipation.teamId : (r.teamId || '');

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
                          <TableCell className="font-mono text-xs">{r.participant?.hackerearthUser}</TableCell>
                          <TableCell>
                            <Input
                              className="h-7 w-20 text-xs font-mono"
                              value={dummyIdValue}
                              onChange={(e) => handleFieldChange(r.id, 'dummyId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 w-16 text-xs font-mono"
                              value={teamIdValue}
                              onChange={(e) => handleFieldChange(r.id, 'teamId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            {resultsDenied ? (
                                <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                                <Select
                                    value={result?.position || "none"}
                                    onValueChange={(val) => void handlePositionChange(r.participantId, val === "none" ? null : val as Position)}
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
                            )}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                  <Trash2 className="h-4 w-4" />
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
                                  <AlertDialogAction onClick={() => void removeFromEvent(r.id)}>Remove</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                  })}
                  {filteredRoster.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {(roster || []).length > 0 ? "No participants found in your search." : "No participants marked present yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
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
      void onConfirm(Number(targetEventId));
    } else {
      mapped_toast('Please select a target event.', 'warning')
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
              {(events || []).map(event => (
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
