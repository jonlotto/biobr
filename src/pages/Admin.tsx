import { useState, ComponentType, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEditorState, EditorLink } from "@/hooks/useEditorState";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ProfileHeaderCard } from "@/components/admin/ProfileHeaderCard";
import { SocialIconsSection } from "@/components/admin/SocialIconsSection";
import { AdminLinksList } from "@/components/admin/AdminLinksList";
import { EditorPreview } from "@/components/editor/EditorPreview";
import { ButtonEditDrawer } from "@/components/editor/ButtonEditDrawer";
import { SocialAddModal } from "@/components/editor/SocialAddModal";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2 } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { TwitterIcon } from "@/components/icons/TwitterIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  urlTemplate: string;
  isPhone?: boolean;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: "instagram", name: "Instagram", icon: "instagram-icon", Icon: InstagramIcon, urlTemplate: "https://instagram.com/{username}" },
  { id: "tiktok", name: "TikTok", icon: "tiktok-icon", Icon: TikTokIcon, urlTemplate: "https://tiktok.com/@{username}" },
  { id: "youtube", name: "YouTube", icon: "youtube-icon", Icon: YouTubeIcon, urlTemplate: "https://youtube.com/@{username}" },
  { id: "twitter", name: "Twitter/X", icon: "twitter-icon", Icon: TwitterIcon, urlTemplate: "https://twitter.com/{username}" },
  { id: "whatsapp", name: "WhatsApp", icon: "whatsapp-icon", Icon: WhatsAppIcon, urlTemplate: "https://wa.me/{phone}", isPhone: true },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin-icon", Icon: LinkedInIcon, urlTemplate: "https://linkedin.com/in/{username}" },
  { id: "email", name: "Email", icon: "email-icon", Icon: EmailIcon, urlTemplate: "mailto:{email}" },
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const {
    profile,
    links,
    isLoading,
    isSaving,
    isDirty,
    updateProfile,
    addLink,
    updateLink,
    deleteLink,
    duplicateLink,
    reorderLinks,
    save,
    selectedLinkId,
    setSelectedLinkId,
  } = useEditorState();

  const [showAddSocial, setShowAddSocial] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const buttons = links.filter((l) => l.linkType === "button");
  const socials = links.filter((l) => l.linkType === "social");
  const selectedLink = links.find((l) => l.id === selectedLinkId);

  const handleAddLink = () => {
    const newId = addLink({
      title: "Novo Link",
      url: "https://",
      icon: null,
      thumbnailUrl: null,
      linkType: "button",
      style: "filled",
      isActive: true,
      buttonBgColor: null,
      buttonTextColor: null,
      buttonBorderRadius: "rounded-xl",
    });
    setSelectedLinkId(newId);
  };

  const handleOpenSocialModal = () => {
    // Open a simple platform selector or default to first platform
    setSelectedPlatform(SOCIAL_PLATFORMS[0]);
    setShowAddSocial(true);
  };

  const handleAddSocial = (username: string) => {
    if (!selectedPlatform) return;
    
    let url = selectedPlatform.urlTemplate;
    if (selectedPlatform.isPhone) {
      url = url.replace("{phone}", username.replace(/\D/g, ""));
    } else {
      url = url.replace("{username}", username);
    }

    addLink({
      title: selectedPlatform.name,
      url,
      icon: selectedPlatform.icon,
      thumbnailUrl: null,
      linkType: "social",
      style: "filled",
      isActive: true,
      buttonBgColor: null,
      buttonTextColor: null,
      buttonBorderRadius: "rounded-full",
    });
    setShowAddSocial(false);
    setSelectedPlatform(null);
  };

  const handleToggleLink = (id: string, isActive: boolean) => {
    updateLink(id, { isActive });
  };

  const handleSaveLink = (data: Pick<EditorLink, "title" | "url" | "icon" | "isActive"> & { thumbnailUrl?: string | null }) => {
    if (selectedLinkId) {
      updateLink(selectedLinkId, { ...data, thumbnailUrl: data.thumbnailUrl ?? null });
      setSelectedLinkId(null);
    }
  };

  const handlePreviewClick = (type: string, linkId?: string) => {
    if (type === "link" && linkId) {
      setSelectedLinkId(linkId);
    } else if (type === "avatar" || type === "username" || type === "bio") {
      navigate("/editor");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar activeSection="links" username={profile.username} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-bold">Seus Links</h1>
            {isDirty && (
              <Button
                onClick={save}
                disabled={isSaving}
                size="sm"
                className="rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            )}
          </div>

          {/* Profile Header Card */}
          <ProfileHeaderCard
            profile={profile}
            onUpdateUsername={(newUsername) => updateProfile({ username: newUsername })}
            onUpdateHandle={(newHandle) => updateProfile({ handle: newHandle })}
          />

          {/* Add Link Button */}
          <Button
            onClick={handleAddLink}
            className="w-full rounded-xl h-14 text-lg font-medium mb-6 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Link
          </Button>

          {/* Links List */}
          {buttons.length > 0 ? (
            <AdminLinksList
              links={buttons}
              onReorder={reorderLinks}
              onToggle={handleToggleLink}
              onEdit={setSelectedLinkId}
              onDelete={deleteLink}
              onDuplicate={duplicateLink}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Você ainda não tem links.</p>
              <p className="text-sm">Clique em "Adicionar Link" para começar.</p>
            </div>
          )}

          {/* Social Icons Section */}
          <SocialIconsSection
            socials={socials}
            platforms={SOCIAL_PLATFORMS}
            onSelectPlatform={(platform, existingSocial) => {
              setSelectedPlatform(platform);
              setShowAddSocial(true);
            }}
            onDeleteSocial={(linkId) => {
              deleteLink(linkId);
            }}
          />
        </div>
      </main>

      {/* Preview Panel */}
      <aside className="w-[400px] border-l border-border bg-muted/30 flex items-center justify-center p-6 hidden lg:flex">
        <EditorPreview
          profile={profile}
          links={links}
          onClickElement={handlePreviewClick}
        />
      </aside>

      {/* Button Edit Drawer */}
      <ButtonEditDrawer
        open={!!selectedLinkId}
        onClose={() => setSelectedLinkId(null)}
        onSave={handleSaveLink}
        initialData={selectedLink || null}
      />

      {/* Social Add Modal */}
      <SocialAddModal
        open={showAddSocial}
        onClose={() => {
          setShowAddSocial(false);
          setSelectedPlatform(null);
        }}
        onSave={handleAddSocial}
        platform={selectedPlatform}
      />
    </div>
  );
};

export default Admin;
