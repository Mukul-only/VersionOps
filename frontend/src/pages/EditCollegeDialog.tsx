import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { College } from "@/api/types";
import AddCollege from "./AddCollege";

interface EditCollegeDialogProps {
  college: College | null;
  onSuccess: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export default function EditCollegeDialog({ college, onSuccess, onOpenChange }: EditCollegeDialogProps) {
  return (
    <Dialog open={!!college} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit College</DialogTitle>
        </DialogHeader>
        {college && <AddCollege college={college} onSuccess={onSuccess} />}
      </DialogContent>
    </Dialog>
  );
}
