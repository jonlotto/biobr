import { useEffect, useRef, useState } from "react";
import { GripVertical, Trash2, Copy, Pencil, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorLink } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";
import { renderIcon } from "@/components/LinkCard";
import { getLinkIconComponent, WHATSAPP_DEFAULT_ICON_VALUE } from "@/lib/linkIcons";
import { DEFAULT_WHATSAPP_COUNTRY_CODE, WHATSAPP_COUNTRY_CODES, buildWhatsappUrl, maskWhatsappPhone } from "@/lib/whatsapp";
import { LinkMediaPicker } from "./LinkMediaPicker";

interface AdminLinkItemProps {
  link: EditorLink;
  /** Briefly true right after this link is clicked in the live preview panel - scrolls into view and rings the card. */
  highlighted?: boolean;
  /** Whether this "button" card is showing its full edit fields below the summary row - only one card in the list is expanded at a time (see AdminLayout's expandedId). Ignored for "cards" blocks, which always open CardsInfoEditor instead. */
  expanded?: boolean;
  /** Toggles `expanded` for this card - wired to its pencil icon. */
  onToggleExpand: (id: string) => void;
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

export function AdminLinkItem({ link, highlighted, expanded, onToggleExpand, onToggle, onUpdate, onSaveNow, onEditCards, onDelete, onDuplicate }: AdminLinkItemProps) {
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

  // Collapsed-row subtitle: the WhatsApp number (formatted, with its country
  // code) or the plain url - whichever field this card is actually pointed
  // at right now.
  const collapsedSubtitle = isWhatsapp
    ? link.whatsappPhone
      ? `+${countryCode} ${maskWhatsappPhone(link.whatsappPhone)}`
      : "Sem número"
    : link.url || "Sem URL";

  return (
    <div
      ref={setRefs}
      style={sortableStyle}
      className={cn(
        "rounded-xl border border-dashed border-border bg-card p-3 group",
        isDragging && "opacity-50 shadow-lg",
        highlighted && "ring-2 ring-primary",
      )}
    >
      {/* Summary row - always visible; the fields below only show up while expanded */}
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="-m-2 shrink-0 cursor-grab p-2 text-muted-foreground transition-colors active:cursor-grabbing hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {link.thumbnailUrl ? (
            <img src={link.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : link.icon ? (
            renderIcon(link.icon, "h-4 w-4", link.iconVariant || undefined)
          ) : null}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{link.title || "Sem nome"}</p>
          <p className="truncate text-xs text-muted-foreground">{collapsedSubtitle}</p>
        </div>

        <Switch checked={link.isActive} onCheckedChange={(checked) => onToggle(link.id, checked)} />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100",
            expanded && "text-primary opacity-100",
          )}
          onClick={() => onToggleExpand(link.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" onClick={() => onDuplicate(link.id)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 text-destructive hover:text-destructive"
          onClick={() => onDelete(link.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit fields - only rendered while expanded */}
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-dashed border-border pt-3">
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
            <div className="space-y-2">
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
              </div>

              <Input
                value={messageDraft}
                onChange={(e) => {
                  setMessageDraft(e.target.value);
                  onUpdate(link.id, { whatsappMessage: e.target.value, url: buildWhatsappUrl(countryCode, phoneDraft, e.target.value) });
                }}
                onBlur={onSaveNow}
                placeholder="Olá! Vi sua bio..."
                className="h-9 text-sm"
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

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
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
      )}
    </div>
  );
}
