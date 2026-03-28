import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Trophy, Medal } from "lucide-react";
import { leaderboardService } from "@/api/services";
import { LeaderboardEntry } from "@/api/types";
import { cn } from "@/lib/utils";
import { mapped_toast } from "@/lib/toast_map.ts";

const MEDAL = [
  { icon: <Trophy className="h-4 w-4 text-yellow-400" />, bg: "bg-yellow-400/10 border border-yellow-400/20", text: "text-yellow-400" },
  { icon: <Medal className="h-4 w-4 text-zinc-300" />,   bg: "bg-zinc-300/10 border border-zinc-300/20",   text: "text-zinc-300"   },
  { icon: <Medal className="h-4 w-4 text-amber-600" />,  bg: "bg-amber-600/10 border border-amber-600/20",  text: "text-amber-600"  },
];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => { void loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardService.get({
        take: 100, includeRelations: true,
        suppressErrorToast: true, suppressRedirect: true, suppressForbiddenRedirect: true,
      });
      setLeaderboard(response.items);
    } catch (error: any) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        mapped_toast("you do have access to leaderboard", "warning", true);
      } else {
        mapped_toast("Failed to load leaderboard", "error");
      }
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      await leaderboardService.recalculate();
      mapped_toast("Leaderboard recalculated", "success");
      await loadLeaderboard();
    } catch {
      mapped_toast("Failed to recalculate leaderboard", "error");
    } finally {
      setRecalculating(false);
    }
  };

  const filtered = leaderboard.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return entry.college?.name.toLowerCase().includes(q) || entry.college?.code.toLowerCase().includes(q);
  });

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leaderboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{leaderboard.length} colleges ranked</p>
        </div>
        <Button variant="outline" onClick={recalculate} disabled={recalculating} className="mr-12">
          <RefreshCw className={cn("mr-2 h-4 w-4", recalculating && "animate-spin")} />
          Recalculate
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter colleges..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Top 3 podium cards */}
      {!search && top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map((entry, i) => (
            <div key={entry.collegeId} className={cn("rounded-xl p-4 flex flex-col gap-2", MEDAL[i].bg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {MEDAL[i].icon}
                  <span className={cn("text-xs font-bold uppercase tracking-widest", MEDAL[i].text)}>
                    {i === 0 ? "1st" : i === 1 ? "2nd" : "3rd"}
                  </span>
                </div>
                <span className={cn("text-2xl font-bold font-mono", MEDAL[i].text)}>{entry.totalPoints}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight">{entry.college?.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{entry.college?.code}</p>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                <span>🥇 {entry.firstPrizes}</span>
                <span>🥈 {entry.secondPrizes}</span>
                <span>🥉 {entry.thirdPrizes}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="w-full overflow-x-auto pb-8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-transparent border-none shadow-none">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>College</TableHead>
              <TableHead className="w-28 text-right">Total Points</TableHead>
              <TableHead className="w-20 text-center">🥇</TableHead>
              <TableHead className="w-20 text-center">🥈</TableHead>
              <TableHead className="w-20 text-center">🥉</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry, i) => (
              <TableRow key={entry.collegeId} className={cn(i < 3 && !search && "opacity-50 text-xs")}>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold",
                    i === 0 ? "bg-yellow-400/20 text-yellow-400"
                    : i === 1 ? "bg-zinc-300/20 text-zinc-300"
                    : i === 2 ? "bg-amber-600/20 text-amber-600"
                    : "text-muted-foreground border"
                  )}>
                    {i + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{entry.college?.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{entry.college?.code}</p>
                </TableCell>
                <TableCell className="font-mono font-semibold text-right">{entry.totalPoints}</TableCell>
                <TableCell className="font-mono text-center text-foreground/80">{entry.firstPrizes}</TableCell>
                <TableCell className="font-mono text-center text-foreground/80">{entry.secondPrizes}</TableCell>
                <TableCell className="font-mono text-center text-foreground/80">{entry.thirdPrizes}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">No colleges found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
