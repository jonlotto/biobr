import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardItem } from "@/hooks/useEditorState";
import { getLinkIconComponent } from "@/lib/linkIcons";
import { IconLibraryModal } from "@/components/editor/IconLibraryModal";
import { ColorRow } from "@/components/design/ColorPickerPopover";
import { cn } from "@/lib/utils";

interface CardsInfoEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (cardsData: CardItem[]) => void;
  initialCards?: CardItem[] | null;
}

const DEFAULT_CARD_BG = "#EEF2FF";
const DEFAULT_CARD_ICON = "star-icon";

function makeEmptyCard(): CardItem {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    icon: DEFAULT_CARD_ICON,
    title: "",
    subtitle: null,
    bgColor: null,
    textColor: null,
  };
}

// Cards saved before title/subtitle were split only have the old `text`
// field - carry it over as the title so existing cards keep editing cleanly.
function normalizeCard(card: CardItem): CardItem {
  const legacyText = (card as unknown as { text?: string }).text;
  return {
    id: card.id,
    icon: card.icon,
    title: card.title ?? legacyText ?? "",
    subtitle: card.subtitle ?? null,
    bgColor: card.bgColor ?? null,
    textColor: card.textColor ?? null,
  };
}

function isLightHex(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function SortableCardRow({
  card,
  onChange,
  onRemove,
  canRemove,
  onPickIcon,
}: {
  card: CardItem;
  onChange: (next: CardItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  onPickIcon: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = getLinkIconComponent(card.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("space-y-2 rounded-xl border border-border bg-card p-3", isDragging && "opacity-50 shadow-lg")}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onPickIcon}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"
        >
          {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs text-muted-foreground">?</span>}
        </button>
        <Input
          value={card.title}
          onChange={(e) => onChange({ ...card, title: e.target.value })}
          placeholder="Ex: Frete grátis acima de R$150"
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 pl-8">
        <Input
          value={card.subtitle || ""}
          onChange={(e) => onChange({ ...card, subtitle: e.target.value || null })}
          placeholder="Subtítulo (opcional)"
        />
        <ColorRow
          label="Cor de fundo (opcional)"
          value={card.bgColor}
          defaultValue={DEFAULT_CARD_BG}
          onChange={(value) => onChange({ ...card, bgColor: value })}
        />
        <ColorRow
          label="Cor do texto (opcional)"
          value={card.textColor}
          defaultValue={isLightHex(card.bgColor || DEFAULT_CARD_BG) ? "#111827" : "#FFFFFF"}
          onChange={(value) => onChange({ ...card, textColor: value })}
        />
      </div>
    </div>
  );
}

// Editor for one "cards informativos" block - a set of small info tiles
// (icon + text + optional color) that reorder/add/remove within this dialog,
// then get saved as the link row's single `cardsData` field (see
// CardsCarousel for how they render on the public page).
export function CardsInfoEditor({ open, onClose, onSave, initialCards }: CardsInfoEditorProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [iconTargetId, setIconTargetId] = useState<string | null>(null);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;
    setCards(initialCards && initialCards.length > 0 ? initialCards.map(normalizeCard) : [makeEmptyCard()]);
    setError(null);
  }, [open, initialCards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCards((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const updateCard = (id: string, next: CardItem) => {
    setCards((prev) => prev.map((c) => (c.id === id ? next : c)));
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const addCard = () => {
    setCards((prev) => [...prev, makeEmptyCard()]);
  };

  const handleSave = () => {
    const cleaned = cards
      .map((c) => ({ ...c, title: c.title.trim(), subtitle: c.subtitle?.trim() ? c.subtitle.trim() : null }))
      .filter((c) => c.title.length > 0);
    if (cleaned.length === 0) {
      setError("Adicione pelo menos um card com título.");
      return;
    }
    onSave(cleaned);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cards informativos</DialogTitle>
            <DialogDescription>Avisos curtos que aparecem em um carrossel na sua página - frete grátis, atacado, etc.</DialogDescription>
          </DialogHeader>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {cards.map((card) => (
                  <SortableCardRow
                    key={card.id}
                    card={card}
                    onChange={(next) => updateCard(card.id, next)}
                    onRemove={() => removeCard(card.id)}
                    canRemove={cards.length > 1}
                    onPickIcon={() => setIconTargetId(card.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="button" variant="outline" onClick={addCard} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar card
          </Button>

          <DialogFooter>
            <Button onClick={handleSave}>Salvar</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IconLibraryModal
        open={iconTargetId !== null}
        onClose={() => setIconTargetId(null)}
        onSelect={(value) => {
          if (iconTargetId) {
            setCards((prev) => prev.map((c) => (c.id === iconTargetId ? { ...c, icon: value } : c)));
          }
          setIconTargetId(null);
        }}
      />
    </>
  );
}
