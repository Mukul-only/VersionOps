import { CollegeReport } from "@/api/types";

export const getScoreStats = (data: CollegeReport) => ({
  participationPoints: data.scoreBreakdown.participationPoints,
  prizePoints: data.scoreBreakdown.prizePoints,
  adjustmentPoints: data.scoreBreakdown.adjustmentPoints,
  total: data.scoreBreakdown.total,
});

export const getTopPerformer = (data: CollegeReport) => data.insights.topPerformer || null;

export const getBestEvent = (data: CollegeReport) => {
  if (!data.eventBreakdown || data.eventBreakdown.length === 0) return null;
  return [...data.eventBreakdown].sort((a, b) => (b.prizePoints || 0) - (a.prizePoints || 0))[0];
};

export const getWorstEvent = (data: CollegeReport) => data.insights.worstEvent || null;

export const getTotalWins = (data: CollegeReport) => data.insights.totalWins;

export const getEventChartData = (data: CollegeReport) =>
  data.eventBreakdown.map((event) => ({
    name: event.eventName,
    points: event.total,
    participation: event.participationPoints,
    prize: event.prizePoints,
    raw: event,
  }));

export const getParticipantChartData = (data: CollegeReport) =>
  data.participantBreakdown.map((p) => ({
    id: p.id,
    name: p.name,
    points: p.total,
    raw: p,
  }));
