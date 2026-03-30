import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  TrendingUp,
  LogOut,
  Crown,
  Zap,
  Activity,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { reportService, leaderboardService } from "@/api/services";
import { CollegeReport, LeaderboardEntry } from "@/api/types";
import { cn } from "@/lib/utils";
import {
  ToggleButtons,
  EventChart,
  ParticipantChart,
  DrilldownDrawer,
} from "@/components/competition-analytics/CompetitionDashboard";
import {
  getEventChartData,
  getParticipantChartData,
} from "@/components/competition-analytics/utils/analytics-helpers";

function ScoreBreakdownStrip({
  data,
}: {
  data: {
    participationPoints: number;
    prizePoints: number;
    adjustmentPoints: number;
    total: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both delay-150">
      <div className="flex flex-col gap-1 p-5 rounded-2xl bg-card border border-border">
        <span className="section-label text-muted-foreground">Participation Points</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-metric-lg tabular-nums tracking-tight">
            {data.participationPoints}
          </span>
          <span className="text-caption text-muted-foreground font-medium uppercase tracking-widest">
            pts
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-5 rounded-2xl bg-card border border-border">
        <span className="section-label text-muted-foreground">
          Prize Points
        </span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-metric-lg text-warning tabular-nums tracking-tight">
            {data.prizePoints}
          </span>
          <span className="text-caption text-muted-foreground font-medium uppercase tracking-widest">
            pts
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-5 rounded-2xl bg-card border border-border">
        <span className="section-label text-muted-foreground">Adjustment Points</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span
            className={cn(
              "text-metric-lg tabular-nums tracking-tight",
              data.adjustmentPoints >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {data.adjustmentPoints > 0 ? "+" : ""}
            {data.adjustmentPoints}
          </span>
          <span className="text-caption text-muted-foreground font-medium uppercase tracking-widest">
            pts
          </span>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPreview({
  colleges,
  userCollegeId,
}: {
  colleges: LeaderboardEntry[];
  userCollegeId?: number;
}) {
  const rankConfig = [
    {
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-l-amber-400/60",
      icon: "🥇",
    },
    {
      bg: "bg-slate-400/10",
      text: "text-slate-300",
      border: "border-l-slate-400/40",
      icon: "🥈",
    },
    {
      bg: "bg-orange-600/10",
      text: "text-orange-400",
      border: "border-l-orange-500/40",
      icon: "🥉",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="section-label">Live Leaderboard</h3>
        <span className="section-label text-muted-foreground">Top 5</span>
      </div>
      <div className="flex flex-col gap-1">
        {colleges.slice(0, 5).map((entry, i) => {
          const isUser = entry.collegeId === userCollegeId;
          const rank = i + 1;
          const cfg = rankConfig[i];

          return (
            <div
              key={entry.collegeId}
              className={cn(
                "flex items-center justify-between py-3 px-3 rounded-xl border-l-2 transition-colors",
                isUser
                  ? "bg-primary/8 border-l-primary"
                  : cfg
                    ? cn("border-l-2", cfg.border, "hover:bg-white/[0.02]")
                    : "border-l-transparent hover:bg-white/[0.02]",
              )}
            >
              <div className="flex items-center gap-3">
                {cfg && !isUser ? (
                  <span
                    className={cn(
                      "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg tabular-nums",
                      cfg.bg,
                      cfg.text,
                    )}
                  >
                    {rank}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg tabular-nums",
                      isUser
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/50 text-muted-foreground",
                    )}
                  >
                    {rank}
                  </span>
                )}
                <span
                  className={cn(
                    "text-body",
                    isUser
                      ? "text-primary font-bold"
                      : cfg
                        ? "text-foreground font-semibold"
                        : "text-foreground font-medium",
                  )}
                >
                  {entry.college?.name}
                  {isUser && (
                    <span className="ml-2 text-primary/80 text-xs font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                </span>
              </div>
              <span
                className={cn(
                  "text-metric tabular-nums tracking-tight",
                  isUser
                    ? "text-primary"
                    : cfg
                      ? cfg.text
                      : "text-muted-foreground",
                )}
              >
                {entry.totalPoints}{" "}
                <span className="text-sm font-normal opacity-60">pts</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function ParticipantHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [reportData, setReportData] = useState<CollegeReport | null>(null);
  const [topColleges, setTopColleges] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"events" | "participants">("events");
  const [excludeParticipation, setExcludeParticipation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const eventChartData = useMemo(() => {
    if (!reportData) return [];
    const rawData = getEventChartData(reportData);
    if (!excludeParticipation) return rawData;
    return rawData.map((d) => ({
      ...d,
      points: Math.max(0, d.points - (d.participation || 0)),
    }));
  }, [reportData, excludeParticipation]);

  const participantChartData = useMemo(() => {
    if (!reportData) return [];
    const rawData = getParticipantChartData(reportData);
    if (!excludeParticipation) return rawData;
    return rawData.map((d) => ({
      ...d,
      points: Math.max(0, d.points - (d.raw.participationPoints || 0)),
    }));
  }, [reportData, excludeParticipation]);

  const handleEventClick = (event: Record<string, unknown>) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedEvent(null);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [report, leaderboard] = await Promise.all([
        reportService.getMyCollegeReport({ suppressRedirect: true }),
        leaderboardService.get({
          take: 10,
          includeRelations: true,
          suppressRedirect: true,
          suppressErrorToast: true,
        }),
      ]);

      setReportData(report);
      setTopColleges(leaderboard.items);
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes("not linked")) {
        setError(
          "You are not linked to a participant record. Please contact the administrator.",
        );
      } else {
        setError("Failed to load your college data.");
      }
      console.error("Failed to load participant data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-24 pt-10 px-4 sm:px-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-8 mb-10">
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-full bg-card border border-border" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-48 bg-card" />
              <Skeleton className="h-5 w-32 bg-card" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:items-end justify-between border-b border-border pb-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24 bg-card" />
            <Skeleton className="h-14 w-32 bg-card" />
          </div>

          <div className="flex gap-10">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-20 bg-card" />
              <Skeleton className="h-10 w-16 bg-card" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24 bg-card" />
              <Skeleton className="h-10 w-16 bg-card" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24 bg-card" />
              <Skeleton className="h-10 w-16 bg-card" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-[120px] rounded-2xl bg-card border border-border" />
            <Skeleton className="h-[120px] rounded-2xl bg-card border border-border" />
            <Skeleton className="h-[120px] rounded-2xl bg-card border border-border" />
          </div>

          <Skeleton className="h-[400px] w-full bg-card rounded-2xl border border-border" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-32 px-4 animate-in fade-in duration-500">
        <div className="p-12 rounded-[1.5rem] border border-border bg-card flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6 text-destructive">
            <UserCheck className="h-8 w-8" />
          </div>
          <h2 className="text-heading mb-2">Access Restricted</h2>
          <p className="text-body text-muted-foreground mb-8 max-w-sm">
            {error}
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-full px-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 section-label"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const userCollegeId = reportData?.college?.id;
  const scoreData = reportData?.scoreBreakdown;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 pt-10 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-8">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 rounded-full border border-border bg-card">
            <AvatarFallback className="text-heading bg-transparent text-foreground">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <h1 className="text-display leading-none">{user?.name}</h1>
            <p className="text-body text-muted-foreground">
              {reportData?.college?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground section-label disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive section-label"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:items-end justify-between border-b border-border pb-8">
        <div className="flex flex-col gap-1">
          <span className="section-label text-muted-foreground">
            Total Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-display tabular-nums leading-none tracking-tighter">
              {scoreData?.total || 0}
            </span>
            <span className="text-body text-primary font-bold">pts</span>
          </div>
        </div>

        <div className="flex gap-10">
          <div className="flex flex-col gap-1">
            <span className="section-label text-muted-foreground">
              Rank
            </span>
            <span className="text-metric-lg tracking-tight text-foreground">
              #{reportData?.leaderboard?.rank || "-"}
            </span>
            {reportData?.leaderboard && reportData.leaderboard.rank > 1 && (
              <div className="flex flex-col gap-0.5 mt-1">
                {reportData.leaderboard.pointsToRankAbove != null && (
                  <span className={cn(
                    "text-xs",
                    reportData.leaderboard.pointsToRankAbove === 0 ? "text-muted-foreground" : "text-destructive"
                  )}>
                    {reportData.leaderboard.pointsToRankAbove === 0 
                      ? `Tied with #${reportData.leaderboard.rank - 1}`
                      : `Behind from #${reportData.leaderboard.rank - 1}: ${reportData.leaderboard.pointsToRankAbove} pts`
                    }
                  </span>
                )}
                {reportData.leaderboard.pointsAheadOfNext != null && reportData.leaderboard.rank < reportData.leaderboard.totalColleges && (
                  <span className={cn(
                    "text-xs",
                    reportData.leaderboard.pointsAheadOfNext === 0 ? "text-muted-foreground" : "text-success"
                  )}>
                    {reportData.leaderboard.pointsAheadOfNext === 0
                      ? `Tied with #${reportData.leaderboard.rank + 1}`
                      : `Ahead from #${reportData.leaderboard.rank + 1}: ${reportData.leaderboard.pointsAheadOfNext} pts`
                    }
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="section-label text-muted-foreground">
              Events Participated
            </span>
            <span className="text-metric-lg tracking-tight text-foreground">
              {reportData?.insights?.totalEventsParticipated || 0}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="section-label text-muted-foreground">
              Total Wins
            </span>
            <span className="text-metric-lg tracking-tight text-foreground">
              {reportData?.insights?.totalWins || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {scoreData && <ScoreBreakdownStrip data={scoreData} />}

        {reportData && (
          <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both delay-300">
            <div className="flex flex-col gap-5 border-b border-border pb-6">
              <h3 className="section-label">Performance Analytics</h3>
              <ToggleButtons
                value={viewMode}
                onChange={setViewMode}
                excludeParticipation={excludeParticipation}
                onToggleExclude={setExcludeParticipation}
              />
            </div>

            <div className="relative pt-2">
              {viewMode === "events" ? (
                <div className="animate-in fade-in duration-500 slide-in-from-right-4">
                  <EventChart
                    data={eventChartData}
                    onBarClick={handleEventClick}
                  />
                </div>
              ) : (
                <div className="animate-in fade-in duration-500 slide-in-from-left-4">
                  <ParticipantChart
                    data={participantChartData}
                    onBarClick={handleEventClick}
                    reportData={reportData}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-full pt-10 border-t border-border mt-10">
        <LeaderboardPreview
          colleges={topColleges}
          userCollegeId={userCollegeId}
        />
      </div>

      <DrilldownDrawer
        data={selectedEvent}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        isParticipantView={viewMode === "participants"}
      />
    </div>
  );
}
