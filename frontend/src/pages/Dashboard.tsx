import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Building2, CalendarDays, ArrowRight, LogOut, Box, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAuth } from "@/contexts/AuthContext";
import { AppRole, hasPermission, ROUTE_PERMISSIONS } from "@/lib/rbac";
import {
  participantService,
  collegeService,
  eventService,
  leaderboardService,
  reportService,
  PaginationParams,
} from "@/api/services";
import { LeaderboardEntry, PaginatedResponse, Participant, College, FestEvent, CollegeReport } from "@/api/types";
import {mapped_toast} from "@/lib/toast_map.ts";
import { CompetitionDashboard } from "@/components/competition-analytics/CompetitionDashboard";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  totalParticipants: number;
  checkedIn: number;
  colleges: number;
  events: number;
};

/* ── Design tokens (Wizardly Obsidian) ── */
const T = {
  bg: "#0d0d0d",
  surface: "#131313",
  surfaceLow: "#1b1b1b",
  surfaceLowest: "#0e0e0e",
  border: "#222224",
  borderSub: "#1e1e20",
  textPrimary: "#e3e3e3",
  textSecondary: "#6b7280",
  textMuted: "#4a4a50",
  teal: "#7cebd6",
  tealContainer: "#5ecfba",
  tealDeep: "#1a3d37",
  tealGlow: "rgba(94,207,186,0.15)",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role as AppRole | undefined;

  const canNavigate = (path: string) => {
    const required = ROUTE_PERMISSIONS[path];
    if (!required) return true;
    return hasPermission(role, required);
  };

  const [stats, setStats] = useState<Stats | null>(null);
  const [topColleges, setTopColleges] = useState<LeaderboardEntry[] | null>(null);
  const [reportData, setReportData] = useState<CollegeReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await leaderboardService.get({ take: 5, includeRelations: true, suppressRedirect: true, suppressErrorToast: true });
      setTopColleges(response.items);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
        mapped_toast(`${error.message} access to leaderboard data`, "error", true);
        setTopColleges(null);
      } else {
        mapped_toast("Failed to load leaderboard data", "error");
        console.error("Failed to load leaderboard data", error);
        setTopColleges(null);
      }
    }
  }, []);

  const loadStats = useCallback(async () => {
    const fetchAndSuppress = async <T,>(
      serviceCall: (params: PaginationParams) => Promise<PaginatedResponse<T>>
    ): Promise<PaginatedResponse<T> | null> => {
      try {
        return await serviceCall({ take: 1, suppressRedirect: true });
      } catch (err: unknown) {
        if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
          mapped_toast(`${err.message} access to a stats endpoint.`, "error", true);
          return null;
        }
        throw err;
      }
    };

    try {
      const [participantsRes, collegesRes, eventsRes] = await Promise.all([
        fetchAndSuppress<Participant>(participantService.getAll),
        fetchAndSuppress<College>(collegeService.getAll),
        fetchAndSuppress<FestEvent>(eventService.getAll),
      ]);

      let checkedInCount = 0;
      if (participantsRes) {
        try {
          const checkedInRes = await participantService.getAll({
            filters: JSON.stringify({ festStatus: 'CHECKED_IN' }),
            take: 1,
            suppressRedirect: true,
          });
          checkedInCount = checkedInRes.total;
        } catch (e: unknown) {
          if (e instanceof Error && (e.message === 'Unauthorized' || e.message === 'Forbidden')) {
            mapped_toast(`${e.message} access to a stats endpoint.`, "error", true);
            return;
          } else {
            mapped_toast("Could not fetch checked-in count with filter", "error");
            console.error("Could not fetch checked-in count with filter", e);
          }
        }
      }

      if (participantsRes || collegesRes || eventsRes) {
        setStats({
          totalParticipants: participantsRes?.total ?? 0,
          checkedIn: checkedInCount,
          colleges: collegesRes?.total ?? 0,
          events: eventsRes?.total ?? 0,
        });
      } else {
        setStats(null);
      }
    } catch (error: unknown) {
      mapped_toast("Failed to load stats", "error", true);
      console.error("Failed to load stats", error);
      setStats(null);
    }
  }, []);

  useEffect(() => {
    void loadStats();
    void loadLeaderboard();
    if (role === "PARTICIPANT") {
      void handleGetReport();
    }
  }, [loadStats, loadLeaderboard, role]);

  const recalculateLeaderboard = async () => {
    try {
      await leaderboardService.recalculate();
      mapped_toast("Leaderboard recalculated!", "success");
      await loadLeaderboard();
    } catch (error: unknown) {
      mapped_toast("Failed to recalculate", "error");
      console.error("Failed to recalculate", error);
    }
  };

  const handleGetReport = async () => {
    try {
      setLoadingReport(true);
      setReportError(null);
      const report = await reportService.getMyCollegeReport();
      setReportData(report);
    } catch (error: any) {
      if (error.message?.includes('Forbidden') || error.message?.includes('not linked')) {
        setReportError("You are not linked to a participant record. Please contact the administrator.");
      } else {
        setReportError("Failed to fetch college report");
      }
      console.error('Report error:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const statCards = stats
    ? [
        { label: "Total Participants", value: stats.totalParticipants, icon: Users },
        { label: "Checked In", value: stats.checkedIn, icon: UserCheck },
        { label: "Colleges", value: stats.colleges, icon: Building2 },
        { label: "Events", value: stats.events, icon: CalendarDays },
      ].filter((s) => s.value > 0)
    : [];

  const rankStyle = (i: number) => {
    if (i === 0) return { bg: T.tealDeep, color: T.teal };
    if (i === 1) return { bg: "#25252c", color: "#a8a8b3" };
    if (i === 2) return { bg: "#2a2018", color: "#c4874a" };
    return { bg: "#111113", color: T.textMuted };
  };

  return (
    <div className="space-y-5 animate-fade-up">
      
      {/* ── Welcome / Header banner ── */}
      {role === "PARTICIPANT" ? (
        <div
          className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 py-6 rounded-2xl"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div
            className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
            style={{ background: `linear-gradient(to bottom, ${T.tealContainer}, transparent)` }}
          />
          <div className="flex items-center gap-4 pl-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ background: T.tealDeep, padding: 10, border: `1px solid ${T.tealContainer}30` }}
            >
              <Box className="h-5 w-5" style={{ color: T.teal }} strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-lg font-bold leading-tight"
                style={{ color: T.textPrimary, letterSpacing: "-0.02em" }}
              >
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-sm mt-0.5 font-medium" style={{ color: T.textSecondary }}>
                Here's how your college performed at the event.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-2 pr-4 rounded-xl"
            style={{ background: T.surfaceLow, border: `1px solid ${T.border}` }}
          >
            <Avatar className="h-9 w-9 rounded-lg" style={{ border: `1px solid ${T.border}` }}>
              <AvatarFallback
                className="text-[11px] font-bold rounded-lg"
                style={{ background: T.tealDeep, color: T.teal }}
              >
                {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-[13px] font-semibold leading-tight" style={{ color: T.textPrimary }}>
                {user?.name}
              </p>
              <p
                className="font-bold mt-0.5"
                style={{ fontSize: 10, color: T.tealContainer, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {role}
              </p>
            </div>
            <div className="h-6 w-px mx-1 hidden sm:block" style={{ background: T.border }} />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 rounded-lg hidden sm:flex transition-colors duration-150"
              style={{ color: T.textSecondary }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 rounded-2xl"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ background: T.surfaceLow, padding: 9, border: `1px solid ${T.borderSub}` }}
            >
              <BarChart2 className="h-5 w-5" style={{ color: T.teal }} strokeWidth={2} />
            </div>
            <div>
              <p
                className="font-bold mb-0.5"
                style={{ fontSize: 10, color: T.tealContainer, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Primary Dashboard
              </p>
              <h2
                className="text-xl font-bold leading-tight"
                style={{ color: T.textPrimary, letterSpacing: "-0.025em" }}
              >
                Live Operations
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards (4-col grid) ── */}
      {role !== "PARTICIPANT" && stats && statCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl transition-all duration-200 group cursor-default"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = T.surfaceLow;
                (e.currentTarget as HTMLElement).style.borderColor = "#2e2e34";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = T.surface;
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
              }}
            >
              <div className="flex flex-col h-full justify-between gap-5">
                <div
                  className="flex items-center justify-center rounded-lg self-start"
                  style={{
                    background: T.surfaceLow,
                    padding: 8,
                    border: `1px solid ${T.borderSub}`,
                    width: 36,
                    height: 36,
                  }}
                >
                  <s.icon className="h-4 w-4" style={{ color: T.teal }} strokeWidth={2} />
                </div>
                <div>
                  <p
                    className="text-2xl font-extrabold leading-none"
                    style={{ color: T.textPrimary, letterSpacing: "-0.03em" }}
                  >
                    {s.value.toLocaleString()}
                  </p>
                  <p
                    className="text-xs font-semibold mt-1.5"
                    style={{ color: T.textSecondary, letterSpacing: "0.01em" }}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom grid: Top Colleges + Quick Actions ── */}
      <div className="grid lg:grid-cols-2 gap-3">
        {topColleges !== null && (
          <div
            className="p-6 rounded-2xl flex flex-col"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p
                  className="font-bold mb-0.5"
                  style={{ fontSize: 10, color: T.tealContainer, letterSpacing: "0.12em", textTransform: "uppercase" }}
                >
                  Campus Leaderboard
                </p>
                <h3
                  className="text-sm font-bold"
                  style={{ color: T.textPrimary, letterSpacing: "-0.01em" }}
                >
                  Top Colleges
                </h3>
              </div>
              {canNavigate("/leaderboard") && (
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150"
                  style={{ color: T.teal, background: T.tealDeep }}
                  onClick={() => navigate("/leaderboard")}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#1f4a40";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = T.tealDeep;
                  }}
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 flex-1">
              {topColleges.map((entry, i) => {
                const rs = rankStyle(i);
                return (
                  <div
                    key={entry.collegeId}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150"
                    style={{ background: T.surfaceLow, border: `1px solid ${T.borderSub}` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = T.border;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = T.borderSub;
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0"
                        style={{
                          width: 26,
                          height: 26,
                          background: rs.bg,
                          color: rs.color,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: T.textPrimary }}>
                        {entry.college?.name}
                      </span>
                    </div>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: T.textSecondary }}
                    >
                      {entry.totalPoints} PTS
                    </span>
                  </div>
                );
              })}
              {topColleges.length === 0 && (
                <p className="text-xs text-center py-6 font-medium" style={{ color: T.textMuted }}>
                  No data available
                </p>
              )}
            </div>
          </div>
        )}

        {role !== "PARTICIPANT" && (
          <div
            className="p-6 rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="mb-5">
              <p
                className="font-bold mb-0.5"
                style={{ fontSize: 10, color: T.tealContainer, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Operations
              </p>
              <h3
                className="text-sm font-bold"
                style={{ color: T.textPrimary, letterSpacing: "-0.01em" }}
              >
                Quick Actions
              </h3>
            </div>

            <div className="space-y-2.5">
              {canNavigate("/participants") && (
                <QuickActionButton
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Check-in Participant"
                  onClick={() => navigate("/participants")}
                />
              )}
              {canNavigate("/events") && (
                <QuickActionButton
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Add Participants to Event"
                  onClick={() => navigate("/events")}
                />
              )}
              {hasPermission(role, "users-manage") && topColleges !== null && (
                <QuickActionButton
                  icon={<Building2 className="h-4 w-4" />}
                  label="Recalculate Leaderboard"
                  onClick={recalculateLeaderboard}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {loadingReport && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" style={{ background: T.surface }} />
          <Skeleton className="h-48 w-full rounded-2xl" style={{ background: T.surface }} />
        </div>
      )}

      {reportError && (
        <div
          className="p-4 rounded-2xl text-sm font-medium"
          style={{
            background: "rgba(239, 68, 68, 0.07)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {reportError}
        </div>
      )}

      {reportData && (
        <div className="pt-2">
          <CompetitionDashboard data={reportData} />
        </div>
      )}
    </div>
  );
}

/* ── Quick action button — Wizardly pill style ── */
function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const T_local = {
    bg: "#111113",
    border: "#222224",
    hoverBg: "#1a1a1e",
    hoverBorder: "#2e2e34",
    teal: "#7cebd6",
    iconColor: "#5ecfba",
    text: "#e3e3e3",
  };

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 text-left"
      style={{ background: T_local.bg, border: `1px solid ${T_local.border}`, color: T_local.text }}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = T_local.hoverBg;
        el.style.borderColor = T_local.hoverBorder;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = T_local.bg;
        el.style.borderColor = T_local.border;
      }}
    >
      <span
        className="flex items-center justify-center rounded-lg shrink-0"
        style={{ background: "#1a3d37", padding: 6, color: T_local.iconColor }}
      >
        {icon}
      </span>
      {label}
      <ArrowRight className="h-3.5 w-3.5 ml-auto" style={{ color: "#4a4a50" }} />
    </button>
  );
}
