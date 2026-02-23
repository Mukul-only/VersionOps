import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Building2, CalendarDays, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { participantService, collegeService, eventService, leaderboardService } from "@/api/services";
import { LeaderboardEntry } from "@/api/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalParticipants: 0,
    checkedIn: 0,
    colleges: 0,
    events: 0
  });
  const [topColleges, setTopColleges] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadStats();
    loadLeaderboard();
  }, []);

  const loadStats = async () => {
    try {
      const [participantsRes, collegesRes, eventsRes] = await Promise.all([
        participantService.getAll({ take: 1 }), // We just need total count
        collegeService.getAll({ take: 1 }),
        eventService.getAll({ take: 1 })
      ]);

      // Try fetching checked in count
      let checkedInCount = 0;
      try {
        const checkedInRes = await participantService.getAll({ 
          filters: JSON.stringify({ festStatus: 'CHECKED_IN' }),
          take: 1 
        });
        checkedInCount = checkedInRes.total;
      } catch (e) {
        console.warn("Could not fetch checked-in count with filter", e);
      }

      setStats({
        totalParticipants: participantsRes.total,
        checkedIn: checkedInCount,
        colleges: collegesRes.total,
        events: eventsRes.total
      });
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardService.get({ take: 5, includeRelations: true });
      setTopColleges(response.items);
    } catch (error) {
      console.error("Failed to load leaderboard", error);
    }
  };

  const recalculateLeaderboard = async () => {
    try {
      await leaderboardService.recalculate();
      toast.success("Leaderboard recalculated!");
      loadLeaderboard();
    } catch (error) {
      toast.error("Failed to recalculate");
    }
  };

  const statCards = [
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Operational overview</p>
      </div>

      {/* Stat cards */}
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Top Colleges
              <Button variant="ghost" size="sm" onClick={() => navigate("/leaderboard")}>
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topColleges.map((entry, i) => (
                <div key={entry.collegeId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-yellow-500/20 text-yellow-600" : i === 1 ? "bg-slate-500/20 text-slate-600" : i === 2 ? "bg-orange-500/20 text-orange-600" : "bg-muted text-muted-foreground"
                    }`}>
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

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/participants")}>
              <UserCheck className="mr-2 h-4 w-4" /> Check-in Participant
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/events")}>
              <CalendarDays className="mr-2 h-4 w-4" /> Add Participants to Event
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={recalculateLeaderboard}>
              <Building2 className="mr-2 h-4 w-4" /> Recalculate Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
