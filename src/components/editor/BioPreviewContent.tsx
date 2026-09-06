import { ImageIcon } from "lucide-react";
import { templates } from "@/data/templates";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
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

  const handleClick = (type: "avatar" | "username" | "bio" | "link" | "banner", linkId?: string) => {
    if (!interactive) return;
    onClickElement?.(type, linkId);
  };

  const hasBanner = template.hasBanner;
  const hasCurvedBanner = template.hasCurvedBanner;

  // Build background style with global color/image override or template image
  const getBackgroundStyle = (): React.CSSProperties | undefined => {
    // 1. Custom background image has highest priority
    if (profile.globalBackgroundImage) {
      return {
        backgroundImage: `url(${profile.globalBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    // 2. Custom color or gradient
    if (profile.globalBackgroundColor) {
      if (profile.globalBackgroundColor.startsWith("linear-gradient")) {
        return { background: profile.globalBackgroundColor };
      }
      return { backgroundColor: profile.globalBackgroundColor };
    }
    // 3. Template background image
    if (template.styles.backgroundType === "image" && template.styles.backgroundImage) {
      return {
        backgroundImage: `url(${template.styles.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return undefined;
  };

  const backgroundStyle = getBackgroundStyle();
  const hasCustomBackground = !!profile.globalBackgroundImage || !!profile.globalBackgroundColor;
  const hasImageBackground = template.styles.backgroundType === "image" && template.styles.backgroundImage && !hasCustomBackground;

  return (
    <div
      className={cn(
        "h-full overflow-auto",
        !hasCustomBackground && !hasImageBackground && template.styles.background
      )}
      style={backgroundStyle}
    >
      {hasBanner ? (
        <>
          {/* Banner Layout */}
          <div className="relative">
            {/* Banner Container - extended height for curved banners */}
            <div
              className={cn(
                "w-full relative overflow-hidden",
                interactive && "cursor-pointer",
                hasCurvedBanner ? "aspect-[8/5]" : "aspect-[8/5]"
              )}
              onClick={() => handleClick("banner")}
            >
              {/* Banner Image - fills entire container */}
              {profile.bannerUrl ? (
                <img
                  src={profile.bannerUrl}
                  alt="Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}

              {/* Curved wave overlay - dynamic fill to match background */}
              {hasCurvedBanner && (
                <svg
                  viewBox="0 0 320 44"
                  className="absolute bottom-[-1px] left-0 w-full h-[44px] pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,44 Q160,0 320,44 L320,44 L0,44 Z"
                    fill={profile.globalBackgroundColor && !profile.globalBackgroundColor.startsWith("linear-gradient") ? profile.globalBackgroundColor : "#ffffff"}
                  />
                </svg>
              )}
            </div>

            {/* Avatar overlapping banner */}
            <div
              className={cn(
                "absolute left-1/2 transform -translate-x-1/2 z-10",
                interactive && "cursor-pointer hover:opacity-90 transition-opacity",
                hasCurvedBanner ? "bottom-0 translate-y-1/2" : "-bottom-12"
              )}
              onClick={() => handleClick("avatar")}
            >
              <Avatar
                className={cn("w-24 h-24 border-4 border-white", template.styles.avatarBorder, hasCurvedBanner && "shadow-lg")}
              >
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback
                  className={cn(template.styles.cardBg, template.styles.textColor)}
                >
                  {profile.displayName?.charAt(0) || profile.username?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Content below banner - Spacer for avatar (no background) */}
          <div className="pt-16">
            {/* Inner content container with background */}
            <div
              className={cn("pb-6 px-6", !hasCustomBackground && template.styles.contentBg)}
            >
              {/* Username */}
              <p
                className={cn(
                  "text-center text-sm mb-1 transition-opacity",
                  interactive && "cursor-pointer hover:opacity-80",
                  !profile.titleColor && template.styles.textColor
                )}
                style={{
                  fontFamily: profile.titleFont || "Inter",
                  color: profile.titleColor || undefined
                }}
                onClick={() => handleClick("username")}
              >
                @{profile.handle || profile.username || "usuario"}
              </p>

              {/* Display Name */}
              <h1
                className={cn(
                  "text-center font-bold mb-2",
                  profile.titleSize === "small" ? "text-lg" : "text-xl",
                  !profile.titleColor && template.styles.textColor
                )}
                style={{
                  fontFamily: profile.titleFont || "Inter",
                  color: profile.titleColor || undefined
                }}
              >
                {profile.displayName || "Nome de Exibição"}
              </h1>

              {/* Bio */}
              <p
                className={cn(
                  "text-center text-sm mb-6 transition-opacity opacity-80",
                  interactive && "cursor-pointer hover:opacity-80",
                  !profile.titleColor && template.styles.textColor
                )}
                style={{
                  fontFamily: profile.titleFont || "Inter",
                  color: profile.titleColor || undefined
                }}
                onClick={() => handleClick("bio")}
              >
                {profile.bio || "Sua bio aqui..."}
              </p>

              {/* Buttons */}
              <div className="space-y-3 mb-6">
                {buttons.map((link) => {
                  // Use global styles from profile
                  const bgColor = profile.globalButtonBgColor;
                  const textColor = profile.globalButtonTextColor;
                  const borderRadius = profile.globalButtonBorderRadius || "rounded-xl";
                  const buttonStyle = profile.globalButtonStyle || "filled";
                  const hasCustomColors = bgColor || textColor;
                  return (
                    <button
                      key={link.id}
                      type="button"
                      className={cn(
                        "w-full py-3 px-4 font-medium transition-all relative flex items-center justify-center",
                        interactive && "hover:scale-[1.02] cursor-pointer",
                        borderRadius,
                        !hasCustomColors && (
                          buttonStyle === "filled"
                            ? cn(template.styles.buttonBg, template.styles.buttonText)
                            : cn("bg-transparent border-2", template.styles.textColor)
                        ),
                        buttonStyle === "outline" && hasCustomColors && "bg-transparent border-2"
                      )}
                      style={{
                        fontFamily: profile.titleFont || "Inter",
                        ...(hasCustomColors ? {
                          backgroundColor: buttonStyle === "filled" ? (bgColor || undefined) : "transparent",
                          color: textColor || undefined,
                          borderColor: buttonStyle === "outline" ? (bgColor || undefined) : undefined,
                        } : {})
                      }}
                      onClick={() => handleClick("link", link.id)}
                    >
                      {link.thumbnailUrl ? (
                        <img
                          src={link.thumbnailUrl}
                          alt=""
                          className="absolute left-2 w-10 h-10 rounded-lg object-cover"
                        />
                      ) : link.icon && (
                        <span className="absolute left-4">
                          {renderPreviewIcon(link.icon)}
                        </span>
                      )}
                      <span className="text-sm">{link.title}</span>
                    </button>
                  );
                })}
                {buttons.length === 0 && (
                  <div
                    className={cn(
                      "w-full py-3 px-4 rounded-xl text-center opacity-50 border-2 border-dashed border-current",
                      template.styles.textColor
                    )}
                  >
                    Adicione seus botões
                  </div>
                )}
              </div>

              {/* Social Icons */}
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
                          interactive && "hover:scale-110 cursor-pointer"
                        )}
                        style={{
                          backgroundColor: socialBgColor,
                          color: socialTextColor
                        }}
                        onClick={() => handleClick("link", social.id)}
                      >
                        {renderPreviewIcon(social.icon, "md") || "🔗"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Standard Layout */
        <div className="p-6 pt-10">
          {/* Avatar */}
          <div
            className={cn(
              "flex justify-center mb-4 transition-opacity",
              interactive && "cursor-pointer hover:opacity-80"
            )}
            onClick={() => handleClick("avatar")}
          >
            <Avatar
              className={cn("w-24 h-24", template.styles.avatarBorder)}
            >
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback
                className={cn(template.styles.cardBg, template.styles.textColor)}
              >
                {profile.displayName?.charAt(0) || profile.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Username */}
          <p
            className={cn(
              "text-center text-sm mb-1 transition-opacity",
              interactive && "cursor-pointer hover:opacity-80",
              !profile.titleColor && template.styles.textColor
            )}
            style={{
              fontFamily: profile.titleFont || "Inter",
              color: profile.titleColor || undefined
            }}
            onClick={() => handleClick("username")}
          >
            @{profile.handle || profile.username || "usuario"}
          </p>

          {/* Display Name */}
          <h1
            className={cn(
              "text-center font-bold mb-2",
              profile.titleSize === "small" ? "text-lg" : "text-xl",
              !profile.titleColor && template.styles.textColor
            )}
            style={{
              fontFamily: profile.titleFont || "Inter",
              color: profile.titleColor || undefined
            }}
          >
            {profile.displayName || "Nome de Exibição"}
          </h1>

          {/* Bio */}
          <p
            className={cn(
              "text-center text-sm mb-6 transition-opacity opacity-80",
              interactive && "cursor-pointer hover:opacity-80",
              !profile.titleColor && template.styles.textColor
            )}
            style={{
              fontFamily: profile.titleFont || "Inter",
              color: profile.titleColor || undefined
            }}
            onClick={() => handleClick("bio")}
          >
            {profile.bio || "Sua bio aqui..."}
          </p>

          {/* Buttons */}
          <div className="space-y-3 mb-6">
            {buttons.map((link) => {
              // Use global styles from profile
              const bgColor = profile.globalButtonBgColor;
              const textColor = profile.globalButtonTextColor;
              const borderRadius = profile.globalButtonBorderRadius || "rounded-xl";
              const buttonStyle = profile.globalButtonStyle || "filled";
              const hasCustomColors = bgColor || textColor;
              return (
                <button
                  key={link.id}
                  type="button"
                  className={cn(
                    "w-full py-3 px-4 font-medium transition-all relative flex items-center justify-center",
                    interactive && "hover:scale-[1.02] cursor-pointer",
                    borderRadius,
                    !hasCustomColors && (
                      buttonStyle === "filled"
                        ? cn(template.styles.buttonBg, template.styles.buttonText)
                        : cn("bg-transparent border-2", template.styles.textColor)
                    ),
                    buttonStyle === "outline" && hasCustomColors && "bg-transparent border-2"
                  )}
                  style={{
                    fontFamily: profile.titleFont || "Inter",
                    ...(hasCustomColors ? {
                      backgroundColor: buttonStyle === "filled" ? (bgColor || undefined) : "transparent",
                      color: textColor || undefined,
                      borderColor: buttonStyle === "outline" ? (bgColor || undefined) : undefined,
                    } : {})
                  }}
                  onClick={() => handleClick("link", link.id)}
                >
                  {link.thumbnailUrl ? (
                    <img
                      src={link.thumbnailUrl}
                      alt=""
                      className="absolute left-2 w-10 h-10 rounded-lg object-cover"
                    />
                  ) : link.icon && (
                    <span className="absolute left-4">
                      {renderPreviewIcon(link.icon)}
                    </span>
                  )}
                  <span className="text-sm">{link.title}</span>
                </button>
              );
            })}
            {buttons.length === 0 && (
              <div
                className={cn(
                  "w-full py-3 px-4 rounded-xl text-center opacity-50 border-2 border-dashed border-current",
                  template.styles.textColor
                )}
              >
                Adicione seus botões
              </div>
            )}
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
                      interactive && "hover:scale-110 cursor-pointer"
                    )}
                    style={{
                      backgroundColor: socialBgColor,
                      color: socialTextColor
                    }}
                    onClick={() => handleClick("link", social.id)}
                  >
                    {renderPreviewIcon(social.icon, "md") || "🔗"}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
