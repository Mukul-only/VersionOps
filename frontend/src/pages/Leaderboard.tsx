import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { leaderboardService } from "@/api/services";
import { LeaderboardEntry } from "@/api/types";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">College rankings</p>
        </div>
        <Button variant="outline" onClick={recalculate}>
          <RefreshCw className="mr-2 h-4 w-4" /> Recalculate
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>College</TableHead>
              <TableHead className="w-28">Total Points</TableHead>
              <TableHead className="w-20">🥇</TableHead>
              <TableHead className="w-20">🥈</TableHead>
              <TableHead className="w-20">🥉</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry, i) => (
              <TableRow
                key={entry.collegeId}
                className={
                  i === 0
                    ? "bg-yellow-500/5"
                    : i === 1
                    ? "bg-slate-500/5"
                    : i === 2
                    ? "bg-orange-500/5"
                    : ""
                }
              >
                <TableCell>
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-600"
                        : i === 1
                        ? "bg-slate-500/20 text-slate-600"
                        : i === 2
                        ? "bg-orange-500/20 text-orange-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{entry.college?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.college?.code}</p>
                  </div>
                </TableCell>
                <TableCell className="font-mono font-bold text-lg">{entry.totalPoints}</TableCell>
                <TableCell className="font-mono">{entry.firstPrizes}</TableCell>
                <TableCell className="font-mono">{entry.secondPrizes}</TableCell>
                <TableCell className="font-mono">{entry.thirdPrizes}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
