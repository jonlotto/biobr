import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}: {
  title: string;
  entries: LinkIconEntry[];
  variant: IconVariant;
  onSelect: (value: string) => void;
}) {
  if (entries.length === 0) return null;
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

  const filteredSocial = useMemo(() => SOCIAL_ICONS.filter((entry) => matchesQuery(entry, query)), [query]);
  const filteredGeneric = useMemo(() => GENERIC_ICONS.filter((entry) => matchesQuery(entry, query)), [query]);
  const hasResults = filteredSocial.length > 0 || filteredGeneric.length > 0;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setQuery("");
      setVariant("brand");
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
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-5 py-4 pr-10">
          <DialogTitle>Biblioteca de Ícones</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
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

        <ScrollArea className="min-h-0 flex-1">
          <div className={cn("space-y-6 px-5 py-4", variant === "dark" ? "bg-white" : variant === "light" ? "bg-neutral-900" : undefined)}>
            {hasResults ? (
              <>
                <IconGrid title="Social" entries={filteredSocial} variant={variant} onSelect={handleSelect} />
                <IconGrid title="Genéricos" entries={filteredGeneric} variant={variant} onSelect={handleSelect} />
              </>
            ) : (
              <p className={cn("py-8 text-center text-sm", variant === "light" ? "text-white/60" : "text-muted-foreground")}>
                Nenhum ícone encontrado.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
