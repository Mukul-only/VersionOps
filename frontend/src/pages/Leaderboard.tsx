import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { leaderboardService } from "@/api/services";
import { LeaderboardEntry } from "@/api/types";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardService.get({ take: 100, includeRelations: true });
      setLeaderboard(response.items);
    } catch (error) {
      toast.error("Failed to load leaderboard");
    }
  };

  const recalculate = async () => {
    try {
      await leaderboardService.recalculate();
      toast.success("Leaderboard recalculated!");
      loadLeaderboard();
    } catch (error) {
      toast.error("Failed to recalculate leaderboard");
    }
  };

  const filtered = leaderboard.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.college?.name.toLowerCase().includes(q) ||
      entry.college?.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#6A0DAD] to-[#1E90FF] bg-clip-text text-transparent">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">College rankings and performance</p>
        </div>
        <Button 
          variant="outline" 
          onClick={recalculate}
          className="mr-12 border-[#6A0DAD] text-[#6A0DAD] hover:bg-[#6A0DAD] hover:text-white transition-all duration-300"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Recalculate
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1E90FF]" />
        <Input
          placeholder="Filter colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-[#1E90FF]/30 focus-visible:ring-[#1E90FF]"
        />
      </div>

      <div className="border border-[#1E90FF]/20 rounded-xl overflow-hidden shadow-lg shadow-purple-500/5 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#6A0DAD]/5 hover:bg-[#6A0DAD]/10 transition-colors">
              <TableHead className="w-16 font-bold text-[#6A0DAD]">Rank</TableHead>
              <TableHead className="font-bold text-[#6A0DAD]">College</TableHead>
              <TableHead className="w-32 font-bold text-[#6A0DAD]">Total Points</TableHead>
              <TableHead className="w-20 text-center">🥇</TableHead>
              <TableHead className="w-20 text-center">🥈</TableHead>
              <TableHead className="w-20 text-center">🥉</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry, i) => (
              <TableRow
                key={entry.collegeId}
                className={cn(
                  "transition-all duration-200 hover:bg-[#1E90FF]/5 group",
                  i === 0
                    ? "bg-yellow-500/5"
                    : i === 1
                    ? "bg-slate-500/5"
                    : i === 2
                    ? "bg-orange-500/5"
                    : ""
                )}
              >
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shadow-sm transition-transform group-hover:scale-110",
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30"
                        : i === 1
                        ? "bg-slate-500/20 text-slate-600 border border-slate-500/30"
                        : i === 2
                        ? "bg-orange-500/20 text-orange-600 border border-orange-500/30"
                        : "bg-[#6A0DAD]/10 text-[#6A0DAD] border border-[#6A0DAD]/20"
                    )}
                  >
                    {i + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-[#6A0DAD] transition-colors">{entry.college?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.college?.code}</p>
                  </div>
                </TableCell>
                <TableCell className="font-mono font-bold text-xl text-[#1E90FF]">{entry.totalPoints}</TableCell>
                <TableCell className="font-mono text-center text-foreground/80">{entry.firstPrizes}</TableCell>
                <TableCell className="font-mono text-center text-foreground/80">{entry.secondPrizes}</TableCell>
                <TableCell className="font-mono text-center text-foreground/80">{entry.thirdPrizes}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No colleges found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
