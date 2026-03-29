import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  Building2,
  CalendarDays,
  ArrowRight,
  LogOut,
  Box,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
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
import {
  LeaderboardEntry,
  PaginatedResponse,
  Participant,
  College,
  FestEvent,
  CollegeReport,
} from "@/api/types";
import { mapped_toast } from "@/lib/toast_map.ts";
import { CompetitionDashboard } from "@/components/competition-analytics/CompetitionDashboard";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  totalParticipants: number;
  checkedIn: number;
  colleges: number;
  events: number;
};

function AnimatedCounter({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1500;
          const steps = 40;
          const stepDuration = duration / steps;
          let currentStep = 0;

          const counter = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(value * easeOut));

            if (currentStep >= steps) {
              clearInterval(counter);
              setDisplayValue(value);
            }
          }, stepDuration);
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span
      ref={ref}
      className="count-up"
      style={{ animationDelay: `${delay}ms`, display: "inline-block" }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
}

/**
 * Hook for staggered list animation with IntersectionObserver
 * Triggers animation when items enter viewport
 */
function useStaggeredAnimation(itemCount: number, baseDelay = 100) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return {
    containerRef,
    isInView,
    getItemStyle: (index: number) => ({
      animationDelay: `${index * baseDelay}ms`,
    }),
  };
}

