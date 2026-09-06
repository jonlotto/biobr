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
  const hasBanner = template.hasBanner;
  const hasCurvedBanner = template.hasCurvedBanner;

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

  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className={cn("flex-1", !hasCustomBackground && !hasTemplateImageBg && template.styles.background)}
        style={backgroundStyle}
      >
        {hasBanner && profile ? (
          // Banner Layout - centered container for consistent look
          <div className="min-h-full flex flex-col items-center">
            <div className="w-full max-w-md">
              {/* Banner Container with wrapper for avatar positioning */}
              <div className="relative w-full">
                {/* Inner container with overflow-hidden for banner only */}
                <div className={cn(
                  "relative w-full overflow-hidden",
                  hasCurvedBanner ? "aspect-[8/5]" : "aspect-[8/5]"
                )}>
                  {/* Banner Image - fills entire container */}
                  {profile.banner_url ? (
                    <img
                      src={profile.banner_url}
                      alt="Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
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
                        fill={globalBgColor && !globalBgColor.startsWith("linear-gradient") ? globalBgColor : "#ffffff"}
                      />
                    </svg>
                  )}
                </div>
                
                {/* Avatar overlapping banner - OUTSIDE overflow-hidden */}
                <div className={cn(
                  "absolute left-1/2 transform -translate-x-1/2 z-10",
                  hasCurvedBanner ? "bottom-0 translate-y-1/2" : "-bottom-12"
                )}>
                  <Avatar className={cn("w-24 h-24 border-4 border-white", template.styles.avatarBorder, hasCurvedBanner && "shadow-lg")}>
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className={cn(template.styles.cardBg, template.styles.textColor)}>
                      {(profile.display_name || profile.username)?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Content - Spacer for avatar (no background) */}
              <div className="pt-16">
                {/* Inner content container with background */}
                <div 
                  className={cn("pb-12 px-4", !hasCustomBackground && template.styles.contentBg)}
                >
                {/* Profile Info */}
                <div className="text-center mb-8 animate-fade-in">
                  <p 
                    className={cn(
                      "text-sm mb-1 opacity-70",
                      !(profile as any).title_color && template.styles.textColor
                    )}
                    style={{ 
                      fontFamily: (profile as any).title_font || "Inter",
                      color: (profile as any).title_color || undefined
                    }}
                  >
                    @{(profile as any).handle || profile.username}
                  </p>
                  <h1 
                    className={cn(
                      "font-bold mb-2", 
                      (profile as any).title_size === "small" ? "text-xl" : "text-2xl",
                      !(profile as any).title_color && template.styles.textColor
                    )}
                    style={{
                      fontFamily: (profile as any).title_font || "Inter",
                      color: (profile as any).title_color || undefined
                    }}
                  >
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.bio && (
                    <p 
                      className={cn(
                        "text-sm max-w-xs mx-auto opacity-80",
                        !(profile as any).title_color && template.styles.textColor
                      )}
                      style={{ 
                        fontFamily: (profile as any).title_font || "Inter",
                        color: (profile as any).title_color || undefined
                      }}
                    >
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Links */}
                <div className="space-y-4">
                  {buttons.length === 0 && socials.length === 0 ? (
                    <div className="text-center py-8 animate-fade-in">
                      <p className="text-muted-foreground">
                        Nenhum link disponível ainda.
                      </p>
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
                        buttonStyle={profile?.global_button_style as "filled" | "outline" || "filled"}
                        fontFamily={(profile as any)?.title_font || "Inter"}
                      />
                    ))
                  )}
                </div>

                {/* Social Icons */}
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
                          color: profile?.global_button_text_color || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined)
                        }}
                      >
                        {renderIcon(social.icon || undefined, "w-5 h-5")}
                      </a>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Standard Layout
          <div className="container mx-auto px-4 py-12 max-w-md">
            {/* Profile Header */}
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
            <div className="mt-8 space-y-4">
              {buttons.length === 0 && socials.length === 0 ? (
                <div className="text-center py-8 animate-fade-in">
                  <p className="text-muted-foreground">
                    Nenhum link disponível ainda.
                  </p>
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
                    buttonStyle={profile?.global_button_style as "filled" | "outline" || "filled"}
                    fontFamily={(profile as any)?.title_font || "Inter"}
                  />
                ))
              )}
            </div>

            {/* Social Icons */}
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
                      color: profile?.global_button_text_color || (template.styles.buttonText?.includes("white") ? "#ffffff" : undefined)
                    }}
                  >
                    {renderIcon(social.icon || undefined, "w-5 h-5")}
                  </a>
                ))}
              </div>
            )}
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