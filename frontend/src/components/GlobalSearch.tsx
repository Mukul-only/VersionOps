import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppRole, hasPermission, ROUTE_PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/contexts/AuthContext";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
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
        placeholder="Search identities, systemic nodes, modules..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="scrollbar-wizardly">
        <CommandEmpty>No resonance detected for this query.</CommandEmpty>
        <CommandGroup heading="Systemic Nodes">
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
                <page.icon className="mr-3 h-4 w-4 text-primary opacity-80 group-data-[selected=true]:opacity-100 group-data-[selected=true]:scale-110 transition-all font-black" />
                <span className="flex-1 text-white opacity-90 group-data-[selected=true]:opacity-100 transition-opacity">{page.name}</span>
                <CommandShortcut>GO_TO_NODE</CommandShortcut>
              </CommandItem>
            ))}
        </CommandGroup>
        {participants.length > 0 && canNavigate("/participants") && (
          <CommandGroup heading="Validated Identities">
            {participants.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  navigate("/participants");
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-data-[selected=true]:bg-primary group-data-[selected=true]:text-primary-foreground transition-all">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-primary font-black uppercase tracking-widest">{p.participantId}</span>
                    <span className="text-sm font-black tracking-tight text-white">{p.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-data-[selected=true]:text-white/80">{p.college?.code}</span>
                  <CommandShortcut>VIEW_INTEL</CommandShortcut>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
