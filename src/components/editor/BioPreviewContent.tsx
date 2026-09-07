import type { CSSProperties } from "react";
import { User } from "lucide-react";
import { templates } from "@/data/templates";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { getProfileBackgroundStyle, hasCustomProfileBackground } from "@/lib/templateBackground";
import { resolveHeaderLayout } from "@/lib/headerLayouts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LinkIcon } from "@/components/icons/LinkIcon";
import { CartIcon } from "@/components/icons/CartIcon";
import { StoreIcon } from "@/components/icons/StoreIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { LocationIcon } from "@/components/icons/LocationIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { TwitterIcon } from "@/components/icons/TwitterIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { EmailIcon } from "@/components/icons/EmailIcon";

const WHATSAPP_ICON_VALUE = "whatsapp-icon";
const LINK_ICON_VALUE = "link-icon";
const CART_ICON_VALUE = "cart-icon";
const STORE_ICON_VALUE = "store-icon";
const STAR_ICON_VALUE = "star-icon";
const LOCATION_ICON_VALUE = "location-icon";
const INSTAGRAM_ICON_VALUE = "instagram-icon";
const TIKTOK_ICON_VALUE = "tiktok-icon";
const YOUTUBE_ICON_VALUE = "youtube-icon";
const TWITTER_ICON_VALUE = "twitter-icon";
const LINKEDIN_ICON_VALUE = "linkedin-icon";
const EMAIL_ICON_VALUE = "email-icon";

// Shown in the buttons area of the preview when the user hasn't added any real
// button yet, so the empty state still demonstrates the selected theme.
const EXAMPLE_BUTTONS: { label: string; icon: string }[] = [
  { label: "Meu link", icon: LINK_ICON_VALUE },
  { label: "Instagram", icon: INSTAGRAM_ICON_VALUE },
];

