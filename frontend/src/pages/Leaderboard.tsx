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

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardService.get({
        take: 100,
        includeRelations: true,
        suppressErrorToast: true,
        suppressRedirect: true,
        suppressForbiddenRedirect: true,
      });
      setLeaderboard(response.items);
    } catch (error: unknown) {
      if ((error as any)?.message === "Unauthorized" || (error as any)?.message === "Forbidden") {
        mapped_toast("you do have access to leaderboard", "warning", true);
      } else {
        mapped_toast("Failed to load leaderboard", "error");
        console.error("Failed to load leaderboard", error);
      }
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      await leaderboardService.recalculate();
      mapped_toast("Leaderboard recalculated", "success");
      await loadLeaderboard();
    } catch (error: unknown) {
      mapped_toast("Failed to recalculate leaderboard", "error");
      console.error("Failed to recalculate leaderboard", error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading">Leaderboard</h2>
          <p className="text-body text-muted-foreground mt-1">{leaderboard.length} colleges ranked</p>
        </div>
        <Button variant="outline" onClick={recalculate} disabled={recalculating}>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((entry, i) => (
            <div key={entry.collegeId} className={cn("rounded-lg p-4 flex flex-col gap-2", MEDAL[i].bg)}>
              <div className="flex items-center justify-between">
                <span className={cn("font-semibold", MEDAL[i].text)}>
                  {i === 0 ? "1st" : i === 1 ? "2nd" : "3rd"}
                </span>
                <span className={cn("font-mono text-metric font-bold", MEDAL[i].text)}>{entry.totalPoints}</span>
              </div>
              <div>
                <p className="text-table-cell font-medium">{entry.college?.name}</p>
                <p className="text-table-cell-sm">{entry.college?.code}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="w-full overflow-x-auto pb-8">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-table-header">Rank</TableHead>
                <TableHead className="text-table-header">College</TableHead>
                <TableHead className="text-table-header text-right">Points</TableHead>
                <TableHead className="text-table-header text-center">1st</TableHead>
                <TableHead className="text-table-header text-center">2nd</TableHead>
                <TableHead className="text-table-header text-center">3rd</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filtered.slice(search ? undefined : 3).map((entry, i) => (
              <TableRow key={entry.collegeId}>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded text-sm font-medium",
                    entry.totalPoints > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground border"
                  )}>
                    {filtered.indexOf(entry) + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="text-table-cell font-medium">{entry.college?.name}</p>
                  <p className="text-table-cell-sm">{entry.college?.code}</p>
                </TableCell>
                <TableCell className="font-mono text-table-cell text-right">{entry.totalPoints}</TableCell>
                <TableCell className="font-mono text-table-cell text-center">{entry.firstPrizes}</TableCell>
                <TableCell className="font-mono text-table-cell text-center">{entry.secondPrizes}</TableCell>
                <TableCell className="font-mono text-table-cell text-center">{entry.thirdPrizes}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {search ? "No colleges match your search" : "No colleges yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
