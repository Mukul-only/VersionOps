import { useMemo, useState } from "react";
import { CollegeReport } from "@/api/types";
import {
  getScoreStats,
  getTopPerformer,
  getBestEvent,
  getWorstEvent,
  getTotalWins,
  getEventChartData,
  getParticipantChartData,
} from "./utils/analytics-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  Trophy, 
  Target, 
  User, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  Activity,
  BarChart3,
  Users2,
  MinusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const HeaderSummary = ({ collegeName, rank, totalColleges, lead }: any) => (
  <Card className="overflow-hidden border-none bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{collegeName}</h3>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Target className="h-4 w-4" />
            Competitive Standing
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</p>
            <p className="text-3xl font-black text-primary">#{rank}<span className="text-sm font-normal text-muted-foreground">/{totalColleges}</span></p>
          </div>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lead</p>
            <p className="text-3xl font-black text-success">+{lead}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ScoreBreakdown = ({ participationPoints, prizePoints, adjustmentPoints, total }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[
      { label: "Participation", value: participationPoints, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Prizes", value: prizePoints, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Adjustments", value: adjustmentPoints, icon: AlertCircle, color: adjustmentPoints >= 0 ? "text-emerald-500" : "text-destructive", bg: adjustmentPoints >= 0 ? "bg-emerald-500/10" : "bg-destructive/10" },
      { label: "Total Score", value: total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    ].map((item) => (
      <Card key={item.label} className="border-none bg-muted/30">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={cn("p-2 rounded-lg", item.bg)}>
            <item.icon className={cn("h-5 w-5", item.color)} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold">{item.value}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const InsightsStrip = ({ topPerformer, bestEvent, worstEvent, totalWins, totalEvents }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-full">
            <Award className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Success Rate</p>
            <p className="font-bold">{totalWins} Wins <span className="text-muted-foreground text-xs font-normal">in {totalEvents} Events</span></p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="truncate">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">MVP</p>
            <p className="font-bold truncate">{topPerformer?.name || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card border-emerald-500/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-full">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="truncate">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Peak Performance</p>
            <p className="font-bold truncate">{bestEvent?.eventName || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card border-destructive/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-full">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="truncate">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Growth Area</p>
            <p className="font-bold truncate">{worstEvent?.eventName || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ToggleButtons = ({ value, onChange, excludeParticipation, onToggleExclude }: any) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex p-1 bg-muted rounded-xl w-fit">
      <Button
        variant={value === 'events' ? 'default' : 'ghost'}
        size="sm"
        className={cn("rounded-lg px-4 transition-all", value === 'events' ? "shadow-sm" : "text-muted-foreground")}
        onClick={() => onChange('events')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        By Events
      </Button>
      <Button
        variant={value === 'participants' ? 'default' : 'ghost'}
        size="sm"
        className={cn("rounded-lg px-4 transition-all", value === 'participants' ? "shadow-sm" : "text-muted-foreground")}
        onClick={() => onChange('participants')}
      >
        <Users2 className="h-4 w-4 mr-2" />
        By Participants
      </Button>
    </div>

    <div className="flex items-center space-x-2 bg-muted/30 px-3 py-2 rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer select-none"
         onClick={() => onToggleExclude(!excludeParticipation)}>
      <Checkbox 
        id="exclude-participation" 
        checked={excludeParticipation} 
        onCheckedChange={onToggleExclude}
      />
      <label
        htmlFor="exclude-participation"
        className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
      >
        <MinusCircle className={cn("h-3.5 w-3.5 transition-colors", excludeParticipation ? "text-primary" : "text-muted-foreground")} />
        Exclude Participation Points
      </label>
    </div>
  </div>
);

const EventChart = ({ data, onBarClick }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  
  return (
    <Card className="bg-muted/10 border-dashed overflow-hidden">
      <CardContent className="p-6">
        <div className="overflow-x-auto pb-16">
          <div className="h-64 flex items-end gap-3 min-w-[500px] border-b border-border/50 relative">
            {data.map((d: any) => {
              const heightPercent = Math.max((d.points / maxPoints) * 100, 4);
              return (
                <div 
                  key={d.name} 
                  className="flex-1 group relative cursor-pointer min-w-[50px] flex flex-col items-center"
                  onClick={() => onBarClick && onBarClick(d.raw)}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md border shadow-md z-10 whitespace-nowrap font-bold">
                    {d.points} pts
                  </div>
                  <div 
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300 relative",
                      d.points === 0 
                        ? "bg-muted-foreground/20 border border-dashed border-muted-foreground/30" 
                        : "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                    )}
                    style={{ height: `${(heightPercent * 256) / 100}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-50 rounded-t-md" />
                  </div>
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-[11px] font-medium text-muted-foreground rotate-45 origin-top-left whitespace-nowrap group-hover:text-primary transition-colors max-w-[120px] truncate">
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-4 opacity-50">Click bars for event details</p>
      </CardContent>
    </Card>
  );
};

const ParticipantChart = ({ data, onBarClick, reportData }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  
  return (
    <Card className="bg-muted/10 border-dashed overflow-hidden">
      <CardContent className="p-6">
        <div className="overflow-x-auto pb-16">
          <div className="h-64 flex items-end gap-3 min-w-[500px] border-b border-border/50 relative">
            {data.map((d: any) => {
              const heightPercent = Math.max((d.points / maxPoints) * 100, 4);
              
              // Find events for this participant
              const participantEvents = reportData?.eventBreakdown?.filter((event: any) => 
                event.participants.some((p: any) => p.participantId === d.id)
              ) || [];

              const participantWinners = reportData?.eventBreakdown?.flatMap((event: any) => 
                event.winners.filter((w: any) => w.participantId === d.id).map((w: any) => ({
                  ...w,
                  eventName: event.eventName
                }))
              ) || [];

              return (
                <div 
                  key={d.id} 
                  className="flex-1 group relative cursor-pointer min-w-[50px] flex flex-col items-center"
                  onClick={() => onBarClick && onBarClick({
                    eventName: d.name,
                    total: d.points,
                    participationPoints: d.raw.participationPoints,
                    prizePoints: d.raw.prizePoints,
                    participants: participantEvents.map((e: any) => ({ participantId: e.eventId, name: e.eventName })),
                    winners: participantWinners.map((w: any) => ({ 
                      participantId: w.participantId, 
                      name: w.eventName, 
                      position: w.position, 
                      points: w.points 
                    }))
                  })}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md border shadow-md z-10 whitespace-nowrap font-bold">
                    {d.points} pts
                  </div>
                  <div 
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300 relative",
                      d.points === 0 
                        ? "bg-muted-foreground/20 border border-dashed border-muted-foreground/30" 
                        : "bg-accent-foreground shadow-[0_0_15px_rgba(var(--accent-foreground),0.2)] hover:shadow-[0_0_20px_rgba(var(--accent-foreground),0.4)]"
                    )}
                    style={{ height: `${(heightPercent * 256) / 100}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-50 rounded-t-md" />
                  </div>
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-[11px] font-medium text-muted-foreground rotate-45 origin-top-left whitespace-nowrap group-hover:text-accent-foreground transition-colors max-w-[120px] truncate">
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-4 opacity-50">Click bars for individual details</p>
      </CardContent>
    </Card>
  );
};

const DrilldownDrawer = ({ data, open, onClose }: any) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent className="sm:max-w-md overflow-y-auto">
      <SheetHeader className="pb-6 border-b">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Award className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Performance Drilldown</span>
        </div>
        <SheetTitle className="text-2xl font-black">{data?.eventName}</SheetTitle>
        <SheetDescription>
          Detailed breakdown of performance.
        </SheetDescription>
      </SheetHeader>

      <div className="py-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/40 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Contribution</p>
            <p className="text-2xl font-black">{data?.total} pts</p>
          </div>
          {data?.participants?.length > 0 && (
            <div className="p-4 bg-muted/40 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Participants</p>
              <p className="text-2xl font-black">{data?.participants?.length || 0}</p>
            </div>
          )}
        </div>

        {data?.winners?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {data.winners[0]?.eventName ? "Prize History" : "Winners"}
            </h4>
            <div className="space-y-2">
              {data.winners.map((winner: any, i: number) => (
                <div key={`${winner.participantId}-${i}`} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={winner.position === 'FIRST' ? 'default' : 'secondary'} className="font-bold">
                      {winner.position}
                    </Badge>
                    <div>
                      <span className="font-semibold text-sm">{winner.name}</span>
                      {winner.eventName && (
                        <p className="text-[10px] text-muted-foreground">{winner.eventName}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-success">+{winner.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.participants?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Users2 className="h-4 w-4 text-primary" />
              {data.winners[0]?.eventName ? "Participated Events" : "Participation"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {data?.participants?.map((p: any, i: number) => (
                <Badge key={`${p.participantId}-${i}`} variant="outline" className="bg-muted/20">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-4 rounded-xl border border-dashed text-xs text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>Participation Points</span>
            <span className="font-mono">{data?.participationPoints}</span>
          </div>
          <div className="flex justify-between">
            <span>Prize Points</span>
            <span className="font-mono">{data?.prizePoints}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span className="font-mono">{data?.total}</span>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

interface CompetitionDashboardProps {
  data: CollegeReport;
}

export function CompetitionDashboard({ data }: CompetitionDashboardProps) {
  const [viewMode, setViewMode] = useState<"events" | "participants">("events");
  const [excludeParticipation, setExcludeParticipation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  console.log({data})

  const scoreStats = useMemo(() => getScoreStats(data), [data]);
  const topPerformer = useMemo(() => getTopPerformer(data), [data]);
  const bestEvent = useMemo(() => getBestEvent(data), [data]);
  const worstEvent = useMemo(() => getWorstEvent(data), [data]);
  const totalWins = useMemo(() => getTotalWins(data), [data]);
  
  const eventChartData = useMemo(() => {
    const rawData = getEventChartData(data);
    if (!excludeParticipation) return rawData;
    return rawData.map(d => ({
      ...d,
      points: Math.max(0, d.points - (d.participation || 0))
    }));
  }, [data, excludeParticipation]);

  const participantChartData = useMemo(() => {
    const rawData = getParticipantChartData(data);
    if (!excludeParticipation) return rawData;
    return rawData.map(d => ({
      ...d,
      points: Math.max(0, d.points - (d.raw.participationPoints || 0))
    }));
  }, [data, excludeParticipation]);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedEvent(null);
  };

  if (!data) return null;

  return (
    <div className="space-y-6">
      <HeaderSummary
        collegeName={data.college.name}
        rank={data.leaderboard.rank}
        totalColleges={data.leaderboard.totalColleges}
        lead={data.leaderboard.pointsAheadOfNext}
      />

      <ScoreBreakdown {...scoreStats} />

      <InsightsStrip
        topPerformer={topPerformer}
        bestEvent={bestEvent}
        worstEvent={worstEvent}
        totalWins={totalWins}
        totalEvents={data.insights.totalEventsParticipated}
      />

      <ToggleButtons 
        value={viewMode} 
        onChange={setViewMode} 
        excludeParticipation={excludeParticipation}
        onToggleExclude={setExcludeParticipation}
      />

      {viewMode === "events" ? (
        <EventChart data={eventChartData} onBarClick={handleEventClick} />
      ) : (
        <ParticipantChart
          data={participantChartData}
          onBarClick={handleEventClick}
          reportData={data}
        />
      )}

      <DrilldownDrawer
        data={selectedEvent}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
