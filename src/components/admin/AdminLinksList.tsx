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
import { useEffect, useRef } from "react";
import { EditorLink } from "@/hooks/useEditorState";
import { AdminLinkItem } from "./AdminLinkItem";

interface AdminLinksListProps {
  links: EditorLink[];
  /** Id of the link to briefly ring/scroll to (e.g. just clicked in the live preview panel). */
  highlightedId?: string | null;
  /** Id of the single "button" card currently showing its full edit fields - every other one stays collapsed. */
  expandedId?: string | null;
  /** Id of a just-created card whose main field should grab focus once expanded - see AdminLinkItem's autoFocusField. */
  autoFocusId?: string | null;
  /** Called once that card has focused its field, so the parent can clear autoFocusId. */
  onAutoFocused?: () => void;
  onToggleExpand: (id: string) => void;
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
  expandedId,
  autoFocusId,
  onAutoFocused,
  onToggleExpand,
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

  // Stable React keys across autosave's temp -> real id swap: a new link keeps
  // its order through that swap, so a real id showing up where a temp one
  // just vanished inherits its key. Without this the row remounts mid-edit,
  // dropping focus from whatever field the user is typing in.
  const keysRef = useRef(new Map<string, { key: string; order: number }>());
  const keyFor = (link: EditorLink) => {
    const known = keysRef.current.get(link.id);
    if (known) return known.key;
    let key = link.id;
    for (const [id, entry] of keysRef.current) {
      if (id.startsWith("temp-") && entry.order === link.order && !links.some((l) => l.id === id)) {
        key = entry.key;
        keysRef.current.delete(id);
        break;
      }
    }
    keysRef.current.set(link.id, { key, order: link.order });
    return key;
  };
  // After each render (any swap has already been inherited by keyFor above):
  // keep every entry's order current for reorders, drop ids that are gone.
  useEffect(() => {
    const map = keysRef.current;
    for (const link of links) {
      const entry = map.get(link.id);
      if (entry) entry.order = link.order;
    }
    for (const id of [...map.keys()]) {
      if (!links.some((l) => l.id === id)) map.delete(id);
    }
  });

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
              key={keyFor(link)}
              link={link}
              highlighted={link.id === highlightedId}
              expanded={link.id === expandedId}
              autoFocusField={link.id === autoFocusId}
              onAutoFocused={onAutoFocused}
              onToggleExpand={onToggleExpand}
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