export const renderPreviewIcon = (icon: string | undefined, size: "sm" | "md" = "sm") => {
  if (!icon) return null;
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  if (icon === WHATSAPP_ICON_VALUE) {
    return <WhatsAppIcon className={cn(sizeClass, "shrink-0")} title="WhatsApp" />;
  }
  if (icon === LINK_ICON_VALUE) {
    return <LinkIcon className="w-5 h-5 shrink-0" title="Link" />;
  }
  if (icon === CART_ICON_VALUE) {
    return <CartIcon className="w-5 h-5 shrink-0" title="Carrinho" />;
  }
  if (icon === STORE_ICON_VALUE) {
    return <StoreIcon className="w-5 h-5 shrink-0" title="Loja" />;
  }
  if (icon === STAR_ICON_VALUE) {
    return <StarIcon className="w-5 h-5 shrink-0" title="Estrela" />;
  }
  if (icon === LOCATION_ICON_VALUE) {
    return <LocationIcon className="w-5 h-5 shrink-0" title="Localização" />;
  }
  if (icon === INSTAGRAM_ICON_VALUE) {
    return <InstagramIcon className={cn(sizeClass, "shrink-0")} title="Instagram" />;
  }
  if (icon === TIKTOK_ICON_VALUE) {
    return <TikTokIcon className={cn(sizeClass, "shrink-0")} title="TikTok" />;
  }
  if (icon === YOUTUBE_ICON_VALUE) {
    return <YouTubeIcon className={cn(sizeClass, "shrink-0")} title="YouTube" />;
  }
  if (icon === TWITTER_ICON_VALUE) {
    return <TwitterIcon className={cn(sizeClass, "shrink-0")} title="Twitter" />;
  }
  if (icon === LINKEDIN_ICON_VALUE) {
    return <LinkedInIcon className={cn(sizeClass, "shrink-0")} title="LinkedIn" />;
  }
  if (icon === EMAIL_ICON_VALUE) {
    return <EmailIcon className={cn(sizeClass, "shrink-0")} title="Email" />;
  }
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

  // Shared button styling - used for real buttons and, when there are none yet, the example buttons below
  const globalBgColor = profile.globalButtonBgColor;
  const globalTextColor = profile.globalButtonTextColor;
  const buttonBorderRadius = profile.globalButtonBorderRadius || "rounded-xl";
  const buttonStyleMode = profile.globalButtonStyle || "filled";
  const hasCustomButtonColors = globalBgColor || globalTextColor;

  const hasProfileIdentity = !!(profile.displayName || profile.username);

  const handleClick = (type: "avatar" | "username" | "bio" | "link" | "banner", linkId?: string) => {
    if (!interactive) return;
    onClickElement?.(type, linkId);
  };

  const headerLayout = resolveHeaderLayout(profile.headerLayout, !!template.hasBanner);
  const hasCurvedBanner = template.hasCurvedBanner;

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

  const renderButtonsAndSocials = () => (
    <>
      <div className="space-y-3 mb-6">
        {buttons.length > 0
          ? buttons.map((link) => (
              <button
                key={link.id}
                type="button"
                className={cn(
                  "w-full py-3 px-4 font-medium transition-all relative flex items-center justify-center",
                  interactive && "hover:scale-[1.02] cursor-pointer",
                  buttonBorderRadius,
                  !hasCustomButtonColors &&
                    (buttonStyleMode === "filled"
                      ? cn(template.styles.buttonBg, template.styles.buttonText)
                      : cn("bg-transparent border-2", template.styles.textColor)),
                  buttonStyleMode === "outline" && hasCustomButtonColors && "bg-transparent border-2",
                )}
                style={{
                  fontFamily: profile.titleFont || "Inter",
                  ...(hasCustomButtonColors
                    ? {
                        backgroundColor: buttonStyleMode === "filled" ? globalBgColor || undefined : "transparent",
                        color: globalTextColor || undefined,
                        borderColor: buttonStyleMode === "outline" ? globalBgColor || undefined : undefined,
                      }
                    : {}),
                }}
                onClick={() => handleClick("link", link.id)}
              >
                {link.thumbnailUrl ? (
                  <img src={link.thumbnailUrl} alt="" className="absolute left-2 w-10 h-10 rounded-lg object-cover" />
                ) : (
                  link.icon && <span className="absolute left-4">{renderPreviewIcon(link.icon)}</span>
                )}
                <span className="text-sm">{link.title}</span>
              </button>
            ))
          : EXAMPLE_BUTTONS.map((example) => (
              <div
                key={example.label}
                className={cn(
                  "w-full py-3 px-4 font-medium relative flex items-center justify-center",
                  buttonBorderRadius,
                  !hasCustomButtonColors &&
                    (buttonStyleMode === "filled"
                      ? cn(template.styles.buttonBg, template.styles.buttonText)
                      : cn("bg-transparent border-2", template.styles.textColor)),
                  buttonStyleMode === "outline" && hasCustomButtonColors && "bg-transparent border-2",
                )}
                style={{
                  fontFamily: profile.titleFont || "Inter",
                  ...(hasCustomButtonColors
                    ? {
                        backgroundColor: buttonStyleMode === "filled" ? globalBgColor || undefined : "transparent",
                        color: globalTextColor || undefined,
                        borderColor: buttonStyleMode === "outline" ? globalBgColor || undefined : undefined,
                      }
                    : {}),
                }}
              >
                <span className="absolute left-4">{renderPreviewIcon(example.icon)}</span>
                <span className="text-sm">{example.label}</span>
              </div>
            ))}
      </div>

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
                style={{ backgroundColor: socialBgColor, color: socialTextColor }}
                onClick={() => handleClick("link", social.id)}
              >
                {renderPreviewIcon(social.icon, "md") || "🔗"}
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
      {headerLayout === "banner" ? (
        <>
          {/* Banner Layout - cover image/gradient with rounded bottom corners,
              a large circular avatar overlapping its bottom edge. Name, bio
              and buttons render below, outside the banner area. */}
          <div className="relative">
            <div
              className={cn(
                "w-full relative overflow-hidden",
                interactive && "cursor-pointer",
                !hasCurvedBanner && "rounded-b-[32px]",
              )}
              style={{ height: 170 }}
              onClick={() => handleClick("banner")}
            >
              {profile.bannerUrl ? (
                <img src={profile.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 w-full h-full" style={{ background: bannerGradient }} />
              )}

              {hasCurvedBanner && (
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
      ) : headerLayout === "banner-full" ? (
        <>
          {/* Banner Full Layout - the cover image/gradient fills almost the
              whole initial viewport, with a dark fade at its base; a small
              avatar, name and bio sit on top of that fade, in light text.
              Buttons render below, outside the image. */}
          <div
            className={cn("relative w-full overflow-hidden", interactive && "cursor-pointer")}
            style={{ height: 220 }}
            onClick={() => handleClick("banner")}
          >
            {profile.bannerUrl ? (
              <img src={profile.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full" style={{ background: bannerGradient }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-6 pb-5 text-center">
              {renderAvatar("w-12 h-12 border-2 border-white/70")}
              {renderTitleBlock("drop-shadow-sm", "text-white")}
              {renderBio("drop-shadow-sm mb-0", "text-white")}
            </div>
          </div>

          <div className="px-6 pt-6 pb-6">{renderButtonsAndSocials()}</div>
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
