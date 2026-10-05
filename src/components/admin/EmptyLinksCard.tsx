import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { renderIcon } from "@/components/LinkCard";

export type EmptyLinksSuggestion = "whatsapp" | "instagram" | "site";

const SUGGESTIONS: { id: EmptyLinksSuggestion; label: string; icon: ReactNode }[] = [
  // Same green as the WhatsApp option in AddLinkSheet.
  { id: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon className="h-4 w-4 text-success" /> },
  // Same "si-instagram" brand-colored logo the created block itself shows.
  { id: "instagram", label: "Instagram", icon: renderIcon("si-instagram", "h-4 w-4", "brand") },
  { id: "site", label: "Site", icon: <Globe className="h-4 w-4 text-primary" /> },
];

interface EmptyLinksCardProps {
  onSelect: (suggestion: EmptyLinksSuggestion) => void;
}

// Shown in place of the links list while the user has no links yet - a
// shortcut into the two most common first blocks. Each pill reuses the
// regular "Adicionar Link" creation path (see AdminLayout).
export function EmptyLinksCard({ onSelect }: EmptyLinksCardProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <p className="font-semibold text-foreground">Sua bio está vazia</p>
      <p className="mt-2 text-sm text-muted-foreground">Comece adicionando um destes:</p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="flex h-10 items-center gap-2 rounded-full bg-card px-4 text-sm font-medium text-foreground/80 shadow-sm transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
