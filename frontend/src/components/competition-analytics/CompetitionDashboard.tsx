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
  <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-muted/20 relative">
    <div className="absolute top-0 right-0 p-8 opacity-5">
      <Trophy className="h-32 w-32" />
    </div>
    <CardContent className="p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 bg-primary/5 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">
            Institution Profile
          </Badge>
          <h3 className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">{collegeName}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2 font-medium">
            <Target className="h-4 w-4 text-primary" />
            Final Competition Analytics Report
          </p>
        </div>
        <div className="flex items-center gap-8 bg-background/40 backdrop-blur-sm p-4 rounded-2xl border shadow-sm">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rank</p>
            <p className="text-4xl font-black text-primary flex items-baseline gap-1">
              #{rank}
              <span className="text-xs font-bold text-muted-foreground">/{totalColleges}</span>
            </p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Lead</p>
            <p className="text-4xl font-black text-emerald-500">
              +{lead}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ScoreBreakdown = ({ participationPoints, prizePoints, adjustmentPoints, total }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[
      { label: "Participation", value: participationPoints, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/10" },
      { label: "Prizes", value: prizePoints, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/10" },
      { label: "Adjustments", value: adjustmentPoints, icon: AlertCircle, color: adjustmentPoints >= 0 ? "text-emerald-500" : "text-destructive", bg: adjustmentPoints >= 0 ? "bg-emerald-500/10" : "bg-destructive/10", border: adjustmentPoints >= 0 ? "border-emerald-500/10" : "border-destructive/10" },
      { label: "Total Score", value: total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
    ].map((item) => (
      <Card key={item.label} className={cn("border-none bg-card hover:shadow-md transition-all duration-300 group overflow-hidden relative")}>
        <div className={cn("absolute top-0 left-0 w-1 h-full", item.color.replace('text-', 'bg-'))} />
        <CardContent className="p-5 flex items-center gap-5">
          <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", item.bg)}>
            <item.icon className={cn("h-6 w-6", item.color)} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</p>
            <p className="text-2xl font-black tracking-tight">{item.value}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const InsightsStrip = ({ topPerformer, bestEvent, worstEvent, totalWins, totalEvents }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-2xl">
            <Award className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Success Rate</p>
            <p className="font-black text-base">{totalWins} Wins</p>
            <p className="text-muted-foreground text-[10px] font-bold">across {totalEvents} events</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Top MVP</p>
            <p className="font-black truncate text-base">{topPerformer?.name || "N/A"}</p>
            <p className="text-muted-foreground text-[10px] font-bold">Leading contributor</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Peak Strength</p>
            <p className="font-black truncate text-base">{bestEvent?.eventName || "N/A"}</p>
            <p className="text-muted-foreground text-[10px] font-bold">Highest scored event</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-destructive/10 rounded-2xl">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Growth Area</p>
            <p className="font-black truncate text-base">{worstEvent?.eventName || "N/A"}</p>
            <p className="text-muted-foreground text-[10px] font-bold">Area for improvement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ToggleButtons = ({ value, onChange, excludeParticipation, onToggleExclude }: any) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
    <div className="flex p-1 bg-muted/50 backdrop-blur-sm rounded-2xl w-fit border shadow-inner">
      <Button
        variant={value === 'events' ? 'default' : 'ghost'}
        size="sm"
        className={cn("rounded-xl px-6 transition-all font-bold", value === 'events' ? "shadow-md scale-105" : "text-muted-foreground")}
        onClick={() => onChange('events')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        By Events
      </Button>
      <Button
        variant={value === 'participants' ? 'default' : 'ghost'}
        size="sm"
        className={cn("rounded-xl px-6 transition-all font-bold", value === 'participants' ? "shadow-md scale-105" : "text-muted-foreground")}
        onClick={() => onChange('participants')}
      >
        <Users2 className="h-4 w-4 mr-2" />
        By Participants
      </Button>
    </div>

    <div className="flex items-center space-x-3 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-2xl border shadow-sm hover:border-primary/50 transition-all cursor-pointer select-none group"
         onClick={() => onToggleExclude(!excludeParticipation)}>
      <Checkbox 
        id="exclude-participation" 
        checked={excludeParticipation} 
        onCheckedChange={onToggleExclude}
        className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
      />
      <label
        htmlFor="exclude-participation"
        className="text-[11px] font-black leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors"
      >
        <MinusCircle className={cn("h-4 w-4 transition-colors", excludeParticipation ? "text-primary" : "text-muted-foreground")} />
        Exclude Participation Points
      </label>
    </div>
  </div>
);

const EventChart = ({ data, onBarClick }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-none shadow-inner overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Event Performance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto pb-8 scrollbar-hide">
          <div className="h-56 flex items-end gap-3 min-w-[600px] border-b border-border/50 relative px-2">
            {data.map((d: any) => {
              const heightPercent = Math.max((d.points / maxPoints) * 100, 4);
              return (
                <div 
                  key={d.name} 
                  className="flex-1 group relative cursor-pointer min-w-[48px] flex flex-col items-center"
                  onClick={() => onBarClick && onBarClick(d.raw)}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-foreground text-background text-[10px] px-3 py-1.5 rounded-xl border shadow-xl z-20 whitespace-nowrap font-black scale-90 group-hover:scale-100">
                    {d.points} Points
                  </div>
                  <div 
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-500 relative group-hover:brightness-110",
                      d.points === 0 
                        ? "bg-muted-foreground/10 border border-dashed border-muted-foreground/20" 
                        : "bg-gradient-to-t from-primary via-primary/80 to-primary/60 shadow-[0_0_20px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.3)]"
                    )}
                    style={{ height: `${(heightPercent * 224) / 100}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-30 rounded-t-xl" />
                  </div>
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-muted-foreground uppercase tracking-wider whitespace-nowrap group-hover:text-primary transition-all max-w-[60px] truncate text-center group-hover:scale-110">
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-primary" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Points Scored</span>
           </div>
           <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary animate-pulse">Click bars for details</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ParticipantChart = ({ data, onBarClick, reportData }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-none shadow-inner overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          Squad Contribution Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto pb-8 scrollbar-hide">
          <div className="h-56 flex items-end gap-3 min-w-[600px] border-b border-border/50 relative px-2">
            {data.map((d: any) => {
              const heightPercent = Math.max((d.points / maxPoints) * 100, 4);
              
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
                  className="flex-1 group relative cursor-pointer min-w-[48px] flex flex-col items-center"
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
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-accent-foreground text-accent text-[10px] px-3 py-1.5 rounded-xl border shadow-xl z-20 whitespace-nowrap font-black scale-90 group-hover:scale-100">
                    {d.points} Points
                  </div>
                  <div 
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-500 relative group-hover:brightness-110",
                      d.points === 0 
                        ? "bg-muted-foreground/10 border border-dashed border-muted-foreground/20" 
                        : "bg-gradient-to-t from-accent-foreground via-accent-foreground/80 to-accent-foreground/60 shadow-[0_0_20px_rgba(var(--accent-foreground),0.1)] group-hover:shadow-[0_0_25px_rgba(var(--accent-foreground),0.3)]"
                    )}
                    style={{ height: `${(heightPercent * 224) / 100}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-30 rounded-t-xl" />
                  </div>
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-muted-foreground uppercase tracking-wider whitespace-nowrap group-hover:text-primary transition-all max-w-[60px] truncate text-center group-hover:scale-110">
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-accent-foreground" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Individual Impact</span>
           </div>
           <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary animate-pulse">Click bars for details</p>
        </div>
      </CardContent>
    </Card>
  );
};

const DrilldownDrawer = ({ data, open, onClose, isParticipantView }: any) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent className="sm:max-w-md overflow-y-auto border-l-0 shadow-2xl">
      <SheetHeader className="pb-8 border-b relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-5">
           <Award className="h-40 w-40" />
        </div>
        <div className="flex items-center gap-2 text-primary mb-3 relative">
          <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] tracking-widest px-3 py-1">
            PERFORMANCE DRILLDOWN
          </Badge>
        </div>
        <SheetTitle className="text-3xl font-black tracking-tighter relative">{data?.eventName}</SheetTitle>
        <SheetDescription className="text-sm font-medium relative mt-1">
          {isParticipantView 
            ? "Overview of specific event participations and honors."
            : "Final performance metrics for this specific entry."}
        </SheetDescription>
      </SheetHeader>

      <div className="py-8 space-y-10">
        {!isParticipantView && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-muted/30 rounded-3xl border border-muted-foreground/5 shadow-sm">
              <p className="text-[10px] uppercase font-black text-muted-foreground mb-2 tracking-widest">Net Contribution</p>
              <p className="text-4xl font-black tracking-tighter">{data?.total}<span className="text-sm font-bold text-muted-foreground ml-1">pts</span></p>
            </div>
            {data?.participants?.length > 0 && (
              <div className="p-6 bg-muted/30 rounded-3xl border border-muted-foreground/5 shadow-sm">
                <p className="text-[10px] uppercase font-black text-muted-foreground mb-2 tracking-widest">Squad Size</p>
                <p className="text-4xl font-black tracking-tighter">{data?.participants?.length || 0}</p>
              </div>
            )}
          </div>
        )}

        {data?.winners?.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {isParticipantView ? "Event Results" : "Victory History"}
            </h4>
            <div className="space-y-3">
              {data.winners.map((winner: any, i: number) => (
                <div key={`${winner.participantId}-${i}`} className="flex items-center justify-between p-4 bg-background border rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner",
                      winner.position === 'FIRST' ? 'bg-yellow-500/10 text-yellow-600' : 
                      winner.position === 'SECOND' ? 'bg-slate-500/10 text-slate-600' : 'bg-orange-500/10 text-orange-600'
                    )}>
                      {winner.position === 'FIRST' ? '1st' : winner.position === 'SECOND' ? '2nd' : '3rd'}
                    </div>
                    <div>
                      <span className="font-black text-sm block">{winner.name}</span>
                      {winner.eventName && (
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{winner.eventName}</p>
                      )}
                    </div>
                  </div>
                  {!isParticipantView && (
                    <span className="font-black text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 group-hover:scale-110 transition-transform">+{winner.points}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.participants?.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {isParticipantView ? "Event Participations" : "Involved Members"}
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {data?.participants?.map((p: any, i: number) => (
                <Badge key={`${p.participantId}-${i}`} variant="secondary" className="bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors cursor-default border-none font-bold px-4 py-1.5 rounded-full">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {!isParticipantView && (
          <Card className="bg-muted/20 border-none shadow-inner rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
               <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-muted-foreground uppercase tracking-widest">Base Participation</span>
                 <span className="font-black text-base">{data?.participationPoints}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-muted-foreground uppercase tracking-widest">Winning Points</span>
                 <span className="font-black text-base text-amber-500">+{data?.prizePoints}</span>
               </div>
               <div className="h-px bg-border/50" />
               <div className="flex justify-between items-center pt-2">
                 <span className="font-black text-[10px] uppercase tracking-[0.3em] text-primary">Final Yield</span>
                 <span className="text-3xl font-black tracking-tighter text-foreground">{data?.total}</span>
               </div>
            </CardContent>
          </Card>
        )}
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
    <div className="space-y-4">
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
        isParticipantView={viewMode === "participants"}
      />
    </div>
  );
}
