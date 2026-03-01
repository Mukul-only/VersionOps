import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { College } from "@/api/types";
import { leaderboardService } from "@/api/services";
import { useState } from "react";
import { toast } from "sonner";

interface AdjustPointsDialogProps {
  college: College | null;
  onSuccess: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export default function AdjustPointsDialog({ college, onSuccess, onOpenChange }: AdjustPointsDialogProps) {
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!college) return;
    try {
      await leaderboardService.adjust(college.id, points, reason);
      toast.success("Points adjusted successfully!");
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to adjust points");
      }
    }
  };

  return (
    <Dialog open={!!college} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Points for {college?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value, 10))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
