import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eventService, eventParticipationService, eventResultService } from "@/api/services";
import { FestEvent, EventParticipation, EventResult } from "@/api/types";
import { mapped_toast } from "@/lib/toast_map.ts";
import { cn } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";

const POSITIONS: { key: "FIRST" | "SECOND" | "THIRD"; label: string; icon: React.ReactNode; card: string; rank: string }[] = [
  {
    key: "FIRST",
    label: "1st Place",
    icon: <Trophy className="h-5 w-5 text-yellow-400" />,
    card: "bg-yellow-400/10 border border-yellow-400/25",
    rank: "text-yellow-400",
  },
  {
    key: "SECOND",
    label: "2nd Place",
    icon: <Medal className="h-5 w-5 text-zinc-300" />,
    card: "bg-zinc-300/10 border border-zinc-300/20",
    rank: "text-zinc-300",
  },
  {
    key: "THIRD",
    label: "3rd Place",
    icon: <Medal className="h-5 w-5 text-amber-600" />,
    card: "bg-amber-600/10 border border-amber-600/20",
    rank: "text-amber-600",
  },
];

export default function Results() {
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      void loadEventData(parseInt(selectedEventId));
    } else {
      setParticipations([]);
      setResults([]);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAll({ take: 100 });
      setEvents(response.items);
    } catch (error: unknown) {
      if ((error as any)?.response?.status === 403) {
        mapped_toast("You do not have access to events data.", "warning", true);
        return;
      }
      mapped_toast("Failed to load events.", "error");
      console.error("Failed to load events", error);
    }
  };

  const loadEventData = async (eventId: number) => {
    try {
      const resultsRes = await eventResultService.getAll({
        filters: JSON.stringify({ eventId, position: { in: ["FIRST", "SECOND", "THIRD"] } }),
        includeRelations: true,
        take: 3,
      });

      const participantIds = resultsRes.items.map((r) => r.participantId);

      if (participantIds.length > 0) {
        const partsRes = await eventParticipationService.getAll({
          filters: JSON.stringify({ eventId, participantId: { in: participantIds } }),
          includeRelations: true,
          take: 3,
        });
        setParticipations(partsRes.items);
      } else {
        setParticipations([]);
      }

      setResults(resultsRes.items);
    } catch (error: unknown) {
      if ((error as any)?.response?.status === 403) {
        mapped_toast("You do not have access to event data.", "warning", true);
        return;
      }
      mapped_toast("Failed to load event data.", "error");
      console.error("Failed to load event data", error);
    }
  };

  const selectedEvent = events.find((e) => e.id === parseInt(selectedEventId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading">Results</h2>
          <p className="text-body text-muted-foreground mt-1">Event winners</p>
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
        <div className="space-y-4">
          {selectedEvent && (
            <p className="text-sm text-muted-foreground font-medium">{selectedEvent.name}</p>
          )}

          {results.length === 0 ? (
            <div className="flex items-center justify-center h-40 rounded-xl border border-dashed text-muted-foreground text-sm">
              No results recorded for this event yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {POSITIONS.map(({ key, label, icon, card, rank }) => {
                const result = results.find((r) => r.position === key);
                const participation = result
                  ? participations.find((p) => p.participantId === result.participantId)
                  : null;
                const participant = result?.participant ?? participation?.participant;

                return (
                  <div key={key} className={cn("rounded-xl p-5 flex flex-col gap-3", card)}>
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className={cn("text-xs font-bold uppercase tracking-widest", rank)}>{label}</span>
                    </div>
                    {participant ? (
                      <div>
                        <p className="font-semibold text-white text-base leading-tight">{participant.name}</p>
                        <p className="text-xs text-[#bcc9c5] mt-0.5">{participant.college?.name}</p>
                        <p className="text-xs text-[#bcc9c5] font-mono">{participant.college?.code}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not assigned</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
