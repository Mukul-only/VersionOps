import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  Target,
  ChevronRight,
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
        <h3 className="text-display drop-shadow-sm">{collegeName}</h3>
        <p className="text-body-lg text-zinc-500 mt-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Multi-Event Performance
          Dashboard
        </p>
      </div>
      <div className="flex items-center gap-6 p-2 bg-zinc-900/40 rounded-[2.5rem] backdrop-blur-md px-8 py-5 ring-1 ring-white/5">
        <div className="flex flex-col items-center">
          <p className="section-label mb-1">Rank</p>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="text-metric-lg">#{rank}</span>
            {totalColleges && (
              <span className="text-label text-zinc-600 mt-2">
                /{totalColleges}
              </span>
            )}
          </div>
        </div>
        <div className="w-[1px] h-10 bg-white/5 mx-2" />
        <div className="flex flex-col items-center">
          <p className="section-label mb-1">{rank === 1 ? "Lead" : "Lag"}</p>
          <div className="flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-zinc-500" />
            <span className="text-metric-lg">{rank === 1 ? 0 : lag} pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ScoreBreakdown = ({
  participationPoints,
  prizePoints,
  adjustmentPoints,
  total,
}: any) => {
  const items = [
    {
      label: "Participation Points",
      value: participationPoints,
      icon: Activity,
      color: "text-[#00d2ff]",
      bg: "bg-[#00d2ff]/10",
    },
    {
      label: "Prize Points",
      value: prizePoints,
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Adjustment Points",
      value: adjustmentPoints,
      icon: AlertCircle,
      color: adjustmentPoints >= 0 ? "text-emerald-500" : "text-destructive",
      bg: adjustmentPoints >= 0 ? "bg-emerald-500/10" : "bg-destructive/10",
    },
    {
      label: "Total Score",
      value: total,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ].filter((item) => item.label !== "Adjustment Points" || item.value !== 0);

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-6",
        items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          className="bg-[#111] border-none ring-1 ring-white/5 hover:ring-primary/20 transition-all rounded-[2rem] overflow-hidden group shadow-xl relative"
        >
          <div
            className={cn(
              "absolute top-0 left-0 w-1 h-full opacity-50",
              item.color.replace("text-", "bg-"),
            )}
          />
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div
                className={cn(
                  "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500 bg-black/40",
                )}
              >
                <item.icon className={cn("h-6 w-6 font-black", item.color)} />
              </div>
              <div className="text-right">
                <p className="section-label mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </p>
                <p className="text-metric-lg">{item.value}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color.replace("text-", "bg-")} transition-all duration-1000 ease-out`}
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

const InsightsStrip = ({
  topPerformer,
  bestEvent,
  totalWins,
  totalEvents,
}: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <Card className="bg-[#0a0a0a] border-none ring-1 ring-white/5 shadow-xl hover:ring-primary/20 transition-all group rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-zinc-900 rounded-2xl group-hover:bg-primary/10 transition-colors">
            <Award className="h-6 w-6 text-amber-500 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="section-label mb-1 opacity-60">Total Wins</p>
            <p className="text-metric group-hover:text-primary transition-colors">
              {totalWins}
            </p>
            <p className="text-caption italic opacity-40">
              across {totalEvents} events
            </p>
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
            <p className="section-label mb-1 opacity-60">Top Contributor</p>
            <p className="text-metric truncate group-hover:text-primary transition-colors">
              {topPerformer?.name || "N/A"}
            </p>
            <p className="text-caption italic opacity-40">
              Leading contributor
            </p>
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
            <p className="section-label mb-1 opacity-60">Best Event</p>
            <p className="text-metric truncate group-hover:text-primary transition-colors">
              {bestEvent?.eventName || "N/A"}
            </p>
            <p className="caption italic opacity-40">
              Highest scoring event
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const ToggleButtons = ({
  value,
  onChange,
  excludeParticipation,
  onToggleExclude,
}: any) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 4, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLButtonElement>(null);
  const participantsRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const activeRef =
      value === "events" ? eventsRef.current : participantsRef.current;
    const container = containerRef.current;
    if (activeRef && container) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeRef.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }
  }, [value]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
      <div
        ref={containerRef}
        className="flex p-1 bg-card border border-border rounded-full w-fit relative shadow-sm"
      >
        <div
          className="absolute h-[calc(100%-8px)] rounded-full bg-primary/20 z-0 transition-all duration-500 ease-out-quart top-1"
          style={{
            width:
              indicatorStyle.width || (value === "events" ? "112px" : "150px"),
            left: indicatorStyle.left || (value === "events" ? "4px" : "120px"),
          }}
        />

        <Button
          ref={eventsRef}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full px-6 transition-all relative z-10 w-auto text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value === "events"
              ? "text-primary hover:text-primary hover:bg-transparent pointer-events-none"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent",
          )}
          onClick={() => onChange("events")}
        >
          <BarChart3
            className={cn(
              "h-4 w-4 mr-2",
              value === "events" ? "text-primary" : "text-muted-foreground",
            )}
          />
          By Events
        </Button>
        <Button
          ref={participantsRef}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full px-6 transition-all relative z-10 w-auto text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value === "participants"
              ? "text-primary hover:text-primary hover:bg-transparent pointer-events-none"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent",
          )}
          onClick={() => onChange("participants")}
        >
          <Users2
            className={cn(
              "h-4 w-4 mr-2",
              value === "participants"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          />
          By Participants
        </Button>
      </div>

      <div
        className="flex items-center space-x-3 bg-card border border-border px-5 py-2.5 rounded-full group cursor-pointer transition-all duration-300 hover:bg-muted shadow-sm"
        onClick={() => onToggleExclude(!excludeParticipation)}
      >
        <Checkbox
          id="exclude-participation"
          checked={excludeParticipation}
          onCheckedChange={onToggleExclude}
          className="rounded-md border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4 transition-all"
        />
        <label
          htmlFor="exclude-participation"
          className="text-label leading-none flex items-center gap-2 cursor-pointer text-muted-foreground group-hover:text-foreground transition-colors"
        >
          <MinusCircle
            className={cn(
              "h-4 w-4 transition-colors",
              excludeParticipation ? "text-primary" : "text-muted-foreground",
            )}
          />
          Exclude Participation
        </label>
      </div>
    </div>
  );
};

export const EventChart = ({ data, onBarClick }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  const [mounted, setMounted] = useState(false);
  const isMounting = useRef(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      // After first mount, all subsequent renders are data changes
      setTimeout(() => { isMounting.current = false; }, 800);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const MAX_H = 200;

  return (
    <div className="bg-card rounded-[1.5rem] overflow-hidden border border-border">
      <div className="px-8 pt-8 flex items-center justify-between border-b border-border pb-4">
        <h3 className="section-label">Event Activity</h3>
        <span className="section-label text-primary bg-primary/10 px-3 py-1 rounded-full">
          pts per event
        </span>
      </div>
      <div className="p-4">
        <div className="h-[360px] w-full overflow-x-auto pb-4 pt-4 scrollbar-wizardly">
          <div className="h-full flex items-end gap-8 min-w-full relative px-6 pb-16 border-b border-border w-max">
            {data.map((d: any, i: number) => {
              const scaleY = mounted
                ? Math.max(d.points / maxPoints, d.points === 0 ? 0.04 : 0.04)
                : 0;
              const staggerDelay = isMounting.current ? i * 60 : 0;

              return (
                <div
                  key={d.name}
                  className="flex-1 group relative cursor-pointer min-w-[100px] max-w-[140px] flex flex-col items-center"
                  onClick={() => onBarClick && onBarClick(d.raw)}
                >
                  {/* Value label */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-50 group-hover:-translate-y-1 whitespace-nowrap"
                    style={{
                      bottom: `${MAX_H * scaleY + 8}px`,
                      opacity: mounted ? 1 : 0,
                      transition: `opacity 300ms cubic-bezier(0.16,1,0.3,1) ${mounted && isMounting.current ? i * 60 + 500 : 50}ms, transform 200ms cubic-bezier(0.25,1,0.5,1), bottom 450ms cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms`,
                    }}
                  >
                    <div className="text-foreground text-label font-bold">
                      {d.points}
                    </div>
                  </div>

                  {/* Bar — fixed height, scaleY is data-driven */}
                  <div
                    className={cn(
                      "w-full rounded-t-xl relative origin-bottom group-hover:brightness-110",
                      d.points === 0
                        ? "bg-muted border border-dashed border-border"
                        : "bg-primary",
                    )}
                    style={{
                      height: `${MAX_H}px`,
                      transform: `scaleY(${scaleY})`,
                      transition: `transform 450ms cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms, filter 200ms ease`,
                    }}
                  />

                  <div
                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 section-label group-hover:text-primary transition-colors w-[80px] text-center break-words whitespace-normal leading-tight"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${mounted && isMounting.current ? i * 60 + 300 : 0}ms, color 150ms ease`,
                    }}
                  >
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ParticipantChart = ({ data, onBarClick, reportData }: any) => {
  const maxPoints = Math.max(...data.map((d: any) => d.points), 10);
  const [mounted, setMounted] = useState(false);
  const isMounting = useRef(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      setTimeout(() => { isMounting.current = false; }, 800);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const MAX_H = 200;

  return (
    <div className="bg-card rounded-[1.5rem] overflow-hidden border border-border">
      <div className="px-8 pt-8 flex items-center justify-between border-b border-border pb-4">
        <h3 className="section-label">Individual Contribution</h3>
        <span className="section-label text-warning bg-warning/10 px-3 py-1 rounded-full">
          Score Breakdown
        </span>
      </div>
      <div className="p-4">
        <div className="h-[360px] w-full overflow-x-auto pb-4 pt-4 scrollbar-wizardly">
          <div className="h-full flex items-end gap-8 min-w-full relative px-6 pb-16 border-b border-border w-max">
            {data.map((d: any, i: number) => {
              const scaleY = mounted
                ? Math.max(d.points / maxPoints, 0.04)
                : 0;
              const staggerDelay = isMounting.current ? i * 60 : 0;

              const participantEvents =
                reportData?.eventBreakdown?.filter((event: any) =>
                  event.participants.some((p: any) => p.participantId === d.id),
                ) || [];

              const participantWinners =
                reportData?.eventBreakdown?.flatMap((event: any) =>
                  event.winners
                    .filter((w: any) => w.participantId === d.id)
                    .map((w: any) => ({
                      ...w,
                      eventName: event.eventName,
                    })),
                ) || [];

              return (
                <div
                  key={d.id}
                  className="flex-1 group relative cursor-pointer min-w-[100px] max-w-[140px] flex flex-col items-center"
                  onClick={() =>
                    onBarClick &&
                    onBarClick({
                      eventName: d.name,
                      total: d.points,
                      participationPoints: d.raw.participationPoints,
                      prizePoints: d.raw.prizePoints,
                      participants: participantEvents.map((e: any) => ({
                        participantId: e.eventId,
                        name: e.eventName,
                      })),
                      winners: participantWinners.map((w: any) => ({
                        participantId: w.participantId,
                        name: w.eventName,
                        position: w.position,
                        points: w.points,
                      })),
                    })
                  }
                >
                  {/* Value label */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-50 group-hover:-translate-y-1 whitespace-nowrap"
                    style={{
                      bottom: `${MAX_H * scaleY + 8}px`,
                      opacity: mounted ? 1 : 0,
                      transition: `opacity 300ms cubic-bezier(0.16,1,0.3,1) ${mounted && isMounting.current ? i * 60 + 500 : 50}ms, transform 200ms cubic-bezier(0.25,1,0.5,1), bottom 450ms cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms`,
                    }}
                  >
                    <div className="text-foreground text-label font-bold">
                      {d.points}
                    </div>
                  </div>

                  {/* Bar — fixed height, scaleY is data-driven */}
                  <div
                    className={cn(
                      "w-full rounded-t-xl relative origin-bottom group-hover:brightness-110",
                      d.points === 0
                        ? "bg-muted border border-dashed border-border"
                        : "bg-warning",
                    )}
                    style={{
                      height: `${MAX_H}px`,
                      transform: `scaleY(${scaleY})`,
                      transition: `transform 450ms cubic-bezier(0.16,1,0.3,1) ${staggerDelay}ms, filter 200ms ease`,
                    }}
                  />

                  <div
                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 section-label group-hover:text-warning transition-colors w-[100px] text-center break-words whitespace-normal leading-tight"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${mounted && isMounting.current ? i * 60 + 300 : 0}ms, color 150ms ease`,
                    }}
                  >
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DrilldownDrawer = ({
  data,
  open,
  onClose,
  isParticipantView,
}: any) => (
  <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
    <SheetContent className="sm:max-w-md overflow-y-auto border-l border-border bg-card p-0">
      <SheetHeader className="p-6 border-b border-border">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-wider uppercase text-primary">
            Entry Analytics
          </span>
          <SheetTitle className="text-xl font-bold leading-tight">
            {data?.eventName}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground mt-1">
            {isParticipantView
              ? "Detailed overview of specific event participations and earned honors."
              : "Final verified performance metrics for this competition entry."}
          </SheetDescription>
        </div>
      </SheetHeader>

      <div className="p-6 space-y-8">
        {!isParticipantView && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-baseline border-b border-border/50 pb-3">
              <span className="text-sm text-muted-foreground font-medium">
                Total Points
              </span>
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {data?.total}{" "}
                <span className="text-sm text-primary font-bold">pts</span>
              </span>
            </div>
            {data?.participants?.length > 0 && (
              <div className="flex justify-between items-baseline border-b border-border/50 pb-3">
                <span className="text-sm text-muted-foreground font-medium">
                  Total Members
                </span>
                <span className="text-2xl font-bold tabular-nums tracking-tight">
                  {data?.participants?.length || 0}{" "}
                  <span className="text-sm text-muted-foreground font-bold">
                    x
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {data?.winners?.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              {isParticipantView ? "Results" : "Winners"}
            </h4>
            <div className="flex flex-col gap-1">
              {data.winners.map((winner: any, i: number) => (
                <div
                  key={`${winner.participantId}-${i}`}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-xs font-bold w-7 text-center px-1.5 py-0.5 rounded-md",
                        winner.position === "FIRST"
                          ? "bg-[#eab308]/10 text-[#eab308]"
                          : winner.position === "SECOND"
                            ? "bg-slate-300/10 text-slate-300"
                            : "bg-[#ea580c]/10 text-[#ea580c]",
                      )}
                    >
                      {winner.position === "FIRST"
                        ? "1st"
                        : winner.position === "SECOND"
                          ? "2nd"
                          : "3rd"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        {winner.name}
                      </span>
                      {winner.eventName && (
                        <span className="text-xs text-muted-foreground">
                          {winner.eventName}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isParticipantView && (
                    <span className="text-base font-bold text-primary tabular-nums tracking-tight">
                      +{winner.points}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.participants?.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              {isParticipantView ? "Event Participation" : "Members"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {data?.participants?.map((p: any, i: number) => (
                <span
                  key={`${p.participantId}-${i}`}
                  className="text-xs font-medium text-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {(true || !isParticipantView) && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">
                Participation Points
              </span>
              <span className="text-base font-bold tabular-nums tracking-tight">
                {data?.participationPoints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">
                Prize Points
              </span>
              <span className="text-base font-bold text-warning tabular-nums tracking-tight">
                +{data?.prizePoints}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <span className="text-sm font-bold text-foreground">
                Total Points
              </span>
              <span className="text-2xl font-bold text-primary tabular-nums tracking-tight">
                {data?.total}
              </span>
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
    return rawData.map((d) => ({
      ...d,
      points: Math.max(0, d.points - (d.participation || 0)),
    }));
  }, [data, excludeParticipation]);

  const participantChartData = useMemo(() => {
    const rawData = getParticipantChartData(data);
    if (!excludeParticipation) return rawData;
    return rawData.map((d) => ({
      ...d,
      points: Math.max(0, d.points - (d.raw.participationPoints || 0)),
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
    <div className="dark">
      <div className="space-y-4 text-foreground">
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

        <div className="relative overflow-hidden pt-2">
          {viewMode === "events" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <EventChart data={eventChartData} onBarClick={handleEventClick} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <ParticipantChart
                data={participantChartData}
                onBarClick={handleEventClick}
                reportData={data}
              />
            </div>
          )}
        </div>

        <DrilldownDrawer
          data={selectedEvent}
          open={drawerOpen}
          onClose={handleCloseDrawer}
          isParticipantView={viewMode === "participants"}
        />
      </div>
    </div>
  );
}
