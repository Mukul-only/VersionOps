import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { eventService, eventParticipationService, eventResultService } from "@/api/services";
import { FestEvent, EventParticipation, EventResult } from "@/api/types";

export default function Results() {
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(parseInt(selectedEventId));
    } else {
      setParticipations([]);
      setResults([]);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAll({ take: 100 });
      setEvents(response.items);
    } catch (error) {
      toast.error("Failed to load events");
    }
  };

  const loadEventData = async (eventId: number) => {
    try {
      const [partsRes, resultsRes] = await Promise.all([
        eventParticipationService.getAll({ filters: JSON.stringify({ eventId }), includeRelations: true, take: 1000 }),
        eventResultService.getAll({ filters: JSON.stringify({ eventId }), includeRelations: true, take: 100 })
      ]);
      setParticipations(partsRes.items);
      setResults(resultsRes.items);
    } catch (error) {
      toast.error("Failed to load event data");
    }
  };

  const setPosition = async (participantId: number, position: string) => {
    if (!selectedEventId) return;
    const eventId = parseInt(selectedEventId);

    try {
      const existingResult = results.find(r => r.participantId === participantId);
      
      if (position === "none") {
        if (existingResult) {
          await eventResultService.delete(existingResult.id);
          setResults(prev => prev.filter(r => r.id !== existingResult.id));
          toast.success("Position cleared");
        }
      } else {
        const posEnum = position as "FIRST" | "SECOND" | "THIRD";
        
        // Check if position is taken by someone else and clear it (optional but good UX)
        const currentHolder = results.find(r => r.position === posEnum);
        if (currentHolder && currentHolder.participantId !== participantId) {
           await eventResultService.delete(currentHolder.id);
           setResults(prev => prev.filter(r => r.id !== currentHolder.id));
        }

        if (existingResult) {
          const updated = await eventResultService.update(existingResult.id, { position: posEnum });
          setResults(prev => prev.map(r => r.id === updated.id ? updated : r));
        } else {
          const created = await eventResultService.create({
            eventId,
            participantId,
            position: posEnum
          });
          setResults(prev => [...prev, created]);
        }
        toast.success(`Position set to ${position}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update result");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Results</h2>
          <p className="text-sm text-muted-foreground">Enter event results</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select event..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((ev) => (
              <SelectItem key={ev.id} value={ev.id.toString()}>{ev.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEventId && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Dummy ID</TableHead>
                <TableHead className="w-36">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participations.map((p) => {
                const result = results.find(r => r.participantId === p.participantId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.participant?.participantId}</TableCell>
                    <TableCell className="font-medium">{p.participant?.name}</TableCell>
                    <TableCell>{p.participant?.college?.code}</TableCell>
                    <TableCell className="font-mono text-xs">{p.dummyId}</TableCell>
                    <TableCell>
                      <Select 
                        value={result?.position || "none"} 
                        onValueChange={(v) => setPosition(p.participantId, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="FIRST">🥇 First</SelectItem>
                          <SelectItem value="SECOND">🥈 Second</SelectItem>
                          <SelectItem value="THIRD">🥉 Third</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
              {participations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No participants in this event. Add them from the Events page first.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
