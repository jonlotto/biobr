import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { IconVariant } from "@/lib/linkIcons";
import { IconPickerGrid } from "./IconPickerGrid";

interface IconLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string, variant: IconVariant) => void;
}

// "Biblioteca de Ícones" - opened from the link editor's icon field
// (ButtonEditDrawer, CardsInfoEditor). The actual search/variant-tabs/grid
// machinery lives in IconPickerGrid, shared with LinkMediaPicker's merged
// icon-or-image panel.
export function IconLibraryModal({ open, onClose, onSelect }: IconLibraryModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center space-y-0 border-b border-border px-5 py-4 pr-10">
          <DialogTitle>Biblioteca de Ícones</DialogTitle>
        </DialogHeader>

        <IconPickerGrid onSelect={onSelect} />
      </DialogContent>
    </Dialog>
  );
}
