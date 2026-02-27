import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { eventService, eventParticipationService, eventResultService } from "@/api/services";
import { FestEvent, EventParticipation, EventResult } from "@/api/types";
import { Badge } from "@/components/ui/badge";

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
      const resultsRes = await eventResultService.getAll({ 
        filters: JSON.stringify({ eventId, position: { in: ['FIRST', 'SECOND', 'THIRD'] } }), 
        includeRelations: true, 
        take: 3 
      });
      
      const participantIds = resultsRes.items.map(r => r.participantId);
      
      if (participantIds.length > 0) {
        const partsRes = await eventParticipationService.getAll({ 
          filters: JSON.stringify({ eventId, participantId: { in: participantIds } }), 
          includeRelations: true, 
          take: 3 
        });
        setParticipations(partsRes.items);
      } else {
        setParticipations([]);
      }
      
      setResults(resultsRes.items);
    } catch (error) {
      toast.error("Failed to load event data");
    }
  };

  const getPositionBadge = (position?: "FIRST" | "SECOND" | "THIRD") => {
    switch (position) {
      case 'FIRST':
        return <Badge className="bg-yellow-500 text-white">🥇 First</Badge>;
      case 'SECOND':
        return <Badge className="bg-gray-400 text-white">🥈 Second</Badge>;
      case 'THIRD':
        return <Badge className="bg-yellow-700 text-white">🥉 Third</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const positionOrder: { [key: string]: number } = {
    'FIRST': 1,
    'SECOND': 2,
    'THIRD': 3,
  };

  const sortedParticipations = [...participations].sort((a, b) => {
    const resultA = results.find(r => r.participantId === a.participantId);
    const resultB = results.find(r => r.participantId === b.participantId);
    const posA = resultA ? positionOrder[resultA.position] : 4;
    const posB = resultB ? positionOrder[resultB.position] : 4;
    return posA - posB;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Results</h2>
          <p className="text-sm text-muted-foreground">View event winners</p>
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
                <TableHead>Name</TableHead>
                <TableHead>College</TableHead>
                <TableHead className="w-36">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedParticipations.map((p) => {
                const result = results.find(r => r.participantId === p.participantId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.participant?.name}</TableCell>
                    <TableCell>{p.participant?.college?.code}</TableCell>
                    <TableCell>
                      {getPositionBadge(result?.position)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {participations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No results for this event yet.
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
