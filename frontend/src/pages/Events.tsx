import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Users, 
  Trophy, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Pencil,
  Trash2,
  Copy,
  Save,
  LayoutGrid,
  List,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
import {mapped_toast } from "@/lib/toast_map.ts";

type Position = "FIRST" | "SECOND" | "THIRD";

type PendingChanges = {
  participations: {
    [participationId: number]: {
      dummyId?: string;
      teamId?: string;
    };
  };
};

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
      mapped_toast('Please select an event.', 'warning')
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-sm" disabled={disabled}>
          <Copy className="h-4 w-4 mr-2" />
          Copy to Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Participants</DialogTitle>
          <DialogDescription>
            Select an event to copy the selected participants to.
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
          <Button onClick={handleConfirm} disabled={!targetEventId}>
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Events() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"portfolio" | "manage">("portfolio");
  
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
      <div className="space-y-8 animate-fade-up">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
          <div className="relative">
            <h1 className="text-3xl font-semibold tracking-tight">
              Events
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {(events || []).length ?? 0} events configured
            </p>
          </div>
          
          {user && (
            <div className="flex items-center gap-2 bg-surface-low p-1.5 rounded-full border border-border/20 self-start md:self-auto shadow-2xl backdrop-blur-xl">
                <Button 
                variant={viewMode === "portfolio" ? "default" : "ghost"} 
                size="sm" 
                className={cn("h-9 px-4 text-sm font-medium transition-all", viewMode === "portfolio" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white")}
                onClick={() => setViewMode("portfolio")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Portfolio
              </Button>
              <Button 
                variant={viewMode === "manage" ? "default" : "ghost"} 
                size="sm" 
                className={cn("h-9 px-4 text-sm font-medium transition-all", viewMode === "manage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white")}
                onClick={() => setViewMode("manage")}
              >
                <List className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          )}
        </div>

        {viewMode === "portfolio" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {(events || []).map((ev) => (
              <div 
                key={ev.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 bg-surface border border-border hover:border-primary/30"
                onClick={() => setSelectedEventId(ev.id)}
              >
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-xs font-medium px-2 py-0.5">
                      {ev.teamSize > 1 ? 'Team' : 'Solo'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {ev.participations?.length || 0} participants
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground">
                    {ev.name}
                  </h3>

                  <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Points</span>
                      <span className="text-sm font-mono font-medium">{ev.participationPoints}</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Prize</span>
                      <span className="text-sm font-mono font-medium">{ev.firstPrizePoints}</span>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            {user && (
              <div 
                className="group relative rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center gap-3 bg-transparent cursor-pointer min-h-[200px]"
                onClick={() => navigate("/events/add")}
              >
                <div className="h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Add Event</p>
              </div>
            )}
          </div>
        ) : (
            <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-table-header">Event Name</TableHead>
                  <TableHead className="text-table-header w-24">Team Size</TableHead>
                  <TableHead className="text-table-header w-28">Points</TableHead>
                  <TableHead className="text-table-header w-36">Prize (1st/2nd/3rd)</TableHead>
                  <TableHead className="text-table-header w-24">Participants</TableHead>
                  <TableHead className="text-table-header w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events || []).map((ev) => (
                  <TableRow 
                    key={ev.id} 
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-table-cell font-medium cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>
                      {ev.name}
                    </TableCell>
                    <TableCell className="text-table-cell cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>{ev.teamSize}</TableCell>
                    <TableCell className="cursor-pointer font-mono text-table-cell-sm" onClick={() => setSelectedEventId(ev.id)}>{ev.participationPoints}</TableCell>
                    <TableCell className="cursor-pointer font-mono text-table-cell-sm" onClick={() => setSelectedEventId(ev.id)}>
                      {ev.firstPrizePoints} / {ev.secondPrizePoints} / {ev.thirdPrizePoints}
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-medium">
                        {ev.participations?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); handleEditClick(ev); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{ev.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void deleteEvent(ev.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Back Control */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedEventId(null); setSearchQuery(""); }} 
            className="group flex items-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Events</span>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {selectedEvent?.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 mt-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Team Size</span>
              <span className="text-sm font-medium">{selectedEvent?.teamSize} {selectedEvent?.teamSize === 1 ? 'person' : 'people'}</span>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Participation Points</span>
              <span className="text-sm font-medium font-mono">{selectedEvent?.participationPoints}</span>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Prize Points</span>
              <span className="text-sm font-medium font-mono">{selectedEvent?.firstPrizePoints} / {selectedEvent?.secondPrizePoints} / {selectedEvent?.thirdPrizePoints}</span>
            </div>
          </div>
        </div>
      </div>

      {!detailsDenied && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Participants</p>
            <p className="text-3xl font-semibold">{(roster || []).length}</p>
          </div>
          
          <div className="bg-surface rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">1st Prize</p>
            <p className="text-3xl font-semibold font-mono">{selectedEvent?.firstPrizePoints}</p>
          </div>

          <div className="bg-surface rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">2nd Prize</p>
            <p className="text-3xl font-semibold font-mono">{selectedEvent?.secondPrizePoints}</p>
          </div>

          <div className="bg-surface rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground mb-1">3rd Prize</p>
            <p className="text-3xl font-semibold font-mono">{selectedEvent?.thirdPrizePoints}</p>
          </div>
        </div>
      )}

      {/* Participants Section */}
      {user && !participantsDenied && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Add Participants</h2>
              <p className="text-sm text-muted-foreground mt-1">Search and add participants to this event</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-background border-input"
                />
              </div>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger className="w-32 h-10">
                  <SelectValue placeholder="All colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All colleges</SelectItem>
                  {(colleges || []).map((c) => (
                    <SelectItem key={c.id} value={c.code}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-sm font-medium">ID</TableHead>
                  <TableHead className="text-sm font-medium">Name</TableHead>
                  <TableHead className="text-sm font-medium">College</TableHead>
                  <TableHead className="text-sm font-medium w-24">Dummy ID</TableHead>
                  <TableHead className="text-sm font-medium w-24">Team ID</TableHead>
                  <TableHead className="text-sm font-medium w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantsToShow.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      {searchQuery.trim() ? "No participants found matching your search." : "No participants available to add."}
                    </TableCell>
                  </TableRow>
                ) : (
                  participantsToShow.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm text-muted-foreground">{p.participantId}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.college?.code}</TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm font-mono"
                          placeholder="Optional"
                          value={checkInDetails[p.id]?.dummyId || ''}
                          onChange={(e) => handleCheckInChange(p.id, 'dummyId', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 text-sm font-mono"
                          placeholder="Optional"
                          value={checkInDetails[p.id]?.teamId || ''}
                          onChange={(e) => handleCheckInChange(p.id, 'teamId', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => void markPresent(p.id)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Participant List */}
          <div className="space-y-6 pt-6 border-t border-border">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Participants ({filteredRoster.length})</h2>
                <p className="text-sm text-muted-foreground mt-1">Participants registered for this event</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search participants..."
                    value={rosterSearchQuery}
                    onChange={(e) => setRosterSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!hasPendingChanges}
                  onClick={() => void handleParticipationUpdate()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 p-4">
                      <Checkbox
                        checked={selectedParticipations.length === filteredRoster.length && filteredRoster.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-sm font-medium p-4">ID</TableHead>
                    <TableHead className="text-sm font-medium p-4">Name</TableHead>
                    <TableHead className="text-sm font-medium p-4">College</TableHead>
                    <TableHead className="text-sm font-medium p-4">Dummy ID</TableHead>
                    <TableHead className="text-sm font-medium p-4">Team ID</TableHead>
                    <TableHead className="text-sm font-medium p-4">Position</TableHead>
                    <TableHead className="text-sm font-medium p-4 w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoster.map((r) => {
                      const result = (results || []).find(res => res.participantId === r.participantId);
                      const pendingParticipation = pendingChanges.participations[r.id] || {};
                      const dummyIdValue = pendingParticipation.dummyId !== undefined ? pendingParticipation.dummyId : (r.dummyId || '');
                      const teamIdValue = pendingParticipation.teamId !== undefined ? pendingParticipation.teamId : (r.teamId || '');

                      return (
                        <TableRow 
                          key={r.id} 
                          data-state={selectedParticipations.includes(r.id) && "selected"} 
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="p-4">
                            <Checkbox
                              checked={selectedParticipations.includes(r.id)}
                              onCheckedChange={() => toggleSelectOne(r.id)}
                            />
                          </TableCell>
                          <TableCell className="p-4 font-mono text-sm text-muted-foreground">{r.participant?.participantId}</TableCell>
                          <TableCell className="p-4 font-medium">{r.participant?.name}</TableCell>
                          <TableCell className="p-4 text-muted-foreground">{r.participant?.college?.code}</TableCell>
                          <TableCell className="p-4">
                            <Input
                              className="h-8 text-sm font-mono"
                              value={dummyIdValue}
                              onChange={(e) => handleFieldChange(r.id, 'dummyId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-4">
                            <Input
                              className="h-8 text-sm font-mono"
                              value={teamIdValue}
                              onChange={(e) => handleFieldChange(r.id, 'teamId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-4">
                            {resultsDenied ? (
                                <span className="text-sm text-muted-foreground">—</span>
                            ) : (
                                <Select
                                    value={result?.position || "none"}
                                    onValueChange={(val) => void handlePositionChange(r.participantId, val === "none" ? null : val as Position)}
                                >
                                    <SelectTrigger className="h-8 w-24 text-sm">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">—</SelectItem>
                                        <SelectItem value="FIRST">1st</SelectItem>
                                        <SelectItem value="SECOND">2nd</SelectItem>
                                        <SelectItem value="THIRD">3rd</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                          </TableCell>
                          <TableCell className="p-4 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
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
                                  <AlertDialogAction onClick={() => void removeFromEvent(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                  })}
                  {filteredRoster.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        <p className="text-sm">
                          {(roster || []).length > 0 ? "No participants found in your search." : "No participants added yet."}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Action Bar */}
            {selectedParticipations.length > 0 && (
              <div className="sticky bottom-6 left-0 right-0 flex justify-center z-50 px-6">
                <div className="bg-surface border border-border px-4 py-2 rounded-lg flex items-center gap-4 shadow-lg">
                  <p className="text-sm text-muted-foreground">
                    {selectedParticipations.length} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <BulkCopyDialog
                      open={isBulkCopyDialogOpen}
                      onOpenChange={setIsBulkCopyDialogOpen}
                      events={(events || []).filter(e => e.id !== selectedEventId)}
                      onConfirm={handleBulkCopy}
                      disabled={selectedParticipations.length === 0}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
