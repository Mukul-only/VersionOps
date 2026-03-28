import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, Trash2, Pencil, PlusCircle } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Colleges</h2>
        <p className="text-sm text-muted-foreground">{colleges.length} registered</p>
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
              <TableHead className="w-20">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">Participants</TableHead>
              <TableHead className="w-16 text-center">🥇</TableHead>
              <TableHead className="w-16 text-center">🥈</TableHead>
              <TableHead className="w-16 text-center">🥉</TableHead>
              <TableHead className="w-28">Points</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colleges.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-medium">{c.code}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.participantCount}</TableCell>
                <TableCell className="font-mono font-semibold text-center">{getScore(c, "firstPrizes")}</TableCell>
                <TableCell className="font-mono font-semibold text-center">{getScore(c, "secondPrizes")}</TableCell>
                <TableCell className="font-mono font-semibold text-center">{getScore(c, "thirdPrizes")}</TableCell>
                <TableCell className="font-mono font-semibold">{getScore(c, "totalPoints")}</TableCell>
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
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="stat-card text-center">
                    <p className="text-muted-foreground text-xs">Points</p>
                    <p className="text-xl font-bold">{getScore(selectedCollege, "totalPoints")}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-muted-foreground text-xs">Participants</p>
                    <p className="text-xl font-bold">{selectedCollege.participantCount}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-muted-foreground text-xs">Prizes</p>
                    <p className="text-xl font-bold">
                      {(getScore(selectedCollege, "firstPrizes") || 0) +
                        (getScore(selectedCollege, "secondPrizes") || 0) +
                        (getScore(selectedCollege, "thirdPrizes") || 0)}
                    </p>
                  </div>
                </div>
                <h4 className="font-semibold text-sm mt-4">Participants from {selectedCollege.code}</h4>
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
