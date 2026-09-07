import { GripVertical, Pencil, Trash2, Copy, BarChart3 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorLink } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";
import { renderIcon } from "@/components/LinkCard";

interface AdminLinkItemProps {
  link: EditorLink;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function AdminLinkItem({ link, onToggle, onEdit, onDelete, onDuplicate }: AdminLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-card rounded-xl border border-border group",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Link Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {link.icon && (
            <span className="text-muted-foreground shrink-0">{renderIcon(link.icon, "w-5 h-5", link.iconVariant || undefined)}</span>
          )}
          <span className="font-medium truncate">{link.title}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
      </div>

      {/* Stats Placeholder */}
      <div className="hidden sm:flex items-center gap-1 text-muted-foreground text-sm">
        <BarChart3 className="h-4 w-4" />
        <span>—</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Switch
          checked={link.isActive}
          onCheckedChange={(checked) => onToggle(link.id, checked)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(link.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDuplicate(link.id)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={() => onDelete(link.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
