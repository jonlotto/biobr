import type { CSSProperties } from "react";
import { User, ChevronRight } from "lucide-react";
import { templates } from "@/data/templates";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { getProfileBackgroundStyle, hasCustomProfileBackground } from "@/lib/templateBackground";
import { resolveHeaderLayout } from "@/lib/headerLayouts";
import { resolveButtonLayout } from "@/lib/buttonLayouts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getLinkIconComponent, getLinkIconEntry, type IconVariant } from "@/lib/linkIcons";
import { hexToRgba } from "@/lib/color";

// Shown in the buttons area of the preview when the user hasn't added any real
// button yet, so the empty state still demonstrates the selected theme.
const EXAMPLE_BUTTONS: { label: string; icon: string }[] = [
  { label: "Meu link", icon: "link-icon" },
  { label: "Instagram", icon: "si-instagram" },
];

export const renderPreviewIcon = (icon: string | undefined, size: "sm" | "md" = "sm", variant?: IconVariant) => {
  if (!icon) return null;
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const Icon = getLinkIconComponent(icon);
  if (Icon) return <Icon className={cn(sizeClass, "shrink-0")} variant={variant} title={getLinkIconEntry(icon)?.label} />;
  return <span className="shrink-0">{icon}</span>;
};

interface BioPreviewContentProps {
  profile: EditorProfile;
  links: EditorLink[];
  /**
   * When false, the preview is purely visual: click handlers are disabled
   * (no navigation, no jump-to-edit) and hover/cursor affordances are hidden.
   */
  interactive?: boolean;
  onClickElement?: (type: "avatar" | "username" | "bio" | "link" | "banner", linkId?: string) => void;
}

