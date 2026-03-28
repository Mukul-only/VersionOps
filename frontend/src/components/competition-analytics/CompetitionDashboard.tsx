import React, { useMemo, useState } from "react";
import { CollegeReport } from "@/api/types";
import {
  getScoreStats,
  getTopPerformer,
  getBestEvent,
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
  User, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  Activity,
  BarChart3,
  Users2,
  MinusCircle,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const HeaderSummary = ({ collegeName, rank, totalColleges, lag }: any) => (
  <div className="relative p-10 rounded-[3rem] bg-[#0a0a0a] overflow-hidden group mb-6 shadow-2xl ring-1 ring-white/5">
    <div className="absolute inset-0 grain-overlay opacity-20 pointer-events-none" />
    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
      <div>
        <Badge className="mb-4 bg-primary text-[#001e1a] hover:bg-primary border-none font-black px-4 py-1.5 rounded-full tracking-wider shadow-[0_0_20px_rgba(124,235,214,0.3)]">
          INSTITUTION PROFILE
        </Badge>
        <h3 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm leading-none">{collegeName}</h3>
        <p className="text-zinc-500 mt-2 font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Multi-Event Performance Dashboard
        </p>
      </div>
      <div className="flex items-center gap-6 p-2 bg-zinc-900/40 rounded-[2.5rem] backdrop-blur-md px-8 py-5 ring-1 ring-white/5">
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1">Rank</p>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="text-3xl font-black text-white tracking-tighter">#{rank}</span>
            {totalColleges && <span className="text-xs font-bold text-zinc-600 mt-2">/{totalColleges}</span>}
          </div>
        </div>
        <div className="w-[1px] h-10 bg-white/5 mx-2" />
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1">{rank === 1 ? "Lead" : "Lag"}</p>
          <div className="flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-zinc-500" />
            <span className="text-3xl font-black text-white tracking-tighter">{rank === 1 ? 0 : lag} pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ScoreBreakdown = ({ participationPoints, prizePoints, adjustmentPoints, total }: any) => {
  const items = [
    { label: "Participation Points", value: participationPoints, icon: Activity, color: "text-[#00d2ff]", bg: "bg-[#00d2ff]/10" },
    { label: "Win Points", value: prizePoints, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Adjustments", value: adjustmentPoints, icon: AlertCircle, color: adjustmentPoints >= 0 ? "text-emerald-500" : "text-destructive", bg: adjustmentPoints >= 0 ? "bg-emerald-500/10" : "bg-destructive/10" },
    { label: "Total Score", value: total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ].filter(item => item.label !== "Adjustments" || item.value !== 0);

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 gap-6",
      items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
    )}>
      {items.map((item) => (
        <Card key={item.label} className="bg-[#111] border-none ring-1 ring-white/5 hover:ring-primary/20 transition-all rounded-[2rem] overflow-hidden group shadow-xl relative">
          <div className={cn("absolute top-0 left-0 w-1 h-full opacity-50", item.color.replace('text-', 'bg-'))} />
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500 bg-black/40")}>
                <item.icon className={cn("h-6 w-6 font-black", item.color)} />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</p>
                <p className="text-3xl font-black tracking-tighter text-white">{item.value}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
                  style={{ width: `${(parseFloat(item.value) / 300) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const InsightsStrip = ({ topPerformer, bestEvent, totalWins, totalEvents }: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <Card className="bg-[#0a0a0a] border-none ring-1 ring-white/5 shadow-xl hover:ring-primary/20 transition-all group rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-zinc-900 rounded-2xl group-hover:bg-primary/10 transition-colors">
            <Award className="h-6 w-6 text-amber-500 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1 opacity-60">Performance</p>
            <p className="font-black text-xl tracking-tighter text-white group-hover:text-primary transition-colors">{totalWins} Wins</p>
            <p className="text-zinc-500 text-[10px] font-bold italic opacity-40">across {totalEvents} events</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-[#0a0a0a] border-none ring-1 ring-white/5 shadow-xl hover:ring-primary/20 transition-all group rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-zinc-900 rounded-2xl group-hover:bg-primary/10 transition-colors">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1 opacity-60">Top Contributor</p>
            <p className="font-black truncate text-xl tracking-tighter text-white group-hover:text-primary transition-colors">{topPerformer?.name || "N/A"}</p>
            <p className="text-zinc-500 text-[10px] font-bold italic opacity-40">Leading contributor</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-[#0a0a0a] border-none ring-1 ring-white/5 shadow-xl hover:ring-primary/20 transition-all group rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-zinc-900 rounded-2xl group-hover:bg-primary/10 transition-colors">
            <TrendingUp className="h-6 w-6 text-emerald-500 group-hover:text-primary transition-colors" />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1 opacity-60">Best Event</p>
            <p className="font-black truncate text-xl tracking-tighter text-white group-hover:text-primary transition-colors">{bestEvent?.eventName || "N/A"}</p>
            <p className="text-zinc-500 text-[10px] font-bold italic opacity-40">Highest scored event</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ToggleButtons = ({ value, onChange, excludeParticipation, onToggleExclude }: any) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
    <div className="flex p-1 bg-zinc-900/80 backdrop-blur-xl rounded-full w-fit ring-1 ring-white/10 shadow-2xl">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-full px-8 transition-all font-black text-[11px] uppercase tracking-widest h-10",
          value === 'events' ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        onClick={() => onChange('events')}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        By Events
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-full px-8 transition-all font-black text-[11px] uppercase tracking-widest h-10",
          value === 'participants' ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        onClick={() => onChange('participants')}
      >
        <Users2 className="h-4 w-4 mr-2" />
        By Participants
      </Button>
    </div>

    <div className="flex items-center space-x-4 bg-zinc-950/50 backdrop-blur-md px-6 py-2.5 rounded-full ring-1 ring-white/5 shadow-lg group cursor-pointer transition-all hover:ring-primary/30"
         onClick={() => onToggleExclude(!excludeParticipation)}>
      <Checkbox 
        id="exclude-participation" 
        checked={excludeParticipation} 
        onCheckedChange={onToggleExclude}
        className="rounded-full border-muted-foreground/30 data-[state=checked]:bg-primary w-5 h-5"
      />
      <label
        htmlFor="exclude-participation"
        className="text-[10px] font-black leading-none flex items-center gap-2 cursor-pointer uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors"
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
    <Card className="bg-[#0a0a0a] border-none ring-1 ring-white/5 shadow-xl transition-all rounded-[2.5rem] overflow-hidden">
      <CardHeader className="px-8 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-black tracking-tight text-white">Event Performance Summary</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] border-white/5 text-zinc-500 font-bold tracking-widest px-3 rounded-full uppercase">Top 5 Recent</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="h-[400px] w-full overflow-x-auto scrollbar-wizardly pb-6">
          <div className="h-full flex items-end gap-6 min-w-[600px] border-b border-white/[0.05] relative px-4 pb-10 pt-20">
            {data.map((d: any) => {
              const heightPercent = Math.max((d.points / maxPoints) * 100, 4);
              return (
                <div 
                  key={d.name} 
                  className="flex-1 group relative cursor-pointer min-w-[60px] flex flex-col items-center"
                  onClick={() => onBarClick && onBarClick(d.raw)}
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary text-primary-foreground text-[10px] px-4 py-2 rounded-full border-none shadow-[0_0_20px_rgba(var(--primary),0.3)] z-50 whitespace-nowrap font-black scale-90 group-hover:scale-100">
                    {d.points} Points
                  </div>
                  <div 
                    className={cn(
                      "w-full rounded-t-2xl transition-all duration-700 relative group-hover:brightness-125",
                      d.points === 0 
                        ? "bg-zinc-900/50 border border-dashed border-white/10" 
                        : "bg-teal-gradient-wizardly shadow-[0_0_20px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_30px_rgba(var(--primary),0.4)]"
                    )}
                    style={{ height: `${(heightPercent * 250) / 100}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-10 rounded-t-2xl" />
                  </div>
                  <div className="absolute top-full mt-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap group-hover:text-primary transition-all max-w-[80px] truncate text-center group-hover:scale-110 group-hover:opacity-100">
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 opacity-70">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary teal-glow" />
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Points Scored</span>
             </div>
           </div>
           <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary animate-pulse">Select entry for analysis</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ParticipantChart = ({ data, onBarClick, reportData }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  
  return (
    <Card className="bg-[#0a0a0a] border-none ring-1 ring-white/5 shadow-xl transition-all rounded-[2.5rem] overflow-hidden">
      <CardHeader className="px-8 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-black tracking-tight text-white">Squad Contribution Summary</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] border-white/5 text-zinc-500 font-bold tracking-widest px-3 rounded-full uppercase">All Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="h-[400px] w-full overflow-x-auto scrollbar-wizardly pb-6">
          <div className="h-full flex items-end gap-6 min-w-[600px] border-b border-white/[0.05] relative px-4 pb-10 pt-20">
            {data.map((d: any) => {
              const heightPercent = Math.max((d.points / maxPoints) * 100, 4);
              
              // Logic from remote: find events and winners for this participant
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
                  className="flex-1 group relative cursor-pointer min-w-[60px] flex flex-col items-center"
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
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary text-primary-foreground text-[10px] px-4 py-2 rounded-full border-none shadow-[0_0_20px_rgba(var(--primary),0.3)] z-50 whitespace-nowrap font-black scale-90 group-hover:scale-100">
                    {d.points} Points
                  </div>
                  <div 
                    className={cn(
                      "w-full rounded-t-2xl transition-all duration-700 relative group-hover:brightness-125",
                      d.points === 0 
                        ? "bg-zinc-900/50 border border-dashed border-white/10" 
                        : "bg-teal-gradient-wizardly shadow-[0_0_20px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_30px_rgba(var(--primary),0.4)]"
                    )}
                    style={{ height: `${(heightPercent * 250) / 100}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-10 rounded-t-2xl" />
                  </div>
                  <div className="absolute top-full mt-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap group-hover:text-primary transition-all max-w-[80px] truncate text-center group-hover:scale-110 group-hover:opacity-100">
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 opacity-70">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary teal-glow" />
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Individual Impact</span>
             </div>
           </div>
           <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary animate-pulse">Select entry for analysis</p>
        </div>
      </CardContent>
    </Card>
  );
};

const DrilldownDrawer = ({ data, open, onClose, isParticipantView }: any) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent className="sm:max-w-md overflow-y-auto border-l border-white/5 bg-[#0a0a0a] shadow-2xl p-0">
      <SheetHeader className="p-10 border-b border-white/[0.03] relative overflow-hidden bg-zinc-900/20">
        <div className="absolute -top-10 -right-10 opacity-[0.03]">
           <Award className="h-60 w-60 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-primary mb-4 relative z-10">
          <Badge className="bg-primary text-primary-foreground border-none font-black text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
            ENTRY ANALYTICS
          </Badge>
        </div>
        <SheetTitle className="text-4xl font-black tracking-tighter relative z-10 leading-none text-white">{data?.eventName}</SheetTitle>
        <SheetDescription className="text-sm font-bold relative z-10 mt-3 text-muted-foreground opacity-70">
          {isParticipantView 
            ? "Detailed overview of specific event participations and earned honors."
            : "Final verified performance metrics for this specific competition entry."}
        </SheetDescription>
      </SheetHeader>

      <div className="p-10 space-y-12">
        {!isParticipantView && (
          <div className="grid grid-cols-2 gap-5">
            <div className="p-8 bg-zinc-900/40 rounded-3xl ring-1 ring-white/5 shadow-inner group hover:bg-zinc-900/60 transition-colors">
              <p className="text-[10px] uppercase font-black text-muted-foreground mb-3 tracking-[0.2em] opacity-60">Net Yield</p>
              <p className="text-5xl font-black tracking-tighter leading-none text-white">{data?.total}<span className="text-sm font-bold text-primary ml-1.5">pts</span></p>
            </div>
            {data?.participants?.length > 0 && (
              <div className="p-8 bg-zinc-900/40 rounded-3xl ring-1 ring-white/5 shadow-inner group hover:bg-zinc-900/60 transition-colors">
                <p className="text-[10px] uppercase font-black text-muted-foreground mb-3 tracking-[0.2em] opacity-60">Unit Size</p>
                <p className="text-5xl font-black tracking-tighter leading-none text-white">{data?.participants?.length || 0}<span className="text-sm font-bold text-muted-foreground ml-1.5">x</span></p>
              </div>
            )}
          </div>
        )}

        {data?.winners?.length > 0 && (
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <div className="p-1.5 bg-amber-500/10 rounded-md">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              {isParticipantView ? "Honorable Results" : "Victory Profile"}
            </h4>
            <div className="space-y-4">
              {data.winners.map((winner: any, i: number) => (
                <div key={`${winner.participantId}-${i}`} className="flex items-center justify-between p-5 bg-zinc-900/30 ring-1 ring-white/5 rounded-2xl shadow-sm hover:bg-zinc-900/50 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center font-black text-sm shadow-2xl",
                      winner.position === 'FIRST' ? 'bg-amber-500 text-amber-950' : 
                      winner.position === 'SECOND' ? 'bg-slate-400 text-slate-900' : 'bg-orange-600 text-orange-950'
                    )}>
                      {winner.position === 'FIRST' ? '1st' : winner.position === 'SECOND' ? '2nd' : '3rd'}
                    </div>
                    <div>
                      <span className="font-black text-md block text-zinc-100 group-hover:text-primary transition-colors underline-offset-4">{winner.name}</span>
                      {winner.eventName && (
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mt-1 opacity-60">{winner.eventName}</p>
                      )}
                    </div>
                  </div>
                  {!isParticipantView && (
                    <div className="flex flex-col items-end">
                      <span className="font-black text-lg text-primary tracking-tighter leading-none">+{winner.points}</span>
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Gained</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.participants?.length > 0 && (
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              {isParticipantView ? "Event Deployment" : "Active Personnel"}
            </h4>
            <div className="flex flex-wrap gap-3">
              {data?.participants?.map((p: any, i: number) => (
                <Badge key={`${p.participantId}-${i}`} className="bg-zinc-800 text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-default border-none font-black px-5 py-2 rounded-full tracking-tight text-xs">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {(true || !isParticipantView) && (
          <div className="bg-zinc-900/60 ring-1 ring-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-8 space-y-5">
               <div className="flex justify-between items-center">
                 <span className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Participation Base</span>
                 <span className="font-black text-lg tracking-tighter text-white">{data?.participationPoints}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Performance Bonus</span>
                 <span className="font-black text-lg tracking-tighter text-amber-500">+{data?.prizePoints}</span>
               </div>
               <div className="h-px bg-white/[0.03]" />
               <div className="flex justify-between items-center pt-3">
                 <div className="flex flex-col">
                   <span className="font-black text-[10px] uppercase tracking-[0.4em] text-primary mb-1">Total Yield</span>
                   <span className="text-[10px] text-muted-foreground font-bold italic opacity-40">Final score calculation</span>
                 </div>
                 <span className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(var(--primary),0.2)]">{data?.total}</span>
               </div>
            </div>
          </div>
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
        lag={data.leaderboard.pointsToRankAbove}
      />

      <ScoreBreakdown {...scoreStats} />

      <InsightsStrip
        topPerformer={topPerformer}
        bestEvent={bestEvent}
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
