import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProfileHeader from "@/components/ProfileHeader";
import { renderIcon } from "@/components/LinkCard";
import { Link2, ChevronRight } from "lucide-react";
import { templates } from "@/data/templates";
import biobrLogo from "@/assets/biobr-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { extractSubdomain } from "@/utils/subdomain";
import { resolveHeaderLayout } from "@/lib/headerLayouts";
import { resolveButtonLayout } from "@/lib/buttonLayouts";
import { hexToRgba } from "@/lib/color";
import { VerifiedBadge } from "@/components/icons/VerifiedBadge";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type LinkType = Tables<"links">;

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Don't block on error
    img.src = src;
  });
};

const BioPage = () => {
  const { username: pathUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  // Priority: subdomain > path parameter
  const subdomain = extractSubdomain();
  const username = subdomain || pathUsername;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username?.toLowerCase())
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch active links
      const { data: linksData } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", profileData.user_id)
        .eq("is_active", true)
        .order("position", { ascending: true });

      setLinks(linksData || []);

      // Preload background image if exists
      const bgImage = (profileData as any).global_background_image;
      const templateData = templates.find(t => t.slug === profileData.template_slug) || templates[0];
      const templateBgImage = templateData.styles.backgroundType === "image" 
        ? templateData.styles.backgroundImage 
        : null;
      
      const imageToPreload = bgImage || templateBgImage;
      
      if (imageToPreload) {
        setImageLoading(true);
        await preloadImage(imageToPreload);
        setImageLoading(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading || imageLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-8 h-8 bg-primary/30 rounded-full animate-ping" />
          <div className="w-6 h-6 bg-primary rounded-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="glass-strong rounded-3xl p-8 max-w-md mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">
              Página não encontrada
            </h1>
            <p className="text-muted-foreground mb-6">
              O usuário @{username} não existe ou não tem uma página pública.
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const template = templates.find((t) => t.slug === profile?.template_slug) || templates[0];
  const headerLayout = resolveHeaderLayout(
    (profile as any)?.header_layout ?? null,
    !!template.hasBanner,
    !!template.hasCurvedBanner,
  );

  // Border color used to separate the avatar from the banner behind it -
  // matches the page's own solid background color so the avatar ring reads
  // as a continuation of the content area, falling back to white when the
  // page background is a gradient/image (a color a border can't render).
  const pageBorderColor =
    profile?.global_background_color && !profile.global_background_color.startsWith("linear-gradient")
      ? profile.global_background_color
      : "#ffffff";

  // Fallback fill for any banner-style layout when the user hasn't uploaded a
  // banner image yet - a diagonal gradient built from the theme's own colors.
  const bannerGradient = `linear-gradient(135deg, ${template.styles.primaryColor}, ${template.styles.accentColor})`;

  // "Selo Editorial" always reads as a dark banner regardless of theme - see
  // the same comment in BioPreviewContent.tsx.
  const editorialBadgeBg =
    profile?.global_background_color && !profile.global_background_color.startsWith("linear-gradient")
      ? profile.global_background_color
      : "#111827";

  // Separate links by type
  const buttons = links.filter(l => l.link_type !== "social");
  const socials = links.filter(l => l.link_type === "social");

  const resolvedButtonLayout = resolveButtonLayout((profile as any)?.button_layout ?? null);
  const linkBgColor = profile?.global_button_bg_color || template.styles.primaryColor;
  const linkBgOpacity = (profile as any)?.global_button_bg_opacity ?? 100;
  const linkTextColor = profile?.global_button_text_color || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined);
  // Style is fixed to filled, and shape is fixed per button layout (each one
  // already embeds its own visual form) - these no longer read
  // profile.global_button_style/border_radius (kept on the profile only for
  // backward compatibility with old rows). linkBorderRadius here is the
  // default full-pill radius (overlap-alternate, pill-round-icon);
  // pill-square-icon overrides it to a small radius in renderPillLinks
  // below, so the two "pill" layouts read as visually distinct.
  const linkBorderRadius = "rounded-full";
  const linkFontFamily = (profile as any)?.title_font || "Inter";

  // Perceived luminance of a solid hex fill - used only by the "banner"
  // layout to decide whether its title pill should be light-on-dark or
  // dark-on-light, since that card's own background is the button's actual
  // fill color, always a real hex here (custom color or the theme's own).
  const isLightHex = (hex: string): boolean => {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  };

  const linkFillStyle: React.CSSProperties = {
    backgroundColor: hexToRgba(linkBgColor, linkBgOpacity),
    color: linkTextColor,
  };

  // Build background style with global color/image override or template image
  const globalBgColor = profile?.global_background_color;
  const globalBgImage = (profile as any)?.global_background_image;
  const textColor = profile?.global_button_text_color || template.styles.textColor;

  const getBackgroundStyle = (): React.CSSProperties | undefined => {
    // 1. Custom background image has highest priority
    if (globalBgImage) {
      return {
        backgroundImage: `url(${globalBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    // 2. Custom color or gradient
    if (globalBgColor) {
      if (globalBgColor.startsWith("linear-gradient")) {
        return { background: globalBgColor };
      }
      return { backgroundColor: globalBgColor };
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
  const hasCustomBackground = !!globalBgImage || !!globalBgColor;
  const hasTemplateImageBg = template.styles.backgroundType === "image" && template.styles.backgroundImage;

  const renderPillLinks = (shape: "square" | "round") => {
    // "square" gets small rounded corners (not a full pill) so it reads
    // visually distinct from "round", whose button IS a full pill/capsule.
    const pillRadius = shape === "round" ? linkBorderRadius : "rounded-none";
    return (
    <div className="space-y-4">
      {buttons.map((link, index) => {
        const thumbnailUrl = (link as any).thumbnail_url as string | null | undefined;
        const hasMedia = !!(thumbnailUrl || link.icon);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group relative flex w-full items-center justify-center px-6 py-4 font-medium transition-all hover:scale-[1.02] animate-slide-up opacity-0",
              pillRadius,
            )}
            style={{ animationDelay: `${index * 100}ms`, fontFamily: linkFontFamily, ...linkFillStyle }}
          >
            {hasMedia && (
              <span
                className={cn(
                  "absolute left-2 flex h-10 w-10 items-center justify-center overflow-hidden",
                  shape === "round" ? "rounded-full" : "rounded-none",
                )}
              >
                {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderIcon(link.icon || undefined, "w-8 h-8 shrink-0", (link as any).icon_variant || undefined)}
              </span>
            )}
            <span className="text-sm font-medium">{link.title}</span>
          </a>
        );
      })}
    </div>
    );
  };

  const renderOverlapAlternateLinks = () => (
    <div className="space-y-5">
      {buttons.map((link, index) => {
        const thumbnailUrl = (link as any).thumbnail_url as string | null | undefined;
        const hasMedia = !!(thumbnailUrl || link.icon);
        const sideLeft = index % 2 === 0;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group relative flex w-full items-center justify-center px-6 py-4 font-medium transition-all hover:scale-[1.02] animate-slide-up opacity-0",
              linkBorderRadius,
            )}
            style={{ animationDelay: `${index * 100}ms`, fontFamily: linkFontFamily, ...linkFillStyle }}
          >
            {hasMedia && (
              <span
                className={cn(
                  "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full shadow-md",
                  sideLeft ? "-left-3" : "-right-3",
                )}
                style={{ border: `4px solid ${pageBorderColor}`, ...linkFillStyle }}
              >
                {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderIcon(link.icon || undefined, "w-5 h-5 shrink-0", (link as any).icon_variant || undefined)}
              </span>
            )}
            <span className="text-sm font-medium">{link.title}</span>
          </a>
        );
      })}
    </div>
  );

  const renderCardOverlapAlternateLinks = () => (
    // Wide horizontal pill, fully rounded ends. The icon sits in its own
    // circle, mostly embedded at one end but slightly larger than the
    // button's own height, so it pokes out a bit on every outer side (top,
    // bottom, and past the edge) instead of just overlapping sideways.
    // Minimal by design: no drop shadow, no extra ornamentation beyond the
    // contrast ring that separates the icon from the button underneath it.
    <div className="space-y-4">
      {buttons.map((link, index) => {
        const thumbnailUrl = (link as any).thumbnail_url as string | null | undefined;
        const hasMedia = !!(thumbnailUrl || link.icon);
        const sideLeft = index % 2 === 0;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "relative flex w-full items-center rounded-full transition-all hover:scale-[1.01] animate-slide-up opacity-0",
              sideLeft ? "pl-16 pr-6" : "pl-6 pr-16",
            )}
            style={{ height: 56, animationDelay: `${index * 100}ms`, fontFamily: linkFontFamily, ...linkFillStyle }}
          >
            <span className="flex-1 truncate text-left text-sm font-medium">{link.title}</span>

            {hasMedia && (
              <span
                className={cn(
                  "absolute top-1/2 flex h-[68px] w-[68px] -translate-y-1/2 items-center justify-center overflow-hidden rounded-full",
                  sideLeft ? "-left-2" : "-right-2",
                )}
                style={{ border: `3px solid ${pageBorderColor}`, ...linkFillStyle }}
              >
                {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderIcon(link.icon || undefined, "w-5 h-5 shrink-0", (link as any).icon_variant || undefined)}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );

  const renderUnifiedCardLinks = () => (
    <div className={cn("overflow-hidden rounded-2xl shadow-sm", template.styles.cardBg)}>
      {buttons.map((link, index) => {
        const thumbnailUrl = (link as any).thumbnail_url as string | null | undefined;
        const hasMedia = !!(thumbnailUrl || link.icon);
        const isLast = index === buttons.length - 1;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/5",
              !isLast && "border-b border-border/60",
            )}
            style={{ fontFamily: linkFontFamily }}
          >
            {hasMedia && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={linkFillStyle}>
                {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : renderIcon(link.icon || undefined, "w-5 h-5 shrink-0", (link as any).icon_variant || undefined)}
              </span>
            )}
            <span className={cn("flex-1 truncate text-sm font-medium", template.styles.textColor)}>{link.title}</span>
            <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-50", template.styles.textColor)} />
          </a>
        );
      })}
    </div>
  );

  const renderBannerLinks = () => (
    <div className="space-y-4">
      {buttons.map((link, index) => {
        const thumbnailUrl = (link as any).thumbnail_url as string | null | undefined;
        const hasImage = !!thumbnailUrl;
        // No image: the card's own fill color decides the pill's contrast
        // scheme. With an image, the photo's content is unknown ahead of
        // time, so the pill always defaults to the safer light-on-dark form.
        const pillIsLight = hasImage || !isLightHex(linkBgColor);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group relative block h-[130px] w-full overflow-hidden rounded-[14px] transition-all hover:scale-[1.01] animate-slide-up opacity-0",
            )}
            style={{ animationDelay: `${index * 100}ms`, ...(!hasImage ? linkFillStyle : {}) }}
          >
            {hasImage ? (
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              link.icon &&
              renderIcon(
                link.icon || undefined,
                "absolute inset-0 m-auto w-20 h-20 opacity-35 pointer-events-none",
                (link as any).icon_variant || undefined,
              )
            )}

            <span
              className={cn(
                "absolute bottom-2.5 left-2.5 max-w-[calc(100%-20px)] truncate rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur-sm",
                pillIsLight ? "bg-white/85 text-neutral-900" : "bg-black/70 text-white",
              )}
              style={{ fontFamily: linkFontFamily }}
            >
              {link.title}
            </span>
          </a>
        );
      })}
    </div>
  );

  const renderLinksAndSocials = () => (
    <>
      {buttons.length === 0 && socials.length === 0 ? (
        <div className="text-center py-8 animate-fade-in">
          <p className="text-muted-foreground">Nenhum link disponível ainda.</p>
        </div>
      ) : buttons.length > 0 ? (
        resolvedButtonLayout === "unified-card"
          ? renderUnifiedCardLinks()
          : resolvedButtonLayout === "overlap-alternate"
            ? renderOverlapAlternateLinks()
            : resolvedButtonLayout === "card-overlap-alternate"
              ? renderCardOverlapAlternateLinks()
              : resolvedButtonLayout === "banner"
                ? renderBannerLinks()
                : renderPillLinks(resolvedButtonLayout === "pill-round-icon" ? "round" : "square")
      ) : null}

      {socials.length > 0 && (
        <div className="flex justify-center gap-4 flex-wrap mt-6 animate-fade-in">
          {socials.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              style={{
                backgroundColor: hexToRgba(linkBgColor, linkBgOpacity),
                color: profile?.global_button_text_color || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined),
              }}
            >
              {renderIcon(social.icon || undefined, "w-5 h-5", (social as any).icon_variant || undefined)}
            </a>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className={cn("flex-1", !hasCustomBackground && !hasTemplateImageBg && template.styles.background)}
        style={backgroundStyle}
      >
        {(headerLayout === "banner" || headerLayout === "banner-wave") && profile ? (
          // Banner / Banner Wave Layout - cover image/gradient with a large
          // circular avatar overlapping its bottom edge. The base is either
          // straight rounded corners ("banner") or a curved wave cut
          // ("banner-wave"). Name, bio and buttons render below, outside the
          // banner area.
          <div className="min-h-full flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="relative w-full">
                <div
                  className={cn("relative w-full overflow-hidden", headerLayout !== "banner-wave" && "rounded-b-[32px]")}
                  style={{ height: 170 }}
                >
                  {profile.banner_url ? (
                    <img
                      src={profile.banner_url}
                      alt="Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
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
                        fill={globalBgColor && !globalBgColor.startsWith("linear-gradient") ? globalBgColor : "#ffffff"}
                      />
                    </svg>
                  )}
                </div>

                <div className="absolute left-1/2 bottom-0 z-10 -translate-x-1/2 translate-y-1/2">
                  <Avatar
                    className={cn("w-[100px] h-[100px] shadow-lg", template.styles.avatarBorder)}
                    style={{ border: `4px solid ${pageBorderColor}` }}
                  >
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className={cn(template.styles.cardBg, template.styles.textColor)}>
                      {(profile.display_name || profile.username)?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="pt-16">
                <div className={cn("pb-12 px-4", !hasCustomBackground && template.styles.contentBg)}>
                  <div className="text-center mb-8 animate-fade-in">
                    <p
                      className={cn("text-sm mb-1 opacity-70", !(profile as any).title_color && template.styles.textColor)}
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      @{(profile as any).handle || profile.username}
                    </p>
                    <h1
                      className={cn(
                        "flex items-center justify-center gap-1 font-bold mb-2",
                        (profile as any).title_size === "small" ? "text-xl" : "text-2xl",
                        !(profile as any).title_color && template.styles.textColor,
                      )}
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      <span className="truncate">{profile.display_name || profile.username}</span>
                      {(profile as any).show_verified_badge && <VerifiedBadge className="h-4 w-4 shrink-0" />}
                    </h1>
                    {profile.bio && (
                      <p
                        className={cn("text-sm max-w-xs mx-auto opacity-80", !(profile as any).title_color && template.styles.textColor)}
                        style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                      >
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {renderLinksAndSocials()}
                </div>
              </div>
            </div>
          </div>
        ) : headerLayout === "banner-card" && profile ? (
          // Banner Card Layout - a colored cover with no round avatar; a
          // floating elevated card overlaps the transition into the
          // content, holding a small square logo, name and short subtitle.
          // Buttons render below the card.
          <div className="min-h-full flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="relative w-full overflow-hidden" style={{ height: 190 }}>
                {profile.banner_url ? (
                  <img src={profile.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 w-full h-full" style={{ background: bannerGradient }} />
                )}
              </div>

              <div className="px-4">
                <div className={cn("relative z-10 -mt-10 flex items-center gap-3 rounded-2xl p-4 shadow-lg", template.styles.cardBg)}>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted-foreground/20">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Link2 className={cn("h-5 w-5 opacity-70", template.styles.textColor)} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h1
                      className={cn("flex items-center gap-1 truncate font-bold", !(profile as any).title_color && template.styles.textColor)}
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      <span className="truncate">{profile.display_name || profile.username}</span>
                      {(profile as any).show_verified_badge && <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />}
                    </h1>
                    <p
                      className={cn("truncate text-sm opacity-70", !(profile as any).title_color && template.styles.textColor)}
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      {profile.bio || `@${(profile as any).handle || profile.username}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-6 pb-12">{renderLinksAndSocials()}</div>
            </div>
          </div>
        ) : headerLayout === "editorial-badge" && profile ? (
          // Editorial Badge Layout - a solid dark section with a stamped
          // circular avatar on the left and an uppercase title + longer
          // description on the right, side by side. Self-contained: no
          // separate @handle line below. Buttons render below, outside the
          // dark section.
          <div className="min-h-full flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="px-4 py-8" style={{ backgroundColor: editorialBadgeBg }}>
                <div className="flex items-center gap-4">
                  <Avatar
                    className="h-16 w-16 shrink-0"
                    style={{ boxShadow: `0 0 0 3px ${editorialBadgeBg}, 0 0 0 5px rgba(255,255,255,0.55)` }}
                  >
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className={cn(template.styles.cardBg, template.styles.textColor)}>
                      {(profile.display_name || profile.username)?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left">
                    <h1
                      className="flex items-center gap-1 truncate text-base font-bold uppercase tracking-wide text-white"
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      <span className="truncate">{profile.display_name || profile.username}</span>
                      {(profile as any).show_verified_badge && <VerifiedBadge className="h-4 w-4 shrink-0" />}
                    </h1>
                    <p
                      className="mt-1 text-[11px] leading-snug text-white/60"
                      style={{ fontFamily: (profile as any).title_font || "Inter" }}
                    >
                      {profile.bio || "Sua descrição aqui..."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-6 pb-12">{renderLinksAndSocials()}</div>
            </div>
          </div>
        ) : (
          // Classic Layout
          <div className="container mx-auto px-4 py-12 max-w-md">
            {profile && (
              <ProfileHeader
                displayName={profile.display_name || profile.username}
                username={profile.username}
                handle={(profile as any).handle}
                bio={profile.bio || undefined}
                avatarUrl={profile.avatar_url || undefined}
                titleFont={(profile as any).title_font || "Inter"}
                titleColor={(profile as any).title_color}
                titleSize={(profile as any).title_size || "large"}
                showVerifiedBadge={(profile as any).show_verified_badge || false}
              />
            )}

            {/* Links */}
            <div className="mt-8">{renderLinksAndSocials()}</div>
          </div>
        )}
      </div>

      {/* Fixed Footer - Full Width */}
      <footer className="w-full bg-black py-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Criado por</span>
            <img src={biobrLogo} alt="VtrineBio" className="h-5" />
          </div>
          <span className="text-white/60 text-xs">
            © VtrineBio 2026 - Todos os direitos reservados
          </span>
        </div>
      </footer>
    </div>
  );
};

export default BioPage;