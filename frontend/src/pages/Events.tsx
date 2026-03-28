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
      mapped_toast('Please select a target event.', 'warning')
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs pill border-border/40 hover:border-primary/50 transition-colors" disabled={disabled}>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Bulk Copy
        </Button>
      </DialogTrigger>
      <DialogContent className="stat-card border-border/40">
        <DialogHeader>
          <DialogTitle className="heading-display">Bulk Copy Participants</DialogTitle>
          <DialogDescription>
            Select a target event to copy the selected participants to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Select onValueChange={setTargetEventId} value={targetEventId}>
            <SelectTrigger className="pill bg-muted/30 border-border/40 focus:border-primary/50">
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
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="pill">Cancel</Button>
          <Button onClick={handleConfirm} disabled={!targetEventId} className="btn-teal-gradient shadow-teal-sm pill px-6">
            Confirm Copy
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
            <p className="section-label mb-2 opacity-100 text-primary font-bold tracking-[0.2em] dot-prefix pl-3">MANAGEMENT</p>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter heading-display leading-[0.85] uppercase">
              Event<br />
              <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1px var(--on-surface-variant)', opacity: 0.3 }}>Portfolio</span>
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span>
              {(events || []).length ?? 0} specialized modules active
            </p>
          </div>
          
          {user && (
            <div className="flex items-center gap-2 bg-surface-low p-1.5 rounded-full border border-border/20 self-start md:self-auto shadow-2xl backdrop-blur-xl">
              <Button 
                variant={viewMode === "portfolio" ? "default" : "ghost"} 
                size="sm" 
                className={cn("rounded-full h-9 px-4 text-xs font-bold tracking-tight transition-all", viewMode === "portfolio" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white")}
                onClick={() => setViewMode("portfolio")}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-2" />
                PORTFOLIO
              </Button>
              <Button 
                variant={viewMode === "manage" ? "default" : "ghost"} 
                size="sm" 
                className={cn("rounded-full h-9 px-4 text-xs font-bold tracking-tight transition-all", viewMode === "manage" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white")}
                onClick={() => setViewMode("manage")}
              >
                <List className="h-3.5 w-3.5 mr-2" />
                MANAGE
              </Button>
            </div>
          )}
        </div>

        {viewMode === "portfolio" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {(events || []).map((ev, idx) => (
              <div 
                key={ev.id}
                className={cn(
                  "group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-700 bg-surface-low border border-white/5 hover:border-primary/30 shadow-2xl",
                  idx % 3 === 1 ? "md:mt-12" : "",
                  idx % 3 === 2 ? "md:mt-6" : ""
                )}
                onClick={() => setSelectedEventId(ev.id)}
              >
                {/* Immersive background gradient */}
                <div className="absolute inset-0 z-0 text-white/5">
                  <div className={cn(
                    "absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700",
                    idx % 4 === 0 ? "bg-gradient-to-br from-primary/40 via-purple-900/40 to-black" :
                    idx % 4 === 1 ? "bg-gradient-to-tr from-blue-600/40 via-teal-900/40 to-black" :
                    idx % 4 === 2 ? "bg-gradient-to-bl from-rose-600/40 via-orange-900/40 to-black" :
                    "bg-gradient-to-br from-emerald-600/40 via-indigo-900/40 to-black"
                  )} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
                  <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full p-8 flex flex-col justify-end gap-4 transform group-hover:translate-y-[-8px] transition-transform duration-500">
                  <div>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] uppercase tracking-[0.2em] font-black text-primary backdrop-blur-md px-3 py-1 mb-3">
                      LEVEL: {ev.teamSize > 1 ? 'TEAM' : 'SOLO'}
                    </Badge>
                    <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tighter mb-1">
                      {ev.name.split(' ').map((word, i) => (
                        <span key={i} className={i % 2 === 1 ? 'text-primary' : ''}>{word} </span>
                      ))}
                    </h3>
                    <p className="text-sm text-on-surface-variant/80 font-medium line-clamp-2 max-w-[80%]">
                      Competitive integrity and technical excellence are mandated for the {ev.name} arena.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Points</span>
                        <span className="text-sm font-mono text-white font-bold">+{ev.participationPoints}</span>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Roster</span>
                        <span className="text-sm font-mono text-white font-bold">{ev.participations?.length || 0}</span>
                      </div>
                    </div>
                    
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Floating labels */}
                <div className="absolute top-8 right-8 z-20 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase vertical-text">MODULE_{String(idx + 1).padStart(2, '0')}</p>
                </div>
              </div>
            ))}

            {user && (
              <div 
                className="group relative aspect-[4/5] rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-transparent mt-6 md:mt-0 cursor-pointer"
                onClick={() => navigate("/events/add")}
              >
                <div className="h-16 w-16 rounded-full bg-surface-low border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">INITIATE_NEW_EVENT</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-low/30 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl border border-white/5 backdrop-blur-xl">
            <Table>
              <TableHeader className="bg-transparent border-none">
                <TableRow className="hover:bg-transparent border-none shadow-none">
                  <TableHead className="section-label">Event Name</TableHead>
                  <TableHead className="section-label w-24">Team Size</TableHead>
                  <TableHead className="section-label w-32">Participation Pts</TableHead>
                  <TableHead className="section-label w-40">Prize Points (1/2/3)</TableHead>
                  <TableHead className="section-label w-24">Roster</TableHead>
                  <TableHead className="section-label w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events || []).map((ev) => (
                  <TableRow 
                    key={ev.id} 
                    className="bg-surface-lowest hover:bg-surface-high transition-all duration-300 border-none group relative shadow-sm"
                  >
                    <TableCell className="font-semibold cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>
                      <div className="flex items-center gap-2">
                        <span className="dot-prefix"></span>
                        {ev.name}
                      </div>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>{ev.teamSize}</TableCell>
                    <TableCell className="cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>{ev.participationPoints}</TableCell>
                    <TableCell className="font-mono text-xs cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>
                      {ev.firstPrizePoints} / {ev.secondPrizePoints} / {ev.thirdPrizePoints}
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => setSelectedEventId(ev.id)}>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 pill px-2 py-0.5 text-[10px] font-bold">
                        <Users className="h-3 w-3 mr-1" />
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
                              <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the "{ev.name}" event.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void deleteEvent(ev.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Yes, delete
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
    <div className="space-y-10 min-h-screen animate-fade-up pb-20">
      {/* Editorial Header & Back Control */}
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedEventId(null); setSearchQuery(""); }} 
            className="group flex items-center gap-2 hover:bg-primary/10 transition-all rounded-full px-4 border border-white/5"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Return to Portfolio</span>
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border border-primary/30 pill text-[10px] font-black tracking-widest px-4 py-1.5 animate-pulse">
              SYSTEM_ACTIVE
            </Badge>
          </div>
        </div>

        <div className="relative">
          <p className="section-label mb-3 opacity-100 text-primary font-bold tracking-[0.2em] dot-prefix pl-3 uppercase">Module Details</p>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter heading-display leading-[0.85] uppercase">
            {selectedEvent?.name.split(' ')[0]}<br />
            <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1.2px var(--on-surface-variant)', opacity: 0.35 }}>
              {selectedEvent?.name.split(' ').slice(1).join(' ') || 'Arena'}
            </span>
          </h1>
          
          <div className="flex flex-wrap items-center gap-8 mt-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Category</span>
              <span className="text-sm font-black text-white uppercase tracking-tight">Technical_Module</span>
            </div>
            <div className="h-10 w-px bg-white/10 hidden md:block" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Arena Status</span>
              <span className="text-sm font-black text-white uppercase tracking-tight">Main Competitive</span>
            </div>
            <div className="h-10 w-px bg-white/10 hidden md:block" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Last Updated</span>
              <span className="text-sm font-black text-white uppercase tracking-tight">Cycle_Current_01</span>
            </div>
          </div>
        </div>
      </div>

      {!detailsDenied && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-10 border-t border-white/10">
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-surface-low rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                <Users className="h-12 w-12" />
              </div>
              <p className="section-label mb-2 opacity-60 uppercase tracking-[0.1em] font-bold">Participation</p>
              <p className="text-6xl font-black text-white tracking-tighter">{(roster || []).length}</p>
              <p className="text-[10px] mt-2 text-primary font-black tracking-widest uppercase">Validated Minds</p>
            </div>
            
            <div className="bg-surface-low rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                <Trophy className="h-12 w-12" />
              </div>
              <p className="section-label mb-2 opacity-60 uppercase tracking-[0.1em] font-bold">Points Pool</p>
              <p className="text-5xl font-black text-white tracking-tighter">
                {selectedEvent?.firstPrizePoints}
                <span className="text-2xl text-muted-foreground">/{selectedEvent?.secondPrizePoints}</span>
              </p>
              <p className="text-[10px] mt-4 text-primary font-black tracking-widest uppercase">Max Efficiency</p>
            </div>

            <div className="bg-surface-low rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl col-span-2 md:col-span-1">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                <Calendar className="h-12 w-12" />
              </div>
              <p className="section-label mb-2 opacity-60 uppercase tracking-[0.1em] font-bold">Logistics</p>
              <p className="text-2xl font-black text-white uppercase tracking-tighter leading-tight mt-2">
                Arena A<br />
                <span className="text-primary tracking-widest text-sm">Active_Session</span>
              </p>
              <div className="mt-6 flex items-center gap-2">
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary uppercase text-[8px] font-black py-0.5">Primary</Badge>
                <Badge variant="outline" className="rounded-full border-white/10 text-muted-foreground uppercase text-[8px] font-black py-0.5">Secured</Badge>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 bg-surface-lowest rounded-[2.5rem] p-8 flex flex-col justify-between border border-white/5 shadow-inner">
            <div className="space-y-4">
              <h3 className="section-label opacity-100 text-white font-bold tracking-[0.2em] dot-prefix pl-3 uppercase">Module Config</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                System parameters for {selectedEvent?.name} are locked for competitive integrity. Any manual overrides must be signed by the administrator.
              </p>
            </div>
            
            {user && (
              <div className="flex items-center gap-2 mt-10">
                <Button 
                  onClick={() => handleEditClick(selectedEvent!)} 
                  className="btn-teal-gradient h-12 flex-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-teal/10"
                >
                  Modify_Module
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border border-white/10 hover:bg-white/5"
                  onClick={() => setSelectedEventId(null)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!user && (
              <div className="flex items-center gap-2 mt-10">
                <Button 
                  variant="outline"
                  className="h-12 flex-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase opacity-50 cursor-not-allowed border-white/10"
                  disabled
                >
                  View_Mode_Only
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border border-white/10 hover:bg-white/5 text-primary"
                  onClick={() => setSelectedEventId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roster & Interaction Console */}
      {user && !participantsDenied && (
        <div className="space-y-12 mt-20 pt-10 border-t border-white/10">
          {/* Phase 01: Identification & Induction */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="section-label mb-1 text-primary font-bold tracking-[0.2em] dot-prefix pl-3 uppercase">Roster Operations</p>
                <h2 className="text-4xl font-black tracking-tighter uppercase">Induct_Participants</h2>
              </div>
              
              <div className="flex items-center gap-3 bg-surface-low p-2 rounded-full border border-white/5 shadow-2xl">
                <div className="relative w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    placeholder="Search IDs or Identities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-10 bg-surface-lowest border-none focus-visible:ring-primary/20 transition-all rounded-full text-xs font-bold tracking-tight shadow-inner"
                  />
                </div>
                <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger className="w-24 h-10 rounded-full bg-surface-lowest border-none text-[10px] font-black tracking-widest text-primary uppercase pl-4">
                    <SelectValue placeholder="CLG" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-low border-white/10 backdrop-blur-3xl rounded-3xl">
                    <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">ALL</SelectItem>
                    {(colleges || []).map((c) => (
                      <SelectItem key={c.id} value={c.code} className="text-[10px] font-bold uppercase tracking-widest">{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-surface-low/30 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl border border-white/5 backdrop-blur-xl max-h-[500px] overflow-y-auto scrollbar-wizardly">
              <Table>
                <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">ID</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">Identify</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">Origin</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">D_ID</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">T_ID</TableHead>
                    <TableHead className="section-label text-right p-5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantsToShow.length === 0 ? (
                    <TableRow className="bg-transparent border-none">
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-20 text-xs italic opacity-40 tracking-[0.1em] uppercase">
                        {searchQuery.trim() ? "System reflects zero matches." : "Awaiting induction commands."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    participantsToShow.map((p) => (
                      <TableRow key={p.id} className="bg-surface-lowest/50 hover:bg-surface-high border-none transition-all duration-300 group shadow-sm mb-2 rounded-2xl">
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{p.participantId}</TableCell>
                        <TableCell className="text-sm font-black text-white uppercase tracking-tight">{p.name}</TableCell>
                        <TableCell className="text-[10px] text-primary font-black tracking-widest uppercase opacity-80">{p.college?.code}</TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-20 text-[10px] font-mono bg-surface-low border-white/5 rounded-lg focus:border-primary/50 transition-all"
                            placeholder="D_ID"
                            value={checkInDetails[p.id]?.dummyId || ''}
                            onChange={(e) => handleCheckInChange(p.id, 'dummyId', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-16 text-[10px] font-mono bg-surface-low border-white/5 rounded-lg focus:border-primary/50 transition-all"
                            placeholder="T_ID"
                            value={checkInDetails[p.id]?.teamId || ''}
                            onChange={(e) => handleCheckInChange(p.id, 'teamId', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-95" 
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
          </div>

          {/* Phase 02: Validated Archive */}
          <div className="space-y-6 pt-10 border-t border-white/10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="section-label mb-1 text-primary font-bold tracking-[0.2em] dot-prefix pl-3 uppercase">Archived Entities</p>
                <h2 className="text-4xl font-black tracking-tighter uppercase">Roster_Inventory ({filteredRoster.length})</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input
                    placeholder="Search roster..."
                    value={rosterSearchQuery}
                    onChange={(e) => setRosterSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-surface-low border-white/5 focus-visible:ring-primary/10 transition-all rounded-full text-xs font-bold shadow-inner"
                  />
                </div>
                <div className="h-8 w-px bg-white/10" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all px-6 border",
                    hasPendingChanges ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "text-muted-foreground border-white/5 hover:bg-white/5"
                  )}
                  disabled={!hasPendingChanges}
                  onClick={() => void handleParticipationUpdate()}
                >
                  <Save className="h-3 w-3 mr-2" />
                  Sync_Cycle
                </Button>
              </div>
            </div>

            <div className="bg-surface-lowest rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 p-2">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-12 p-5">
                      <Checkbox
                        checked={selectedParticipations.length === filteredRoster.length && filteredRoster.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">ID</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">Identity</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">Origin</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">D_ID</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5">T_ID</TableHead>
                    <TableHead className="section-label uppercase tracking-[0.2em] font-black text-[10px] p-5 text-right"></TableHead>
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
                          className="bg-surface-lowest/40 hover:bg-surface-high border-none transition-all duration-300 group shadow-sm mb-2 rounded-2xl"
                        >
                          <TableCell className="p-5">
                            <Checkbox
                              checked={selectedParticipations.includes(r.id)}
                              onCheckedChange={() => toggleSelectOne(r.id)}
                              className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                          </TableCell>
                          <TableCell className="p-5 font-mono text-[10px] text-muted-foreground">{r.participant?.participantId}</TableCell>
                          <TableCell className="p-5 text-sm font-black text-white uppercase tracking-tight">{r.participant?.name}</TableCell>
                          <TableCell className="p-5 text-[10px] text-primary font-black tracking-widest uppercase opacity-80">{r.participant?.college?.code}</TableCell>
                          <TableCell className="p-5">
                            <Input
                              className="h-8 w-24 text-[10px] font-mono bg-surface-low border-white/5 rounded-lg"
                              value={dummyIdValue}
                              onChange={(e) => handleFieldChange(r.id, 'dummyId', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-5">
                            <Input
                              className="h-8 w-20 text-[10px] font-mono bg-surface-low border-white/5 rounded-lg"
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
                                    <SelectTrigger className="h-7 w-24 text-xs bg-muted/30 border-border/40 hover:border-primary/50 transition-colors pill">
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
                          <TableCell className="text-right pr-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
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
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">
                          {(roster || []).length > 0 ? "No participants found in your search." : "No participants marked present yet."}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Floating Action Bar */}
            <div className="sticky bottom-6 left-0 right-0 flex justify-center z-50 px-6">
              <div className="glass teal-glow px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl">
                <p className="text-[10px] section-label text-primary/80 border-r border-primary/20 pr-4 mr-0">
                  {selectedParticipations.length} Selected
                </p>
                <div className="flex items-center gap-2">
                  <BulkCopyDialog
                    open={isBulkCopyDialogOpen}
                    onOpenChange={setIsBulkCopyDialogOpen}
                    events={(events || []).filter(e => e.id !== selectedEventId)}
                    onConfirm={handleBulkCopy}
                    disabled={selectedParticipations.length === 0}
                  />
                  
                  <div className="w-px h-4 bg-border/40 mx-1" />
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs pill hover:bg-primary/10 transition-colors"
                    onClick={() => handleEditClick(selectedEvent!)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs pill text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{selectedEvent?.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void deleteEvent(selectedEventId!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Confirm Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
