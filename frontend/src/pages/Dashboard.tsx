import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Building2, CalendarDays, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole, hasPermission, ROUTE_PERMISSIONS } from "@/lib/rbac";
import {
  participantService,
  collegeService,
  eventService,
  leaderboardService,
  PaginationParams,
} from "@/api/services";
import { LeaderboardEntry, PaginatedResponse, Participant, College, FestEvent } from "@/api/types";

type Stats = {
  totalParticipants: number;
  checkedIn: number;
  colleges: number;
  events: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role as AppRole | undefined;

  const canNavigate = (path: string) => {
    const required = ROUTE_PERMISSIONS[path];
    if (!required) return true;
    return hasPermission(role, required);
  };

  const [stats, setStats] = useState<Stats | null>(null);
  const [topColleges, setTopColleges] = useState<LeaderboardEntry[] | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await leaderboardService.get({ take: 5, includeRelations: true, suppressRedirect: true, suppressErrorToast: true });
      setTopColleges(response.items);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
        console.warn("Unauthorized access to leaderboard");
        setTopColleges(null);
      } else {
        console.error("Failed to load leaderboard", error);
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
          console.warn(`Unauthorized access to a stats endpoint.`);
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
          console.warn("Could not fetch checked-in count with filter", e);
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
      console.error("Failed to load stats", error);
      setStats(null);
    }
  }, []);

  useEffect(() => {
    void loadStats();
    void loadLeaderboard();
  }, [loadStats, loadLeaderboard]);

  const recalculateLeaderboard = async () => {
    try {
      await leaderboardService.recalculate();
      toast.success("Leaderboard recalculated!");
      await loadLeaderboard();
    } catch (error: unknown) {
      toast.error("Failed to recalculate");
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Operational overview</p>
      </div>

      {stats && statCards.length > 0 && (
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

      <div className="grid lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}
