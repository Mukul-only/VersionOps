import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, Trash2, Pencil, PlusCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { collegeService } from "@/api/services";
import { College } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditCollegeDialog from "./EditCollegeDialog";
import AdjustPointsDialog from "./AdjustPointsDialog";
import { Input } from "@/components/ui/input";
import { mapped_toast } from "@/lib/toast_map.ts";

export default function Colleges() {
  const { user } = useAuth();
  const role = user?.role;
  const canEdit = hasPermission(role, PERMISSIONS.COLLEGE_UPDATE);
  const canDelete = hasPermission(role, PERMISSIONS.COLLEGE_DELETE);

  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [adjustingCollege, setAdjustingCollege] = useState<College | null>(null);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    void loadColleges();
  }, [search]);

  const loadColleges = async () => {
    try {
      const response = await collegeService.getAll({ take: 100, includeRelations: true, search });
      setColleges(response.items);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        mapped_toast('You do not have access to colleges data.', 'warning', true)
        return;
      }
      mapped_toast('Failed to load colleges.', 'error')
      console.error("Failed to load colleges", error);
    }
  };

  const openDetails = async (college: College) => {
    try {
      const details = await collegeService.getById(college.id, true);
      setSelectedCollege(details);
      setIsSheetOpen(true);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        mapped_toast('You do not have permission to perform this action.', 'warning')
        return;
      }
      mapped_toast('Failed to load college details.', 'error')
      console.error("Failed to load college details", error);
    }
  };

  const handleEditSuccess = () => {
    setEditingCollege(null);
    void loadColleges();
  };

  const handleAdjustSuccess = () => {
    setAdjustingCollege(null);
    void loadColleges();
  };

  const deleteCollege = async (collegeId: number) => {
    try {
      await collegeService.delete(collegeId);
      mapped_toast('College deleted successfully.', 'success');
      void loadColleges();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        mapped_toast('You do not have permission to perform this action.', 'warning')
        return;
      }
      mapped_toast('Failed to delete college.', 'error')
      console.error("Failed to delete college", error);
    }
  };

  const getScore = (c: College, key: string) => c.score?.[key] || 0;

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedColleges = useMemo(() => {
    if (!sortConfig) return colleges;
    return [...colleges].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortConfig.key) {
        case "code":
          aVal = a.code || "";
          bVal = b.code || "";
          break;
        case "name":
          aVal = a.name || "";
          bVal = b.name || "";
          break;
        case "participants":
          aVal = a.participantCount || 0;
          bVal = b.participantCount || 0;
          break;
        case "firstPrizes":
          aVal = getScore(a, "firstPrizes");
          bVal = getScore(b, "firstPrizes");
          break;
        case "secondPrizes":
          aVal = getScore(a, "secondPrizes");
          bVal = getScore(b, "secondPrizes");
          break;
        case "thirdPrizes":
          aVal = getScore(a, "thirdPrizes");
          bVal = getScore(b, "thirdPrizes");
          break;
        case "totalPoints":
          aVal = getScore(a, "totalPoints");
          bVal = getScore(b, "totalPoints");
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [colleges, sortConfig]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-heading">Colleges</h2>
        <p className="text-body text-muted-foreground">{colleges.length} registered</p>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search for colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="w-full overflow-x-auto pb-8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-transparent border-none shadow-none">
              <TableHead className="w-20 text-table-header">
                <button onClick={() => handleSort("code")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  Code
                  {sortConfig?.key === "code" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="text-table-header">
                <button onClick={() => handleSort("name")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  Name
                  {sortConfig?.key === "name" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="w-32 text-table-header">
                <button onClick={() => handleSort("participants")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  Participants
                  {sortConfig?.key === "participants" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="w-16 text-center text-table-header">
                <button onClick={() => handleSort("firstPrizes")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  1st
                  {sortConfig?.key === "firstPrizes" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="w-16 text-center text-table-header">
                <button onClick={() => handleSort("secondPrizes")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  2nd
                  {sortConfig?.key === "secondPrizes" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="w-16 text-center text-table-header">
                <button onClick={() => handleSort("thirdPrizes")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  3rd
                  {sortConfig?.key === "thirdPrizes" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="w-28 text-table-header">
                <button onClick={() => handleSort("totalPoints")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  Points
                  {sortConfig?.key === "totalPoints" ? (
                    sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="w-40 text-right text-table-header">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedColleges.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-table-cell-sm">{c.code}</TableCell>
                <TableCell className="text-table-cell">{c.name}</TableCell>
                <TableCell className="text-table-cell">{c.participantCount}</TableCell>
                <TableCell className="font-mono text-table-cell text-center font-semibold">{getScore(c, "firstPrizes")}</TableCell>
                <TableCell className="font-mono text-table-cell text-center font-semibold">{getScore(c, "secondPrizes")}</TableCell>
                <TableCell className="font-mono text-table-cell text-center font-semibold">{getScore(c, "thirdPrizes")}</TableCell>
                <TableCell className="font-mono text-table-cell font-semibold">{getScore(c, "totalPoints")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(c)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAdjustingCollege(c)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCollege(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this college?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the "{c.name}" college.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCollege(c.id)}>Yes, delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditCollegeDialog
        college={editingCollege}
        onSuccess={handleEditSuccess}
        onOpenChange={(isOpen) => !isOpen && setEditingCollege(null)}
      />

      <AdjustPointsDialog
        college={adjustingCollege}
        onSuccess={handleAdjustSuccess}
        onOpenChange={(isOpen) => !isOpen && setAdjustingCollege(null)}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {selectedCollege && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCollege.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center divide-x divide-border">
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-xl font-semibold font-mono">{getScore(selectedCollege, "totalPoints")}</p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="text-xl font-semibold font-mono">{selectedCollege.participantCount}</p>
                  </div>
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm text-muted-foreground">Total Prizes</p>
                    <p className="text-xl font-semibold font-mono">
                      {(getScore(selectedCollege, "firstPrizes") || 0) +
                        (getScore(selectedCollege, "secondPrizes") || 0) +
                        (getScore(selectedCollege, "thirdPrizes") || 0)}
                    </p>
                  </div>
                </div>
                <h4 className="text-label mt-4">Participants from {selectedCollege.code}</h4>
                <div className="w-full max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCollege.participants?.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.participantId}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.year}</TableCell>
                        </TableRow>
                      ))}
                      {(!selectedCollege.participants || selectedCollege.participants.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No participants found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
