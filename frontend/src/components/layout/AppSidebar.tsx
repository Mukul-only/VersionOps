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
  UserCog,
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
  { to: "/", icon: LayoutDashboard, label: "Dashboard", requiredPermissions: ["dashboard-read"] },
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
  { to: "/users", icon: UserCog, label: "Users", requiredPermissions: ["users-manage"] },
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
    <aside
      className="w-64 h-full flex flex-col shrink-0"
      style={{
        background: "#0d0d0d",
        borderRight: "1px solid #222224",
      }}
    >
      {/* ── Brand / Logo area ── */}
      <div
        className="px-5 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1e1e20" }}
      >
        <div className="flex items-center gap-3">
          {/* White pill badge with Command icon — Wizardly signature */}
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              background: "#ffffff",
              padding: "6px",
              width: 32,
              height: 32,
            }}
          >
            <Command className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1
              className="text-sm font-bold leading-none tracking-tight"
              style={{ color: "#e3e3e3", letterSpacing: "-0.02em" }}
            >
              Version 26
            </h1>
            <p
              className="mt-1 font-bold"
              style={{
                fontSize: 10,
                color: "#5ecfba",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Cognix
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "#6b7280" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#1e1e22";
              (e.currentTarget as HTMLElement).style.color = "#e3e3e3";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#6b7280";
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                  <NavItemButton
                    isActive={location.pathname.startsWith(item.basePath!)}
                    icon={<item.icon className="h-4 w-4 shrink-0" />}
                    label={item.label}
                    right={
                      <ChevronDown
                        className="h-3.5 w-3.5 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180"
                        style={{ opacity: 0.45 }}
                      />
                    }
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1 pb-1">
                  {/* Indent guide line */}
                  <div className="relative ml-[18px] pl-4" style={{ borderLeft: "1px solid #1e1e20" }}>
                    <div className="space-y-0.5">
                      {item.subItems
                        .filter((subItem) => canSee(subItem.requiredPermissions))
                        .map((subItem) => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            end
                            onClick={onClose}
                            className="block"
                          >
                            {({ isActive }) => (
                              <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                                style={{
                                  background: isActive ? "#1a3d37" : "transparent",
                                  color: isActive ? "#7cebd6" : "#6b7280",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = "#161618";
                                    (e.currentTarget as HTMLElement).style.color = "#e3e3e3";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = "transparent";
                                    (e.currentTarget as HTMLElement).style.color = "#6b7280";
                                  }
                                }}
                              >
                                {/* Wizardly dot prefix for active sub-items */}
                                {isActive && (
                                  <span
                                    className="shrink-0 rounded-full"
                                    style={{
                                      width: 5,
                                      height: 5,
                                      background: "#5ecfba",
                                      boxShadow: "0 0 6px rgba(94,207,186,0.5)",
                                    }}
                                  />
                                )}
                                {subItem.label}
                              </div>
                            )}
                          </NavLink>
                        ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === "/"}
                onClick={onClose}
                className="block"
              >
                {({ isActive }) => (
                  <NavItemButton
                    isActive={isActive}
                    icon={<item.icon className="h-4 w-4 shrink-0" />}
                    label={item.label}
                  />
                )}
              </NavLink>
            )
          )}
      </nav>

      {/* ── Bottom: Search + User ── */}
      <div className="px-3 py-4 space-y-3" style={{ borderTop: "1px solid #1e1e20" }}>
        {/* Search shortcut — Wizardly pill style */}
        <button
          onClick={() =>
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
          }
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150"
          style={{
            color: "#6b7280",
            background: "#111113",
            border: "1px solid #222224",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#1a1a1e";
            (e.currentTarget as HTMLElement).style.color = "#e3e3e3";
            (e.currentTarget as HTMLElement).style.borderColor = "#2e2e34";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#111113";
            (e.currentTarget as HTMLElement).style.color = "#6b7280";
            (e.currentTarget as HTMLElement).style.borderColor = "#222224";
          }}
        >
          <Command className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd
            className="ml-auto font-mono"
            style={{
              fontSize: 10,
              background: "#1e1e22",
              border: "1px solid #2e2e34",
              color: "#6b7280",
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* User info */}
        {user && (
          <div
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl"
            style={{ background: "#111113", border: "1px solid #1e1e20" }}
          >
            <Avatar className="h-8 w-8 rounded-lg shrink-0" style={{ border: "1px solid #222224" }}>
              <AvatarFallback
                className="text-[10px] font-bold rounded-lg"
                style={{ background: "#1a3d37", color: "#7cebd6" }}
              >
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate leading-tight"
                style={{ color: "#e3e3e3" }}
              >
                {user.name}
              </p>
              <p
                className="mt-0.5 font-bold truncate"
                style={{
                  fontSize: 10,
                  color: "#5ecfba",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg shrink-0 transition-colors duration-150"
                  style={{ color: "#6b7280" }}
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="font-medium text-xs rounded-lg"
                style={{ background: "#1e1e22", color: "#e3e3e3", border: "1px solid #2e2e34" }}
              >
                <p>Logout securely</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Reusable nav item pill ── */
function NavItemButton({
  isActive,
  icon,
  label,
  right,
}: {
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = isActive ? "#1a3d37" : hovered ? "#161618" : "transparent";
  const color = isActive ? "#7cebd6" : hovered ? "#e3e3e3" : "#6b7280";

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full cursor-pointer select-none"
      style={{ background: bg, color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Teal dot indicator for active state — Wizardly signature */}
      {isActive ? (
        <span
          className="shrink-0"
          style={{ color: "#7cebd6", display: "flex", alignItems: "center" }}
        >
          {icon}
        </span>
      ) : (
        <span className="shrink-0" style={{ color: hovered ? "#e3e3e3" : "#6b7280" }}>
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
      {right}
    </div>
  );
}
