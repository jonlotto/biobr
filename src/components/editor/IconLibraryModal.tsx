import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { GENERIC_ICONS, SOCIAL_ICONS, type IconVariant, type LinkIconEntry } from "@/lib/linkIcons";

interface IconLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string, variant: IconVariant) => void;
}

const VARIANT_TABS: { value: IconVariant; label: string }[] = [
  { value: "brand", label: "Colorido" },
  { value: "dark", label: "Escuro" },
  { value: "light", label: "Claro" },
];

// Shown by default in the "Social" grid, before "Todos" is tapped - the
// handful people actually look for, so the grid fits on a phone screen
// without needing to scroll (see IconLibraryModal).
const PRIMARY_SOCIAL_VALUES = [
  "si-whatsapp",
  "si-instagram",
  "si-facebook",
  "si-tiktok",
  "si-youtube",
  "si-x",
  "si-telegram",
  "linkedin-icon",
];

function matchesQuery(entry: LinkIconEntry, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return entry.label.toLowerCase().includes(q) || (entry.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false);
}

function IconGrid({
  title,
  entries,
  variant,
  onSelect,
  trailingAction,
}: {
  title: string;
  entries: LinkIconEntry[];
  variant: IconVariant;
  onSelect: (value: string) => void;
  // An extra "+" tile appended after the icons - used by the Social grid to
  // reveal the full list on demand instead of always rendering everything.
  trailingAction?: { label: string; onClick: () => void };
}) {
  if (entries.length === 0 && !trailingAction) return null;
  // "light" variant icons render white, shown against a dark backdrop (see
  // the ScrollArea wrapper below) - labels need to flip to light text there
  // too, or they'd be unreadable against that same dark backdrop.
  const onDarkBackdrop = variant === "light";
  return (
    <div className="space-y-2">
      <p className={cn("px-1 text-xs font-semibold uppercase tracking-wide", onDarkBackdrop ? "text-white/60" : "text-muted-foreground")}>
        {title}
      </p>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
        {entries.map((entry) => {
          const Icon = entry.Icon;
          return (
            <button
              key={entry.value}
              type="button"
              onClick={() => onSelect(entry.value)}
              title={entry.label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 border-transparent p-2 transition-all",
                onDarkBackdrop ? "hover:border-white/30 hover:bg-white/10" : "hover:border-border hover:bg-muted/50",
              )}
            >
              <Icon className="h-6 w-6 shrink-0" variant={variant} />
              <span className={cn("w-full truncate text-center text-[10px]", onDarkBackdrop ? "text-white/70" : "text-muted-foreground")}>
                {entry.label}
              </span>
            </button>
          );
        })}
        {trailingAction && (
          <button
            type="button"
            onClick={trailingAction.onClick}
            title={trailingAction.label}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 border-dashed p-2 transition-all",
              onDarkBackdrop
                ? "border-white/30 hover:border-white/50 hover:bg-white/10"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/50",
            )}
          >
            <Plus className={cn("h-6 w-6 shrink-0", onDarkBackdrop ? "text-white/70" : "text-muted-foreground")} />
            <span className={cn("w-full truncate text-center text-[10px]", onDarkBackdrop ? "text-white/70" : "text-muted-foreground")}>
              {trailingAction.label}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// "Biblioteca de Ícones" - opened from the link editor's icon field. The
// "Colorido"/"Escuro"/"Claro" tabs pick the color variant (see IconVariant)
// the whole grid re-renders in; the choice is passed back to onSelect so the
// caller can persist it alongside the icon itself.
export function IconLibraryModal({ open, onClose, onSelect }: IconLibraryModalProps) {
  const [query, setQuery] = useState("");
  const [variant, setVariant] = useState<IconVariant>("brand");
  const [showAllSocial, setShowAllSocial] = useState(false);

  const isSearching = query.trim().length > 0;
  const filteredSocial = useMemo(() => SOCIAL_ICONS.filter((entry) => matchesQuery(entry, query)), [query]);
  const filteredGeneric = useMemo(() => GENERIC_ICONS.filter((entry) => matchesQuery(entry, query)), [query]);
  // While searching, results always cover the full social list - the
  // "primary only" curation is just the default resting state.
  const displayedSocial =
    isSearching || showAllSocial ? filteredSocial : filteredSocial.filter((entry) => PRIMARY_SOCIAL_VALUES.includes(entry.value));
  const hasResults = filteredSocial.length > 0 || filteredGeneric.length > 0;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setQuery("");
      setVariant("brand");
      setShowAllSocial(false);
      onClose();
    }
  };

  const handleSelect = (value: string) => {
    setQuery("");
    onSelect(value, variant);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center space-y-0 border-b border-border px-5 py-4 pr-10">
          <DialogTitle>Biblioteca de Ícones</DialogTitle>
        </DialogHeader>

        <div className="border-b border-border px-5 py-3 space-y-3">
          <Tabs value={variant} onValueChange={(v) => setVariant(v as IconVariant)}>
            <TabsList className="w-full grid grid-cols-3">
              {VARIANT_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ícone..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Plain scrolling div, not Radix's ScrollArea: nested in this flex
            column, ScrollArea's inner Viewport (height:100%) doesn't resolve
            against the flex-computed height of its own Root and grows to fit
            all the content instead - so it never overflows itself and the
            list just gets silently clipped by Root's overflow-hidden, with
            no scrollbar. A native overflow-y-auto here doesn't have that
            failure mode. */}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-5 py-4",
            variant === "dark" ? "bg-white" : variant === "light" ? "bg-neutral-900" : undefined,
          )}
        >
          <div className="space-y-6">
            {hasResults ? (
              <>
                <IconGrid
                  title="Social"
                  entries={displayedSocial}
                  variant={variant}
                  onSelect={handleSelect}
                  trailingAction={
                    !isSearching && !showAllSocial && displayedSocial.length < filteredSocial.length
                      ? { label: "Todos", onClick: () => setShowAllSocial(true) }
                      : undefined
                  }
                />
                <IconGrid title="Genéricos" entries={filteredGeneric} variant={variant} onSelect={handleSelect} />
              </>
            ) : (
              <p className={cn("py-8 text-center text-sm", variant === "light" ? "text-white/60" : "text-muted-foreground")}>
                Nenhum ícone encontrado.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
