import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Trophy,
  Medal,
  Command,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppPermission, AppRole, hasAnyPermission } from "@/lib/rbac";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", requiredPermissions: [] },
  {
    label: "Participants",
    icon: Users,
    basePath: "/participants",
    requiredPermissions: ["participant-read", "participant-create"],
    subItems: [
      { to: "/participants", label: "View Participants", requiredPermissions: ["participant-read"] },
      { to: "/participants/add", label: "Add Participant", requiredPermissions: ["participant-create"] },
    ],
  },
  {
    label: "Colleges",
    icon: Building2,
    basePath: "/colleges",
    requiredPermissions: ["college-read", "college-create"],
    subItems: [
      { to: "/colleges", label: "View Colleges", requiredPermissions: ["college-read"] },
      { to: "/colleges/add", label: "Add College", requiredPermissions: ["college-create"] },
    ],
  },
  {
    label: "Events",
    icon: CalendarDays,
    basePath: "/events",
    requiredPermissions: ["event-read", "event-create"],
    subItems: [
      { to: "/events", label: "View Events", requiredPermissions: ["event-read"] },
      { to: "/events/add", label: "Add Event", requiredPermissions: ["event-create"] },
    ],
  },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard", requiredPermissions: ["leaderboard-manage"] },
  { to: "/results", icon: Medal, label: "Results", requiredPermissions: ["result-manage"] },
];

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const { user, logout } = useAuth();
  const role = user?.role as AppRole | undefined;

  const canSee = (perms?: string[]) => {
    if (!perms || perms.length === 0) return true;
    return hasAnyPermission(role, perms as AppPermission[]);
  };

  useEffect(() => {
    const activeSection = navItems.find(
      (item) => item.basePath && location.pathname.startsWith(item.basePath)
    );
    if (activeSection) {
      setOpenSections((prev) => ({ ...prev, [activeSection.label]: true }));
    }
  }, [location.pathname]);

  const handleOpenChange = (label: string, isOpen: boolean) => {
    setOpenSections((prev) => ({ ...prev, [label]: isOpen }));
  };

  return (
    <aside className="w-56 h-full border-r bg-card flex flex-col shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Version'26
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Cognix</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems
          .filter((item) => {
            if (item.subItems) {
              return item.subItems.some((sub) => canSee(sub.requiredPermissions));
            }
            return canSee(item.requiredPermissions);
          })
          .map((item) =>
            item.subItems ? (
              <Collapsible
                key={item.label}
                open={openSections[item.label] || false}
                onOpenChange={(isOpen) => handleOpenChange(item.label, isOpen)}
              >
                <CollapsibleTrigger className="w-full group">
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
                      location.pathname.startsWith(item.basePath)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-1 pl-6">
                  <div className="space-y-1">
                    {item.subItems
                      .filter((subItem) => canSee(subItem.requiredPermissions))
                      .map((subItem) => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          end
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          )}
      </nav>

      <div className="p-3 border-t space-y-2">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <Command className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd className="ml-auto text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2 border rounded-md bg-muted/30">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user.role}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
}
