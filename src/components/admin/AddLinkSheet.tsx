import { useState, type ComponentType, type SVGProps } from "react";
import { Search, Link2, LayoutGrid, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";

export type AddLinkOptionId = "link" | "whatsapp" | "cards";

interface AddLinkOption {
  id: AddLinkOptionId;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  bgClassName: string;
  fgClassName: string;
}

const OPTIONS: AddLinkOption[] = [
  {
    id: "link",
    title: "Link",
    description: "Botão pra qualquer site, com ícone automático",
    icon: Link2,
    bgClassName: "bg-accent/10",
    fgClassName: "text-accent",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Botão que abre o Zap com sua mensagem pronta",
    icon: WhatsAppIcon,
    bgClassName: "bg-success/15",
    fgClassName: "text-success",
  },
  {
    id: "cards",
    title: "Cards informativos",
    description: "Frete grátis, atacado, avisos",
    icon: LayoutGrid,
    bgClassName: "bg-pro/15",
    fgClassName: "text-pro",
  },
];

interface AddLinkSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (option: AddLinkOptionId) => void;
}

export function AddLinkSheet({ open, onClose, onSelect }: AddLinkSheetProps) {
  const [query, setQuery] = useState("");

  const filteredOptions = OPTIONS.filter((option) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return option.title.toLowerCase().includes(q) || option.description.toLowerCase().includes(q);
  });

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
          setQuery("");
        }
      }}
    >
      <DrawerContent>
        <DrawerHeader className="pb-2 text-center sm:text-center">
          <DrawerTitle>Adicionar link ou bloco</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cole uma URL ou busque"
              className="pl-9"
              autoFocus={false}
            />
          </div>
        </div>

        <div className="space-y-2 px-4 pb-6">
          {filteredOptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma opção encontrada.</p>
          ) : (
            filteredOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelect(option.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
                >
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", option.bgClassName, option.fgClassName)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