export function BioPreviewContent({ profile, links, interactive = true, onClickElement }: BioPreviewContentProps) {
  const template = templates.find((t) => t.slug === profile.templateSlug) || templates[0];
  const activeLinks = links.filter((l) => l.isActive).sort((a, b) => a.order - b.order);
  const buttons = activeLinks.filter((l) => l.linkType === "button");
  const socials = activeLinks.filter((l) => l.linkType === "social");

  // Shared button styling - used for real buttons and, when there are none yet, the example buttons below.
  // Style is fixed to filled, and shape is fixed per button layout (each one
  // already embeds its own visual form) - these no longer read
  // profile.globalButtonStyle/BorderRadius (kept on the profile only for
  // backward compatibility with old rows). buttonBorderRadius here is the
  // default full-pill radius (overlap-alternate, pill-round-icon);
  // pill-square-icon overrides it to a small radius in renderPillList below,
  // so the two "pill" layouts read as visually distinct.
  const globalBgColor = profile.globalButtonBgColor;
  const globalBgOpacity = profile.globalButtonBgOpacity ?? 100;
  const globalTextColor = profile.globalButtonTextColor;
  const buttonBorderRadius = "rounded-full";
  const hasCustomButtonColors = globalBgColor || globalTextColor;

  const hasProfileIdentity = !!(profile.displayName || profile.username);

  const handleClick = (type: "avatar" | "username" | "bio" | "link" | "banner", linkId?: string) => {
    if (!interactive) return;
    onClickElement?.(type, linkId);
  };

  const headerLayout = resolveHeaderLayout(profile.headerLayout, !!template.hasBanner, !!template.hasCurvedBanner);
  const buttonLayout = resolveButtonLayout(profile.buttonLayout);

  const backgroundStyle = getProfileBackgroundStyle(profile, template);
  const hasCustomBackground = hasCustomProfileBackground(profile);
  const hasImageBackground = template.styles.backgroundType === "image" && template.styles.backgroundImage && !hasCustomBackground;

  // Border color used to separate the avatar from the banner behind it -
  // matches the page's own solid background color so the avatar ring reads
  // as a continuation of the content area, falling back to white when the
  // page background is a gradient/image (a color a border can't render).
  const pageBorderColor =
    profile.globalBackgroundColor && !profile.globalBackgroundColor.startsWith("linear-gradient")
      ? profile.globalBackgroundColor
      : "#ffffff";

  // Fallback fill for any banner-style layout when the user hasn't uploaded a
  // banner image yet - a diagonal gradient built from the theme's own colors.
  const bannerGradient = `linear-gradient(135deg, ${template.styles.primaryColor}, ${template.styles.accentColor})`;

  const renderAvatar = (sizeClassName: string, extraClassName?: string, style?: CSSProperties) => (
    <Avatar
      className={cn(
        sizeClassName,
        template.styles.avatarBorder,
        interactive && "cursor-pointer hover:opacity-90 transition-opacity",
        extraClassName,
      )}
      style={style}
      onClick={() => handleClick("avatar")}
    >
      <AvatarImage src={profile.avatarUrl || undefined} />
      <AvatarFallback
        className={cn(
          "flex items-center justify-center",
          hasProfileIdentity ? cn(template.styles.cardBg, template.styles.textColor) : template.styles.textColor,
        )}
        style={!hasProfileIdentity ? { backgroundColor: `${template.styles.primaryColor}33` } : undefined}
      >
        {profile.displayName?.charAt(0) || profile.username?.charAt(0) || <User className="h-8 w-8 opacity-70" />}
      </AvatarFallback>
    </Avatar>
  );

  const renderTitleBlock = (textClassName?: string, colorClass?: string) => (
    <>
      <p
        className={cn(
          "text-center text-sm mb-1 transition-opacity",
          interactive && "cursor-pointer hover:opacity-80",
          !profile.titleColor && (colorClass ?? template.styles.textColor),
          textClassName,
        )}
        style={{ fontFamily: profile.titleFont || "Inter", color: profile.titleColor || undefined }}
        onClick={() => handleClick("username")}
      >
        @{profile.handle || profile.username || "usuario"}
      </p>
      <h1
        className={cn(
          "text-center font-bold mb-2",
          profile.titleSize === "small" ? "text-lg" : "text-xl",
          !profile.titleColor && (colorClass ?? template.styles.textColor),
          textClassName,
        )}
        style={{ fontFamily: profile.titleFont || "Inter", color: profile.titleColor || undefined }}
      >
        {profile.displayName || "Nome de Exibição"}
      </h1>
    </>
  );

  const renderBio = (textClassName?: string, colorClass?: string) => (
    <p
      className={cn(
        "text-center text-sm mb-6 transition-opacity opacity-80",
        interactive && "cursor-pointer hover:opacity-80",
        !profile.titleColor && (colorClass ?? template.styles.textColor),
        textClassName,
      )}
      style={{ fontFamily: profile.titleFont || "Inter", color: profile.titleColor || undefined }}
      onClick={() => handleClick("bio")}
    >
      {profile.bio || "Sua bio aqui..."}
    </p>
  );

  // Normalizes real links and the no-links-yet placeholders into one shape
  // so every layout below maps over a single list instead of duplicating
  // near-identical JSX for the "real" vs "example" cases.
  const displayButtons: { key: string; title: string; icon?: string; iconVariant?: IconVariant; thumbnailUrl?: string | null; linkId?: string; isExample?: boolean }[] =
    buttons.length > 0
      ? buttons.map((link) => ({
          key: link.id,
          title: link.title,
          icon: link.icon || undefined,
          iconVariant: link.iconVariant || undefined,
          thumbnailUrl: link.thumbnailUrl,
          linkId: link.id,
        }))
      : EXAMPLE_BUTTONS.map((example, i) => ({ key: `example-${i}`, title: example.label, icon: example.icon, isExample: true }));

  // Mirrors the button's own fill logic - reused for icon chips that need
  // their own visible surface (unified-card rows, the overlap-alternate
  // badge) so they read as "the button's color" condensed into a tile.
  // Style is fixed to "filled", so this is always a solid fill - no
  // outline/transparent branch to account for.
  const chipFillClassName = () => !hasCustomButtonColors && cn(template.styles.buttonBg, template.styles.buttonText);
  const chipFillStyle = (): CSSProperties =>
    hasCustomButtonColors
      ? { backgroundColor: globalBgColor ? hexToRgba(globalBgColor, globalBgOpacity) : undefined, color: globalTextColor || undefined }
      : {};

  const buttonFillClassName = (isExample?: boolean, radiusOverride?: string) =>
    cn(
      radiusOverride ?? buttonBorderRadius,
      !hasCustomButtonColors && cn(template.styles.buttonBg, template.styles.buttonText),
      interactive && !isExample && "hover:scale-[1.02] cursor-pointer",
    );
  const buttonFillStyle = (): CSSProperties => ({
    fontFamily: profile.titleFont || "Inter",
    ...(hasCustomButtonColors
      ? { backgroundColor: globalBgColor ? hexToRgba(globalBgColor, globalBgOpacity) : undefined, color: globalTextColor || undefined }
      : {}),
  });

  const renderPillList = (shape: "square" | "round") => {
    // "square" gets small rounded corners (not a full pill) so it reads
    // visually distinct from "round", whose button IS a full pill/capsule.
    const pillRadius = shape === "round" ? "rounded-full" : "rounded-none";
    return (
      <div className="space-y-3 mb-6">
        {displayButtons.map((item) => {
          const hasMedia = !!(item.thumbnailUrl || item.icon);
          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "w-full py-3 px-4 font-medium transition-all relative flex items-center justify-center",
                buttonFillClassName(item.isExample, pillRadius),
              )}
              style={buttonFillStyle()}
              onClick={() => !item.isExample && item.linkId && handleClick("link", item.linkId)}
            >
              {hasMedia && (
                <span
                  className={cn(
                    "absolute left-2 flex h-10 w-10 items-center justify-center overflow-hidden",
                    shape === "round" ? "rounded-full" : "rounded-none",
                  )}
                >
                  {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderPreviewIcon(item.icon, "sm", item.iconVariant)}
                </span>
              )}
              <span className="text-sm">{item.title}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderOverlapAlternateList = () => (
    <div className="space-y-4 mb-6">
      {displayButtons.map((item, i) => {
        const hasMedia = !!(item.thumbnailUrl || item.icon);
        const sideLeft = i % 2 === 0;
        return (
          <button
            key={item.key}
            type="button"
            className={cn("relative w-full py-3 px-4 font-medium transition-all flex items-center justify-center", buttonFillClassName(item.isExample))}
            style={buttonFillStyle()}
            onClick={() => !item.isExample && item.linkId && handleClick("link", item.linkId)}
          >
            {hasMedia && (
              <span
                className={cn(
                  "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full shadow-md",
                  sideLeft ? "-left-3" : "-right-3",
                  chipFillClassName(),
                )}
                style={{ border: `4px solid ${pageBorderColor}`, ...chipFillStyle() }}
              >
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderPreviewIcon(item.icon, "sm", item.iconVariant)}
              </span>
            )}
            <span className="text-sm">{item.title}</span>
          </button>
        );
      })}
    </div>
  );

  const renderCardOverlapAlternateList = () => (
    // Wide horizontal pill, fully rounded ends. The icon sits in its own
    // circle, mostly embedded at one end but slightly larger than the
    // button's own height, so it pokes out a bit on every outer side (top,
    // bottom, and past the edge) instead of just overlapping sideways.
    // Minimal by design: no drop shadow, no extra ornamentation beyond the
    // contrast ring that separates the icon from the button underneath it.
    <div className="space-y-4 mb-6">
      {displayButtons.map((item, i) => {
        const hasMedia = !!(item.thumbnailUrl || item.icon);
        const sideLeft = i % 2 === 0;
        return (
          <button
            key={item.key}
            type="button"
            className={cn(
              "relative w-full rounded-full flex items-center transition-all",
              sideLeft ? "pl-16 pr-6" : "pl-6 pr-16",
              !hasCustomButtonColors && cn(template.styles.buttonBg, template.styles.buttonText),
              interactive && !item.isExample && "hover:scale-[1.01] cursor-pointer",
            )}
            style={{
              height: 56,
              fontFamily: profile.titleFont || "Inter",
              ...(hasCustomButtonColors
                ? { backgroundColor: globalBgColor ? hexToRgba(globalBgColor, globalBgOpacity) : undefined, color: globalTextColor || undefined }
                : {}),
            }}
            onClick={() => !item.isExample && item.linkId && handleClick("link", item.linkId)}
          >
            <span className="flex-1 truncate text-left text-sm font-medium">{item.title}</span>

            {hasMedia && (
              <span
                className={cn(
                  "absolute top-1/2 flex h-[68px] w-[68px] -translate-y-1/2 items-center justify-center overflow-hidden rounded-full",
                  sideLeft ? "-left-2" : "-right-2",
                  chipFillClassName(),
                )}
                style={{ border: `3px solid ${pageBorderColor}`, ...chipFillStyle() }}
              >
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderPreviewIcon(item.icon, "sm", item.iconVariant)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderUnifiedCardList = () => (
    <div className={cn("mb-6 overflow-hidden rounded-2xl shadow-sm", template.styles.cardBg)}>
      {displayButtons.map((item, i) => {
        const hasMedia = !!(item.thumbnailUrl || item.icon);
        const isLast = i === displayButtons.length - 1;
        return (
          <button
            key={item.key}
            type="button"
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
              interactive && !item.isExample && "cursor-pointer hover:bg-black/5",
              !isLast && "border-b border-border/60",
            )}
            style={{ fontFamily: profile.titleFont || "Inter" }}
            onClick={() => !item.isExample && item.linkId && handleClick("link", item.linkId)}
          >
            {hasMedia && (
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg", chipFillClassName())} style={chipFillStyle()}>
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderPreviewIcon(item.icon, "sm", item.iconVariant)}
              </span>
            )}
            <span className={cn("flex-1 truncate text-sm font-medium", template.styles.textColor)}>{item.title}</span>
            <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-50", template.styles.textColor)} />
          </button>
        );
      })}
    </div>
  );

  const renderButtonsAndSocials = () => (
    <>
      {buttonLayout === "unified-card"
        ? renderUnifiedCardList()
        : buttonLayout === "overlap-alternate"
          ? renderOverlapAlternateList()
          : buttonLayout === "card-overlap-alternate"
            ? renderCardOverlapAlternateList()
            : renderPillList(buttonLayout === "pill-round-icon" ? "round" : "square")}

      {socials.length > 0 && (
        <div className="flex justify-center gap-4 flex-wrap">
          {socials.map((social) => {
            const socialBgColor = profile.globalButtonBgColor || template.styles.primaryColor;
            const socialTextColor = profile.globalButtonTextColor || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined);

            return (
              <button
                key={social.id}
                type="button"
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-transform",
                  interactive && "hover:scale-110 cursor-pointer",
                )}
                style={{ backgroundColor: hexToRgba(socialBgColor, globalBgOpacity), color: socialTextColor }}
                onClick={() => handleClick("link", social.id)}
              >
                {renderPreviewIcon(social.icon, "md", social.iconVariant || undefined) || "🔗"}
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn("h-full overflow-auto", !hasCustomBackground && !hasImageBackground && template.styles.background)}
      style={backgroundStyle}
    >
      {headerLayout === "banner" || headerLayout === "banner-wave" ? (
        <>
          {/* Banner / Banner Wave Layout - cover image/gradient with a large
              circular avatar overlapping its bottom edge. The base is either
              straight rounded corners ("banner") or a curved wave cut
              ("banner-wave"). Name, bio and buttons render below, outside
              the banner area. */}
          <div className="relative">
            <div
              className={cn(
                "w-full relative overflow-hidden",
                interactive && "cursor-pointer",
                headerLayout !== "banner-wave" && "rounded-b-[32px]",
              )}
              style={{ height: 170 }}
              onClick={() => handleClick("banner")}
            >
              {profile.bannerUrl ? (
                <img src={profile.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 w-full h-full" style={{ background: bannerGradient }} />
              )}

              {headerLayout === "banner-wave" && (
                <svg
                  viewBox="0 0 320 44"
                  className="absolute bottom-[-1px] left-0 w-full h-[44px] pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,44 Q160,0 320,44 L320,44 L0,44 Z"
                    fill={
                      profile.globalBackgroundColor && !profile.globalBackgroundColor.startsWith("linear-gradient")
                        ? profile.globalBackgroundColor
                        : "#ffffff"
                    }
                  />
                </svg>
              )}
            </div>

            <div className="absolute left-1/2 bottom-0 z-10 -translate-x-1/2 translate-y-1/2">
              {renderAvatar("w-[100px] h-[100px] shadow-lg", undefined, { border: `4px solid ${pageBorderColor}` })}
            </div>
          </div>

          <div className="pt-16">
            <div className={cn("pb-6 px-6", !hasCustomBackground && template.styles.contentBg)}>
              {renderTitleBlock()}
              {renderBio()}
              {renderButtonsAndSocials()}
            </div>
          </div>
        </>
      ) : headerLayout === "banner-card" ? (
        <>
          {/* Banner Card Layout - a colored cover with no round avatar; a
              floating elevated card overlaps the transition into the
              content, holding a small square logo, name and short
              subtitle. Buttons render below the card. */}
          <div
            className={cn("w-full relative overflow-hidden", interactive && "cursor-pointer")}
            style={{ height: 190 }}
            onClick={() => handleClick("banner")}
          >
            {profile.bannerUrl ? (
              <img src={profile.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full" style={{ background: bannerGradient }} />
            )}
          </div>

          <div className="px-6">
            <div
              className={cn(
                "relative z-10 -mt-10 flex items-center gap-3 rounded-2xl p-4 shadow-lg",
                template.styles.cardBg,
              )}
            >
              <div
                className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted-foreground/20 cursor-pointer"
                onClick={() => handleClick("avatar")}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className={cn("h-5 w-5 opacity-70", template.styles.textColor)} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h1
                  className={cn("truncate font-bold", !profile.titleColor && template.styles.textColor)}
                  style={{ fontFamily: profile.titleFont || "Inter", color: profile.titleColor || undefined }}
                  onClick={() => handleClick("username")}
                >
                  {profile.displayName || "Nome de Exibição"}
                </h1>
                <p
                  className={cn("truncate text-sm opacity-70", !profile.titleColor && template.styles.textColor)}
                  style={{ fontFamily: profile.titleFont || "Inter", color: profile.titleColor || undefined }}
                  onClick={() => handleClick("bio")}
                >
                  {profile.bio || `@${profile.handle || profile.username || "usuario"}`}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 pt-6 pb-6">{renderButtonsAndSocials()}</div>
        </>
      ) : (
        /* Classic Layout - small centered circular avatar, page background
           behind, title and bio below. */
        <div className="p-6 pt-10">
          <div className="flex justify-center mb-4">{renderAvatar("w-24 h-24")}</div>
          {renderTitleBlock()}
          {renderBio()}
          {renderButtonsAndSocials()}
        </div>
      )}
    </div>
  );
}