/* ── Design tokens (Wizardly Obsidian) ── */
const T = {
  bg: "#0d0d0d",
  surface: "#131313",
  surfaceLow: "#1b1b1b",
  border: "#222224",
  borderSub: "#1e1e20",
  textPrimary: "#e3e3e3",
  textSecondary: "#6b7280",
  textMuted: "#4a4a50",
  teal: "#7cebd6",
  tealContainer: "#5ecfba",
  tealDeep: "#1a3d37",
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
  const [topColleges, setTopColleges] = useState<LeaderboardEntry[] | null>(
    null,
  );
  const [reportData, setReportData] = useState<CollegeReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await leaderboardService.get({
        take: 5,
        includeRelations: true,
        suppressRedirect: true,
        suppressErrorToast: true,
      });
      setTopColleges(response.items);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message === "Unauthorized" || error.message === "Forbidden")
      ) {
        mapped_toast(
          `${error.message} access to leaderboard data`,
          "error",
          true,
        );
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
      serviceCall: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
    ): Promise<PaginatedResponse<T> | null> => {
      try {
        return await serviceCall({ take: 1, suppressRedirect: true });
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message === "Unauthorized" || err.message === "Forbidden")
        ) {
          mapped_toast(
            `${err.message} access to a stats endpoint.`,
            "error",
            true,
          );
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
            filters: JSON.stringify({ festStatus: "CHECKED_IN" }),
            take: 1,
            suppressRedirect: true,
          });
          checkedInCount = checkedInRes.total;
        } catch (e: unknown) {
          if (
            e instanceof Error &&
            (e.message === "Unauthorized" || e.message === "Forbidden")
          ) {
            mapped_toast(
              `${e.message} access to a stats endpoint.`,
              "error",
              true,
            );
            return;
          } else {
            mapped_toast(
              "Could not fetch checked-in count with filter",
              "error",
            );
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
      if (
        error.message?.includes("Forbidden") ||
        error.message?.includes("not linked")
      ) {
        setReportError(
          "You are not linked to a participant record. Please contact the administrator.",
        );
      } else {
        setReportError("Failed to fetch college report");
      }
      console.error("Report error:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: "Total Participants",
          value: stats.totalParticipants,
          icon: Users,
          accent: "#7cebd6",
          accentBg: "#1a3d37",
          delay: 100,
        },
        {
          label: "Checked In",
          value: stats.checkedIn,
          icon: UserCheck,
          accent: "#34d399",
          accentBg: "#052e16",
          delay: 250,
        },
        {
          label: "Colleges",
          value: stats.colleges,
          icon: Building2,
          accent: "#818cf8",
          accentBg: "#1e1b4b",
          delay: 400,
        },
        {
          label: "Events",
          value: stats.events,
          icon: CalendarDays,
          accent: "#fbbf24",
          accentBg: "#451a03",
          delay: 550,
        },
      ].filter((s) => s.value > 0)
    : [];

  const rankStyle = (i: number) => {
    if (i === 0) return { bg: T.tealDeep, color: T.teal, border: "#5ecfba40" };
    if (i === 1) return { bg: "#1e2028", color: "#94a3b8", border: "#475569" };
    if (i === 2) return { bg: "#1f1a14", color: "#d97706", border: "#92400e" };
    return { bg: "#111113", color: T.textMuted, border: "transparent" };
  };

  return (
    <div className="space-y-5 page-fade-in">
      {/* ── Welcome / Header banner ── */}
      {role === "PARTICIPANT" ? (
        <div
          className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 py-6 rounded-2xl page-fade-in"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-4 pl-3">
            <div
              className="flex items-center justify-center rounded-xl icon-bounce glow-pulse"
              style={{
                background: T.tealDeep,
                padding: 10,
                border: `1px solid ${T.tealContainer}30`,
              }}
            >
              <Box
                className="h-5 w-5"
                style={{ color: T.teal }}
                strokeWidth={2}
              />
            </div>
            <div>
              <h1 className="text-subheading" style={{ color: T.textPrimary }}>
                Welcome back, {user?.name?.split(" ")[0]}
              </h1>
              <p className="text-body mt-1" style={{ color: T.textSecondary }}>
                Here's how your college performed at the event.
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-2 pr-4 rounded-xl"
            style={{
              background: T.surfaceLow,
              border: `1px solid ${T.border}`,
            }}
          >
            <Avatar
              className="h-9 w-9 rounded-lg"
              style={{ border: `1px solid ${T.border}` }}
            >
              <AvatarFallback
                className="text-[11px] font-bold rounded-lg"
                style={{ background: T.tealDeep, color: T.teal }}
              >
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p
                className="text-label leading-tight"
                style={{ color: T.textPrimary }}
              >
                {user?.name}
              </p>
              <p className="section-label mt-1" style={{ color: T.textMuted }}>
                {role
                  ?.replace("_", " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>
            <div
              className="h-6 w-px mx-1 hidden sm:block"
              style={{ background: T.border }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131313] focus-visible:ring-[#7cebd6] btn-press focus-ring interactive-scale"
              style={{ color: T.textSecondary }}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 icon-bounce" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 rounded-2xl page-fade-in"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-xl icon-bounce"
              style={{
                background: T.surfaceLow,
                padding: 9,
                border: `1px solid ${T.borderSub}`,
              }}
            >
              <BarChart2
                className="h-5 w-5"
                style={{ color: T.teal }}
                strokeWidth={2}
              />
            </div>
            <div>
              <h2 className="text-heading" style={{ color: T.textPrimary }}>
                Dashboard
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards (4-col grid) ── */}
      {role !== "PARTICIPANT" && stats && statCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl cursor-default stat-card-animated card-shine"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
              }}
            >
              <div className="flex flex-col h-full justify-between gap-5">
                <div
                  className="flex items-center justify-center rounded-lg self-start icon-bounce"
                  style={{
                    background: s.accentBg,
                    padding: 8,
                    width: 36,
                    height: 36,
                  }}
                >
                  <s.icon
                    className="h-4 w-4"
                    style={{ color: s.accent }}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p
                    className="text-metric-lg"
                    style={{ color: T.textPrimary }}
                  >
                    <AnimatedCounter value={s.value} delay={s.delay} />
                  </p>
                  <p
                    className="text-caption mt-1.5"
                    style={{ color: T.textSecondary }}
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
                <h3 className="text-label" style={{ color: T.textPrimary }}>
                  Top Colleges
                </h3>
              </div>
              {canNavigate("/leaderboard") && (
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131313] focus-visible:ring-[#7cebd6] hover:bg-[#1f4a40] btn-press focus-ring interactive-scale"
                  style={{ color: T.teal, background: T.tealDeep }}
                  onClick={() => navigate("/leaderboard")}
                  aria-label="View all leaderboard rankings"
                >
                  View All
                  <ArrowRight
                    className="h-3 w-3 btn-arrow-slide"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            <div className="space-y-2 flex-1 animate-list">
              {topColleges.map((entry, i) => {
                const rs = rankStyle(i);
                return (
                  <div
                    key={entry.collegeId}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl leaderboard-item animate-item ${topColleges ? "is-visible" : ""}`}
                    style={{
                      background: T.surfaceLow,
                      border: `1px solid ${T.border}`,
                      animationDelay: `${i * 150}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0 icon-bounce"
                        style={{
                          width: 26,
                          height: 26,
                          background: rs.bg,
                          color: rs.color,
                          border: `1px solid ${rs.border !== "transparent" ? rs.color + "40" : "transparent"}`,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="text-label"
                        style={{ color: T.textPrimary }}
                      >
                        {entry.college?.name}
                      </span>
                    </div>
                    <span
                      className="font-mono text-caption"
                      style={{ color: T.textSecondary }}
                    >
                      {entry.totalPoints} PTS
                    </span>
                  </div>
                );
              })}
              {topColleges.length === 0 && (
                <p
                  className="text-xs text-center py-6 font-medium"
                  style={{ color: T.textMuted }}
                >
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
              <h3 className="text-label" style={{ color: T.textPrimary }}>
                Quick Actions
              </h3>
            </div>

            <div className="space-y-2.5 animate-list">
              {canNavigate("/participants") && (
                <QuickActionButton
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Check-in Participant"
                  onClick={() => navigate("/participants")}
                  accentColor="#34d399"
                  accentBg="#052e16"
                  index={0}
                />
              )}
              {canNavigate("/events") && (
                <QuickActionButton
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Manage Events"
                  onClick={() => navigate("/events")}
                  accentColor="#818cf8"
                  accentBg="#1e1b4b"
                  index={1}
                />
              )}
              {hasPermission(role, "users-manage") && topColleges !== null && (
                <QuickActionButton
                  icon={<Building2 className="h-4 w-4" />}
                  label="Recalculate Leaderboard"
                  onClick={recalculateLeaderboard}
                  accentColor="#fbbf24"
                  accentBg="#451a03"
                  index={2}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {loadingReport && (
        <div className="space-y-3">
          <Skeleton
            className="h-12 w-full rounded-2xl skeleton-shimmer"
            style={{ background: T.surface }}
          />
          <Skeleton
            className="h-48 w-full rounded-2xl skeleton-shimmer"
            style={{ background: T.surface }}
          />
        </div>
      )}

      {reportError && (
        <div
          className="p-4 rounded-2xl text-sm font-medium error-shake"
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

/* ── Quick action button — with color theme and smooth interactions ── */
function QuickActionButton({
  icon,
  label,
  onClick,
  accentColor = T.teal,
  accentBg = T.tealDeep,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accentColor?: string;
  accentBg?: string;
  index?: number;
}) {
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:ring-[#7cebd6] btn-press quick-action-btn animate-item is-visible"
      style={{
        background: T.surfaceLow,
        border: `1px solid ${T.border}`,
        color: T.textPrimary,
        animationDelay: `${index * 180}ms`,
      }}
      onClick={onClick}
    >
      <span
        className="flex items-center justify-center rounded-lg shrink-0 icon-bounce"
        style={{ background: accentBg, padding: 6, color: accentColor }}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <ArrowRight
        className="h-3.5 w-3.5 btn-arrow-slide"
        style={{ color: T.textMuted }}
      />
    </button>
  );
}
