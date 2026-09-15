import { useEffect, useRef, useState } from "react";
import { GripVertical, Trash2, Copy, Pencil, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorLink } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";
import { getLinkIconComponent, WHATSAPP_DEFAULT_ICON_VALUE } from "@/lib/linkIcons";
import { DEFAULT_WHATSAPP_COUNTRY_CODE, WHATSAPP_COUNTRY_CODES, buildWhatsappUrl, maskWhatsappPhone } from "@/lib/whatsapp";
import { LinkMediaPicker } from "./LinkMediaPicker";

interface AdminLinkItemProps {
  link: EditorLink;
  /** Briefly true right after this link is clicked in the live preview panel - scrolls into view and rings the card. */
  highlighted?: boolean;
  onToggle: (id: string, isActive: boolean) => void;
  /** Applies an inline field edit - "cards" blocks don't use this (see onEditCards). */
  onUpdate: (id: string, updates: Partial<EditorLink>) => void;
  /** Flushes a pending debounced save immediately - called on field blur so a save isn't left dangling on an 800ms timer. */
  onSaveNow: () => void;
  /** Opens the CardsInfoEditor dialog - only relevant for linkType "cards". */
  onEditCards: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const TYPE_OPTIONS: { value: "link" | "whatsapp"; label: string; iconValue: string }[] = [
  { value: "link", label: "Link", iconValue: "link-icon" },
  { value: "whatsapp", label: "WhatsApp", iconValue: WHATSAPP_DEFAULT_ICON_VALUE },
];

export function AdminLinkItem({ link, highlighted, onToggle, onUpdate, onSaveNow, onEditCards, onDelete, onDuplicate }: AdminLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Local drafts so typing feels instant and never fights the parent's
  // re-render - each keystroke still calls onUpdate (which drives the
  // existing autosave debounce), this just avoids bouncing the input's own
  // value off the round-trip through parent state. Reset automatically
  // whenever this row starts rendering a different link, because
  // AdminLinksList keys each row by `link.id` (a temp id swapped for the
  // real one after insert remounts this component with fresh props, not a
  // stale draft).
  const [title, setTitle] = useState(link.title);
  const [urlDraft, setUrlDraft] = useState(link.url);
  const [phoneDraft, setPhoneDraft] = useState(link.whatsappPhone || "");
  const [messageDraft, setMessageDraft] = useState(link.whatsappMessage || "");

  // Scroll this card into view when it's briefly highlighted (e.g. clicked
  // in the live preview panel) - setNodeRef (dnd-kit) already claims the
  // root div's `ref`, so this mirrors the node into a second ref instead of
  // fighting over the single slot. Declared unconditionally (even though
  // only the non-"cards" branch below actually uses it) to keep every hook
  // call above any early return.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    rootRef.current = node;
  };
  useEffect(() => {
    if (highlighted) {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  if (link.linkType === "cards") {
    return (
      <div
        ref={setNodeRef}
        style={sortableStyle}
        className={cn(
          "flex items-center gap-3 p-4 bg-card rounded-xl border border-border group",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="-m-3 shrink-0 cursor-grab p-3 text-muted-foreground transition-colors active:cursor-grabbing hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pro/15 text-pro">
              <LayoutGrid className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium truncate">{link.title}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {link.cardsData?.length || 0} card{link.cardsData?.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={link.isActive} onCheckedChange={(checked) => onToggle(link.id, checked)} />
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => onEditCards(link.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => onDuplicate(link.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={() => onDelete(link.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const isWhatsapp = link.buttonKind === "whatsapp";
  const urlInvalid = !isWhatsapp && !urlDraft.trim();
  const countryCode = link.whatsappCountryCode || DEFAULT_WHATSAPP_COUNTRY_CODE;

  const handleKindChange = (newKind: "link" | "whatsapp") => {
    if (newKind === link.buttonKind) return;
    if (newKind === "whatsapp") {
      const updates: Partial<EditorLink> = {
        buttonKind: "whatsapp",
        whatsappCountryCode: countryCode,
        url: buildWhatsappUrl(countryCode, phoneDraft, messageDraft),
      };
      // Auto-set the WhatsApp icon on switch, same as the old edit drawer did
      // - only when no custom icon/image was already chosen.
      if (!link.icon && !link.thumbnailUrl) {
        updates.icon = WHATSAPP_DEFAULT_ICON_VALUE;
        updates.iconVariant = "brand";
      }
      onUpdate(link.id, updates);
    } else {
      onUpdate(link.id, { buttonKind: "link", url: urlDraft });
    }
    onSaveNow();
  };

  const CurrentTypeIcon = getLinkIconComponent(isWhatsapp ? WHATSAPP_DEFAULT_ICON_VALUE : "link-icon");

  return (
    <div
      ref={setRefs}
      style={sortableStyle}
      className={cn(
        "flex items-start gap-2 rounded-xl border border-dashed border-border bg-card p-3",
        isDragging && "opacity-50 shadow-lg",
        highlighted && "ring-2 ring-primary",
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="-m-2 mt-1 shrink-0 cursor-grab self-start p-2 text-muted-foreground transition-colors active:cursor-grabbing hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Fields */}
      <div className="min-w-0 flex-1 space-y-2">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onUpdate(link.id, { title: e.target.value });
          }}
          onBlur={onSaveNow}
          placeholder="Nome fácil"
          className="h-9 text-sm font-medium"
        />

        {isWhatsapp ? (
          <div className="flex gap-2">
            <Select
              value={countryCode}
              onValueChange={(code) => {
                onUpdate(link.id, { whatsappCountryCode: code, url: buildWhatsappUrl(code, phoneDraft, messageDraft) });
                onSaveNow();
              }}
            >
              <SelectTrigger className="h-9 w-[92px] shrink-0 px-2 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WHATSAPP_COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} +{c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="tel"
              value={maskWhatsappPhone(phoneDraft)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhoneDraft(digits);
                onUpdate(link.id, { whatsappPhone: digits, url: buildWhatsappUrl(countryCode, digits, messageDraft) });
              }}
              onBlur={onSaveNow}
              placeholder="(11) 99999-9999"
              className="h-9 min-w-0 flex-1 text-sm"
            />

            <Input
              value={messageDraft}
              onChange={(e) => {
                setMessageDraft(e.target.value);
                onUpdate(link.id, { whatsappMessage: e.target.value, url: buildWhatsappUrl(countryCode, phoneDraft, e.target.value) });
              }}
              onBlur={onSaveNow}
              placeholder="Olá! Vi sua bio..."
              className="h-9 min-w-0 flex-[1.4] text-sm"
            />
          </div>
        ) : (
          <div>
            <Input
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                onUpdate(link.id, { url: e.target.value });
              }}
              onBlur={() => {
                const trimmed = urlDraft.trim();
                // Bare domains ("seu-site.com/pagina") are valid input here -
                // normalize to a real https:// link on blur so the public
                // page's plain `href={link.url}` still works.
                if (trimmed && !/^https?:\/\//i.test(trimmed)) {
                  const normalized = `https://${trimmed}`;
                  setUrlDraft(normalized);
                  onUpdate(link.id, { url: normalized });
                }
                onSaveNow();
              }}
              placeholder="seu-site.com/pagina"
              className={cn("h-9 text-sm", urlInvalid && "border-destructive focus-visible:ring-destructive")}
            />
            {urlInvalid && <p className="mt-1 text-xs text-destructive">Adicione uma URL</p>}
          </div>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <Select value={link.buttonKind} onValueChange={(v) => handleKindChange(v as "link" | "whatsapp")}>
            <SelectTrigger className="h-9 w-auto min-w-[128px] gap-2 text-sm">
              <SelectValue>
                <span className="flex items-center gap-2">
                  {CurrentTypeIcon && <CurrentTypeIcon className="h-4 w-4" variant="brand" />}
                  {isWhatsapp ? "WhatsApp" : "Link"}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => {
                const OptIcon = getLinkIconComponent(opt.iconValue);
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      {OptIcon && <OptIcon className="h-4 w-4" variant="brand" />}
                      {opt.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <LinkMediaPicker
            icon={link.icon}
            iconVariant={link.iconVariant}
            thumbnailUrl={link.thumbnailUrl}
            onChange={(updates) => {
              onUpdate(link.id, updates);
              onSaveNow();
            }}
          />
        </div>
      </div>

      {/* Status + visibility + delete */}
      <div className="flex shrink-0 items-center gap-2.5 self-start pt-2">
        <span className={cn("text-xs font-medium whitespace-nowrap", link.isActive ? "text-success" : "text-muted-foreground")}>
          {link.isActive ? "Publicado" : "Não publicado"}
        </span>
        <button
          type="button"
          onClick={() => onToggle(link.id, !link.isActive)}
          className="text-muted-foreground transition-colors hover:text-foreground"
          title={link.isActive ? "Tornar não publicado" : "Publicar"}
        >
          {link.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(link.id)}
          className="text-muted-foreground transition-colors hover:text-destructive"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
