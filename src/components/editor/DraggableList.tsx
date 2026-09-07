import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EditorLink } from "@/hooks/useEditorState";
import { renderIcon } from "@/components/LinkCard";

interface DraggableListProps {
  items: EditorLink[];
  onReorder: (ids: string[]) => void;
  onEdit: (item: EditorLink) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  showEdit?: boolean;
  showDuplicate?: boolean;
}

interface SortableItemProps {
  item: EditorLink;
  onEdit: (item: EditorLink) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  showEdit?: boolean;
  showDuplicate?: boolean;
}

function SortableItem({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
  showEdit = true,
  showDuplicate = true,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Icon */}
      {renderIcon(item.icon || undefined)}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.url}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Switch
          checked={item.isActive}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
        />
        {showEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {showDuplicate && onDuplicate && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onDuplicate(item.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DraggableList({
  items,
  onReorder,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
  showEdit = true,
  showDuplicate = true,
}: DraggableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems.map((item) => item.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onToggle={onToggle}
              showEdit={showEdit}
              showDuplicate={showDuplicate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
