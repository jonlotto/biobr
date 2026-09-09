import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Save, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { templates } from "@/data/templates";
import { hexToRgba } from "@/lib/color";
import { HEADER_LAYOUT_LABELS, resolveHeaderLayout } from "@/lib/headerLayouts";
import { BUTTON_LAYOUT_LABELS, resolveButtonLayout } from "@/lib/buttonLayouts";
import { HeaderSection } from "@/components/design/sections/HeaderSection";
import { ThemeSection } from "@/components/design/sections/ThemeSection";
import { TextSection } from "@/components/design/sections/TextSection";
import { ButtonsSection } from "@/components/design/sections/ButtonsSection";
import { ColorsSection } from "@/components/design/sections/ColorsSection";

interface DesignDrilldownViewProps {
  profile: EditorProfile;
  links: EditorLink[];
  onUpdate: (updates: Partial<EditorProfile>) => void;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
}

type CategoryId = "theme" | "header" | "buttons" | "text" | "colors";

function CategoryRow({ label, value, thumbnail, onClick }: { label: string; value?: string; thumbnail: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 text-left shadow-sm transition-transform hover:border-border active:scale-[0.99]"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border/40">{thumbnail}</div>
      <span className="flex-1 truncate text-sm font-medium">{label}</span>
      {value && <span className="max-w-[35%] truncate text-sm text-muted-foreground">{value}</span>}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

// Drill-down "Personalizar Design" screen: a category list opens full-screen
// sub-pages for each option group. Used verbatim on both mobile and desktop
// (this used to be a mobile-only view; the desktop sidebar + all-sections-
// stacked layout it replaced is gone).
export function DesignDrilldownView({ profile, links, onUpdate, isSaving, isDirty, onSave }: DesignDrilldownViewProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);

  const template = templates.find((t) => t.slug === profile.templateSlug) || templates[0];
  // Style/shape are fixed - see the same comment in BioPreviewContent.tsx.
  const buttonBorderRadius = "rounded-full";
  const hasCustomButtonColors = profile.globalButtonBgColor || profile.globalButtonTextColor;
  const resolvedHeaderLayout = resolveHeaderLayout(profile.headerLayout, !!template.hasBanner, !!template.hasCurvedBanner);
  const resolvedButtonLayout = resolveButtonLayout(profile.buttonLayout);

  const CATEGORY_LABELS: Record<CategoryId, string> = {
    theme: "Tema",
    header: "Header",
    buttons: "Botões",
    text: "Texto",
    colors: "Cores",
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden animate-fade-in">
      {/* Screen header - stays fixed at the top; Save (and the unsaved-changes
          indicator) live here instead of anchored to the bottom of a box, so
          they're reachable from both the category list and an open section. */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-1">
          {activeCategory === null ? (
            <h1 className="truncate px-1 text-lg font-display font-bold">Design</h1>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
              <span className="truncate text-sm font-semibold text-muted-foreground">{CATEGORY_LABELS[activeCategory]}</span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isDirty && <span className="text-xs font-medium text-muted-foreground">Alterações não salvas</span>}
          <Button onClick={onSave} disabled={isSaving || !isDirty} size="sm" className="rounded-xl">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
          {activeCategory === null ? (
            <div className="space-y-6">
              <CategoryRow
                label="Tema"
                value={template.name}
                onClick={() => setActiveCategory("theme")}
                thumbnail={
                  <div
                    className={cn(
                      "flex h-full w-full items-center justify-center text-[10px] font-bold",
                      template.styles.background,
                      template.styles.textColor,
                    )}
                  >
                    Aa
                  </div>
                }
              />

              <div className="space-y-2.5">
                <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personalizar</p>

                <div className="space-y-2.5">
                  <CategoryRow
                    label="Header"
                    value={HEADER_LAYOUT_LABELS[resolvedHeaderLayout]}
                    onClick={() => setActiveCategory("header")}
                    thumbnail={
                      <Avatar className="h-full w-full rounded-none">
                        <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="rounded-none bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    }
                  />

                  <CategoryRow
                    label="Botões"
                    value={BUTTON_LAYOUT_LABELS[resolvedButtonLayout]}
                    onClick={() => setActiveCategory("buttons")}
                    thumbnail={
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <div
                          className={cn("h-4 w-7", buttonBorderRadius, !hasCustomButtonColors && template.styles.buttonBg)}
                          style={
                            hasCustomButtonColors
                              ? { backgroundColor: profile.globalButtonBgColor ? hexToRgba(profile.globalButtonBgColor, profile.globalButtonBgOpacity ?? 100) : undefined }
                              : undefined
                          }
                        />
                      </div>
                    }
                  />

                  <CategoryRow
                    label="Texto"
                    value={profile.titleFont || "Inter"}
                    onClick={() => setActiveCategory("text")}
                    thumbnail={
                      <div
                        className="flex h-full w-full items-center justify-center bg-muted text-sm font-semibold"
                        style={{ fontFamily: profile.titleFont || "Inter" }}
                      >
                        Aa
                      </div>
                    }
                  />

                  <CategoryRow
                    label="Cores"
                    onClick={() => setActiveCategory("colors")}
                    thumbnail={
                      <div className="flex h-full w-full">
                        <div
                          className="h-full w-1/2"
                          style={{ backgroundColor: hexToRgba(profile.globalButtonBgColor || template.styles.primaryColor, profile.globalButtonBgOpacity ?? 100) }}
                        />
                        <div className="h-full w-1/2" style={{ backgroundColor: profile.titleColor || template.styles.accentColor }} />
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeCategory === "theme" && <ThemeSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "header" && <HeaderSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "buttons" && <ButtonsSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "text" && <TextSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "colors" && <ColorsSection profile={profile} onUpdate={onUpdate} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
