import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRole, hasPermission, ROUTE_PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/contexts/AuthContext";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Users, CalendarDays, Building2, LayoutDashboard, Trophy, Medal } from "lucide-react";
import { participantService } from "@/api/services";
import { Participant } from "@/api/types";

const pages = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Participants", path: "/participants", icon: Users },
  { name: "Colleges", path: "/colleges", icon: Building2 },
  { name: "Events", path: "/events", icon: CalendarDays },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Results", path: "/results", icon: Medal },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role as AppRole | undefined;

  const canNavigate = (path: string) => {
    const required = ROUTE_PERMISSIONS[path];
    if (!required) return true;
    return hasPermission(role, required);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setParticipants([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchParticipants();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setParticipants([]);
    }
  }, [query]);

  const searchParticipants = async () => {
    try {
      const response = await participantService.getAll({ search: query, take: 10, includeRelations: true });
      setParticipants(response.items);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search participants, pages..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages
            .filter((page) => canNavigate(page.path))
            .map((page) => (
              <CommandItem
                key={page.path}
                onSelect={() => {
                  navigate(page.path);
                  setOpen(false);
                }}
              >
                <page.icon className="mr-2 h-4 w-4" />
                {page.name}
              </CommandItem>
            ))}
        </CommandGroup>
        {participants.length > 0 && canNavigate("/participants") && (
          <CommandGroup heading="Participants">
            {participants.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  navigate("/participants");
                  setOpen(false);
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                <span className="font-mono text-xs mr-2">{p.participantId}</span>
                {p.name}
                <span className="ml-auto text-xs text-muted-foreground">{p.college?.code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
