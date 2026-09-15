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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EditorLink } from "@/hooks/useEditorState";
import { AdminLinkItem } from "./AdminLinkItem";

interface AdminLinksListProps {
  links: EditorLink[];
  /** Id of the link to briefly ring/scroll to (e.g. just clicked in the live preview panel). */
  highlightedId?: string | null;
  onReorder: (newOrder: string[]) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onUpdate: (id: string, updates: Partial<EditorLink>) => void;
  onSaveNow: () => void;
  onEditCards: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function AdminLinksList({
  links,
  highlightedId,
  onReorder,
  onToggle,
  onUpdate,
  onSaveNow,
  onEditCards,
  onDelete,
  onDuplicate,
}: AdminLinksListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((item) => item.id === active.id);
      const newIndex = links.findIndex((item) => item.id === over.id);

      const newOrder = [...links];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      onReorder(newOrder.map((item) => item.id));
    }
  };

  const sortedLinks = [...links].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedLinks.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {sortedLinks.map((link) => (
            <AdminLinkItem
              key={link.id}
              link={link}
              highlighted={link.id === highlightedId}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onSaveNow={onSaveNow}
              onEditCards={onEditCards}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
