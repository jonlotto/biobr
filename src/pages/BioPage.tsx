import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProfileHeader from "@/components/ProfileHeader";
import LinkCard, { renderIcon } from "@/components/LinkCard";
import { Link2 } from "lucide-react";
import { templates } from "@/data/templates";
import biobrLogo from "@/assets/biobr-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { extractSubdomain } from "@/utils/subdomain";
import { resolveHeaderLayout } from "@/lib/headerLayouts";
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
  const hasCurvedBanner = template.hasCurvedBanner;
  const headerLayout = resolveHeaderLayout((profile as any)?.header_layout ?? null, !!template.hasBanner);

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

  // Separate links by type
  const buttons = links.filter(l => l.link_type !== "social");
  const socials = links.filter(l => l.link_type === "social");

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

  const renderLinksAndSocials = () => (
    <>
      <div className="space-y-4">
        {buttons.length === 0 && socials.length === 0 ? (
          <div className="text-center py-8 animate-fade-in">
            <p className="text-muted-foreground">Nenhum link disponível ainda.</p>
          </div>
        ) : (
          buttons.map((link, index) => (
            <LinkCard
              key={link.id}
              title={link.title}
              url={link.url}
              icon={link.icon || undefined}
              thumbnailUrl={(link as any).thumbnail_url}
              delay={index * 100}
              buttonBgColor={profile?.global_button_bg_color || template.styles.primaryColor}
              buttonTextColor={profile?.global_button_text_color || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined)}
              buttonBorderRadius={profile?.global_button_border_radius || undefined}
              buttonStyle={(profile?.global_button_style as "filled" | "outline") || "filled"}
              fontFamily={(profile as any)?.title_font || "Inter"}
            />
          ))
        )}
      </div>

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
                backgroundColor: profile?.global_button_bg_color || template.styles.primaryColor,
                color: profile?.global_button_text_color || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined),
              }}
            >
              {renderIcon(social.icon || undefined, "w-5 h-5")}
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
        {headerLayout === "banner" && profile ? (
          // Banner Layout - cover image/gradient with rounded bottom corners,
          // a large circular avatar overlapping its bottom edge. Name, bio
          // and buttons render below, outside the banner area.
          <div className="min-h-full flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="relative w-full">
                <div
                  className={cn("relative w-full overflow-hidden", !hasCurvedBanner && "rounded-b-[32px]")}
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

                  {hasCurvedBanner && (
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
                        "font-bold mb-2",
                        (profile as any).title_size === "small" ? "text-xl" : "text-2xl",
                        !(profile as any).title_color && template.styles.textColor,
                      )}
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      {profile.display_name || profile.username}
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
        ) : headerLayout === "banner-full" && profile ? (
          // Banner Full Layout - the cover image/gradient fills almost the
          // whole initial viewport, with a dark fade at its base; a small
          // avatar, name and bio sit on top of that fade, in light text.
          // Buttons render below, outside the image.
          <div className="min-h-full flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
                {profile.banner_url ? (
                  <img src={profile.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 w-full h-full" style={{ background: bannerGradient }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-6 pb-5 text-center">
                  <Avatar className="w-12 h-12 border-2 border-white/70">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className={cn(template.styles.cardBg, template.styles.textColor)}>
                      {(profile.display_name || profile.username)?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h1
                    className="font-bold text-lg text-white drop-shadow-sm"
                    style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                  >
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.bio && (
                    <p
                      className="text-sm max-w-xs text-white/90 drop-shadow-sm"
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 pt-6 pb-12">{renderLinksAndSocials()}</div>
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
                      className={cn("truncate font-bold", !(profile as any).title_color && template.styles.textColor)}
                      style={{ fontFamily: (profile as any).title_font || "Inter", color: (profile as any).title_color || undefined }}
                    >
                      {profile.display_name || profile.username}
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