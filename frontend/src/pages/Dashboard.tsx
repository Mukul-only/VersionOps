import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Building2, CalendarDays, ArrowRight, LogOut } from "lucide-react";
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
          }else {
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
    }
  };

  const handleGetReport = async () => {
    try {
      setLoadingReport(true);
      setReportError(null);
      const report = await reportService.getMyCollegeReport();
      setReportData(report);
    } catch (error) {
      setReportError("Failed to fetch college report");
      mapped_toast("Failed to fetch college report", "error");
      console.error("Failed to fetch college report", error);
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
        },
        {
          label: "Checked In",
          value: stats.checkedIn,
          icon: UserCheck,
        },
        {
          label: "Colleges",
          value: stats.colleges,
          icon: Building2,
        },
        {
          label: "Events",
          value: stats.events,
          icon: CalendarDays,
        },
      ].filter((s) => s.value > 0)
    : [];

  return (
    <div className="space-y-4">
      {role === "PARTICIPANT" ? (
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 px-8 py-8 bg-gradient-to-br from-primary/10 via-background to-muted/20 rounded-2xl border shadow-lg">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          
          <div className="relative flex items-center gap-6">
            <div className="flex flex-col gap-0 bg-background/50 p-3 rounded-2xl backdrop-blur-sm border shadow-sm">
              <img src="/logo.png" alt="VERSION'26" className="h-14 w-auto drop-shadow-sm"/>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-muted-foreground font-medium">Here's how your college performed at the event.</p>
            </div>
          </div>

          <div className="relative flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-4 p-3 bg-background/60 backdrop-blur-md rounded-2xl border shadow-sm transition-all hover:shadow-md hover:bg-background/80">
              <Avatar className="h-12 w-12 border-2 border-primary/20 ring-4 ring-primary/5">
                <AvatarFallback className="bg-primary text-primary-foreground font-black text-lg">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col pr-2">
                <p className="text-sm font-black text-foreground leading-tight">{user?.name}</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{role}</p>
              </div>
              <div className="h-8 w-px bg-border mx-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="hover:bg-destructive/10 hover:text-destructive transition-all rounded-xl"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <img src="/logo.png" alt="VERSION'26" className="h-12 w-auto"/>
              <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Management Portal
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-xs text-muted-foreground text-right">Operational overview</p>
          </div>
        </div>
      )}

      {role !== "PARTICIPANT" && stats && statCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {topColleges !== null && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                Top Colleges
                {canNavigate("/leaderboard") && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/leaderboard")}>
                    View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topColleges.map((entry, i) => (
                  <div key={entry.collegeId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-yellow-500/20 text-yellow-600"
                            : i === 1
                            ? "bg-slate-500/20 text-slate-600"
                            : i === 2
                            ? "bg-orange-500/20 text-orange-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium text-foreground">{entry.college?.name}</span>
                    </div>
                    <span className="font-mono font-semibold">{entry.totalPoints} pts</span>
                  </div>
                ))}
                {topColleges.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {role !== "PARTICIPANT" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canNavigate("/participants") && (
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/participants")}>
                  <UserCheck className="mr-2 h-4 w-4" /> Check-in Participant
                </Button>
              )}
              {canNavigate("/events") && (
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/events")}>
                  <CalendarDays className="mr-2 h-4 w-4" /> Add Participants to Event
                </Button>
              )}
              {hasPermission(role, "users-manage") && topColleges !== null && (
                <Button className="w-full justify-start" variant="outline" onClick={recalculateLeaderboard}>
                  <Building2 className="mr-2 h-4 w-4" /> Recalculate Leaderboard
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {loadingReport && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {reportError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
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
