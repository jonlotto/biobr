import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Save, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { templates } from "@/data/templates";
import { getProfileBackgroundStyle, hasCustomProfileBackground } from "@/lib/templateBackground";
import { HEADER_LAYOUT_LABELS, resolveHeaderLayout } from "@/lib/headerLayouts";
import { HeaderSection } from "@/components/design/sections/HeaderSection";
import { ThemeSection } from "@/components/design/sections/ThemeSection";
import { WallpaperSection } from "@/components/design/sections/WallpaperSection";
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

type CategoryId = "theme" | "header" | "wallpaper" | "buttons" | "text" | "colors";

// Compact banner-style preview - not a smaller phone mockup, just a strip
// showing avatar + handle and a couple of illustrative button shapes, using
// the same theme tokens/state as the full preview so it's never out of sync.
function CompactPreviewBar({ profile }: { profile: EditorProfile }) {
  const template = templates.find((t) => t.slug === profile.templateSlug) || templates[0];
  const backgroundStyle = getProfileBackgroundStyle(profile, template);
  const hasCustomBackground = hasCustomProfileBackground(profile);
  const hasProfileIdentity = !!(profile.displayName || profile.username);

  const buttonBorderRadius = profile.globalButtonBorderRadius || "rounded-xl";
  const buttonStyleMode = profile.globalButtonStyle || "filled";
  const hasCustomButtonColors = profile.globalButtonBgColor || profile.globalButtonTextColor;

  return (
    <div
      className={cn("flex shrink-0 items-center justify-between gap-3 px-4 py-3", !hasCustomBackground && template.styles.background)}
      style={backgroundStyle}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Avatar
          className={cn("h-10 w-10 shrink-0 border-2 border-white/70 shadow-sm", template.styles.avatarBorder)}
        >
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback
            className={cn(
              "flex items-center justify-center",
              hasProfileIdentity ? cn(template.styles.cardBg, template.styles.textColor) : template.styles.textColor,
            )}
            style={!hasProfileIdentity ? { backgroundColor: `${template.styles.primaryColor}40` } : undefined}
          >
            {profile.displayName?.charAt(0) || profile.username?.charAt(0) || <User className="h-4 w-4 opacity-70" />}
          </AvatarFallback>
        </Avatar>
        <span className={cn("truncate text-sm font-medium", template.styles.textColor)}>
          @{profile.handle || profile.username || "usuario"}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {["w-10", "w-7"].map((widthClass, i) => (
          <div
            key={i}
            className={cn(
              "h-4",
              widthClass,
              buttonBorderRadius,
              !hasCustomButtonColors &&
                (buttonStyleMode === "filled" ? template.styles.buttonBg : cn("border-2 bg-transparent", template.styles.textColor)),
            )}
            style={
              hasCustomButtonColors
                ? {
                    backgroundColor: buttonStyleMode === "filled" ? profile.globalButtonBgColor || undefined : "transparent",
                    borderColor: buttonStyleMode === "outline" ? profile.globalButtonBgColor || undefined : undefined,
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ label, value, thumbnail, onClick }: { label: string; value?: string; thumbnail: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 text-left shadow-sm transition-transform hover:border-border active:scale-[0.99]"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border/40">{thumbnail}</div>
      <span className="flex-1 truncate text-sm font-medium">{label}</span>
      {value && <span className="max-w-[35%] truncate text-sm text-muted-foreground">{value}</span>}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

// Drill-down "Personalizar Design" screen: a compact live preview stays fixed
// on top while a category list underneath opens full-screen sub-pages for
// each option group. Used verbatim on both mobile and desktop (this used to
// be a mobile-only view; the desktop sidebar + all-sections-stacked layout it
// replaced is gone).
export function DesignDrilldownView({ profile, links, onUpdate, isSaving, isDirty, onSave }: DesignDrilldownViewProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);

  const template = templates.find((t) => t.slug === profile.templateSlug) || templates[0];
  const backgroundStyle = getProfileBackgroundStyle(profile, template);
  const hasCustomBackground = hasCustomProfileBackground(profile);
  const buttonBorderRadius = profile.globalButtonBorderRadius || "rounded-xl";
  const buttonStyleMode = profile.globalButtonStyle || "filled";
  const hasCustomButtonColors = profile.globalButtonBgColor || profile.globalButtonTextColor;
  const resolvedHeaderLayout = resolveHeaderLayout(profile.headerLayout, !!template.hasBanner);

  const wallpaperValue = profile.globalBackgroundImage
    ? "Imagem"
    : profile.globalBackgroundColor?.startsWith("linear-gradient")
      ? "Gradiente"
      : profile.globalBackgroundColor
        ? "Cor"
        : "Padrão";

  const CATEGORY_LABELS: Record<CategoryId, string> = {
    theme: "Tema",
    header: "Header",
    wallpaper: "Fundo",
    buttons: "Botões",
    text: "Texto",
    colors: "Cores",
  };

  return (
    <div className="flex flex-1 min-h-0 items-stretch justify-center overflow-hidden animate-fade-in md:px-6 md:py-6">
      <div className="flex w-full min-h-0 flex-col overflow-hidden md:max-w-xl md:rounded-2xl md:border md:border-border md:shadow-sm">
        <CompactPreviewBar profile={profile} />

        {activeCategory === null ? (
          <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personalizar</p>

              <div className="space-y-2">
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
                  label="Fundo"
                  value={wallpaperValue}
                  onClick={() => setActiveCategory("wallpaper")}
                  thumbnail={<div className={cn("h-full w-full", !hasCustomBackground && template.styles.background)} style={backgroundStyle} />}
                />

                <CategoryRow
                  label="Botões"
                  value={buttonStyleMode === "outline" ? "Contorno" : "Preenchido"}
                  onClick={() => setActiveCategory("buttons")}
                  thumbnail={
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <div
                        className={cn(
                          "h-4 w-7",
                          buttonBorderRadius,
                          !hasCustomButtonColors &&
                            (buttonStyleMode === "filled" ? template.styles.buttonBg : cn("border-2 bg-transparent", template.styles.textColor)),
                        )}
                        style={
                          hasCustomButtonColors
                            ? {
                                backgroundColor: buttonStyleMode === "filled" ? profile.globalButtonBgColor || undefined : "transparent",
                                borderColor: buttonStyleMode === "outline" ? profile.globalButtonBgColor || undefined : undefined,
                              }
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
                      <div className="h-full w-1/2" style={{ backgroundColor: profile.globalButtonBgColor || template.styles.primaryColor }} />
                      <div className="h-full w-1/2" style={{ backgroundColor: profile.titleColor || template.styles.accentColor }} />
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
              <span className="text-sm font-semibold text-muted-foreground">{CATEGORY_LABELS[activeCategory]}</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
              {activeCategory === "theme" && <ThemeSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "header" && <HeaderSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "wallpaper" && <WallpaperSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "buttons" && <ButtonsSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "text" && <TextSection profile={profile} onUpdate={onUpdate} />}
              {activeCategory === "colors" && <ColorsSection profile={profile} onUpdate={onUpdate} />}
            </div>
          </>
        )}

        <div className="shrink-0 border-t border-border bg-background p-4">
          <Button onClick={onSave} disabled={isSaving || !isDirty} className="h-12 w-full rounded-xl text-base">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
