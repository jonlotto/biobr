import { Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { EditorProfile } from "@/hooks/useEditorState";
import { BUTTON_LAYOUTS, resolveButtonLayout, type ButtonLayout } from "@/lib/buttonLayouts";

interface ButtonsSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

function ButtonLayoutThumb({ layoutId }: { layoutId: string }) {
  if (layoutId === "unified-card") {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-md border border-border bg-white">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("flex flex-1 items-center gap-1 px-1.5", i < 2 && "border-b border-border")}>
            <div className="h-2 w-2 shrink-0 rounded-[2px] bg-muted-foreground/30" />
            <div className="h-1 flex-1 rounded-full bg-muted-foreground/20" />
            <ChevronRight className="h-2 w-2 shrink-0 text-muted-foreground/50" />
          </div>
        ))}
      </div>
    );
  }

  if (layoutId === "overlap-alternate") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/30 px-2">
        {[0, 1].map((i) => (
          <div key={i} className="relative h-3 w-full rounded-full bg-primary/30">
            <div
              className={cn(
                "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white bg-primary/70",
                i % 2 === 0 ? "-left-0.5" : "-right-0.5",
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  if (layoutId === "card-overlap-alternate") {
    // Pill bar with a circle noticeably taller than the bar itself, mostly
    // tucked at one end with just a slight outward poke - no shadow.
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30 px-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="relative h-2.5 w-full rounded-full bg-primary/30">
            <div
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white bg-primary/70",
                i % 2 === 0 ? "-left-0.5" : "-right-0.5",
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  if (layoutId === "pill-square-icon" || layoutId === "pill-round-icon") {
    const isRound = layoutId === "pill-round-icon";
    // The button itself is only a full pill for "round" - "square" has no
    // rounding at all (sharp corners), so the two read as visually distinct.
    const barShape = isRound ? "rounded-full" : "rounded-none";
    const iconShape = isRound ? "rounded-full" : "rounded-none";
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/30 px-2">
        {[0, 1].map((i) => (
          <div key={i} className={cn("flex h-3 w-full items-center gap-1 bg-primary/30 px-1", barShape)}>
            <div className={cn("h-1.5 w-1.5 shrink-0 bg-primary/70", iconShape)} />
          </div>
        ))}
      </div>
    );
  }

  // locked placeholders
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/40 px-2">
      <div className="h-3 w-full rounded-full bg-muted-foreground/20" />
      <div className="h-3 w-full rounded-full bg-muted-foreground/20" />
    </div>
  );
}

// Colors used to live here too (bg/text), but that duplicated the "Cores"
// section which now owns them - this screen is layout-only.
export function ButtonsSection({ profile, onUpdate }: ButtonsSectionProps) {
  const selectedButtonLayout = resolveButtonLayout(profile.buttonLayout);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Botões</h3>
        <p className="text-sm text-muted-foreground">
          Personalize o estilo dos seus botões
        </p>
      </div>

      {/* Button Layout */}
      <div className="space-y-3">
        <Label>Layout de botão</Label>
        <div className="grid grid-cols-4 gap-2">
          {BUTTON_LAYOUTS.map((layout) => {
            const isSelected = !layout.locked && selectedButtonLayout === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                disabled={layout.locked}
                onClick={() => !layout.locked && onUpdate({ buttonLayout: layout.id as ButtonLayout })}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-all",
                  isSelected ? "border-primary" : "border-transparent hover:border-border",
                  layout.locked && "cursor-not-allowed opacity-70",
                )}
              >
                <div className="relative h-12 w-full overflow-hidden rounded-lg border border-border">
                  <ButtonLayoutThumb layoutId={layout.id} />
                  {layout.locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight text-center">{layout.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
