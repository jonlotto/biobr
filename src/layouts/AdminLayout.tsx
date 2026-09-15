import { useEffect, useState, ComponentType, SVGProps } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEditorState, EditorLink, CardItem } from "@/hooks/useEditorState";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";
import { ProfileHeaderCard } from "@/components/admin/ProfileHeaderCard";
import { OnboardingCards } from "@/components/admin/OnboardingCards";
import { SocialIconsSection } from "@/components/admin/SocialIconsSection";
import { AdminLinksList } from "@/components/admin/AdminLinksList";
import { AdminRealtimePreview } from "@/components/admin/AdminRealtimePreview";
import { AddLinkSheet, type AddLinkOptionId } from "@/components/admin/AddLinkSheet";
import { DesignDrilldownView } from "@/components/design/DesignDrilldownView";
import { EditorPreview } from "@/components/editor/EditorPreview";
import { CardsInfoEditor } from "@/components/editor/CardsInfoEditor";
import { SocialAddModal } from "@/components/editor/SocialAddModal";
import { SettingsSection } from "@/components/design/sections/SettingsSection";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2 } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { TwitterIcon } from "@/components/icons/TwitterIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { WHATSAPP_DEFAULT_ICON_VALUE } from "@/lib/linkIcons";
import { DEFAULT_WHATSAPP_COUNTRY_CODE } from "@/lib/whatsapp";

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

export type AdminView = "links" | "design" | "analytics" | "settings";

export default function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial view based on URL
  const getInitialView = (): AdminView => {
    if (location.pathname === "/design") return "design";
    if (location.pathname === "/analytics") return "analytics";
    if (location.pathname === "/settings") return "settings";
    return "links";
  };
  const [activeView, setActiveView] = useState<AdminView>(getInitialView());

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
    saveNow,
    discardChanges,
    selectedLinkId,
    setSelectedLinkId,
  } = useEditorState(undefined, { autosave: activeView !== "design" });

  // Links state
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  // Snapshot of the social link being edited, if the clicked platform already
  // has one configured — used only to pre-fill the modal's input value.
  const [editingSocial, setEditingSocial] = useState<EditorLink | null>(null);
  // "Cards informativos" is the only add-link option left that still needs a
  // create-vs-edit split (it opens a dedicated dialog to fill in its cards
  // before the row exists) - "Link"/"WhatsApp" blocks are created directly
  // in local state and edited inline in their AdminLinkItem card instead.
  const [isCreatingCards, setIsCreatingCards] = useState(false);
  // Which "button" (link/whatsapp) card is showing its full edit fields -
  // every other one stays collapsed to a single summary row. Only one at a
  // time, toggled by that card's own pencil icon (see AdminLinkItem).
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // The "Adicionar link ou bloco" bottom sheet, letting the user pick
  // Link / WhatsApp / Cards first.
  const [showAddLinkSheet, setShowAddLinkSheet] = useState(false);
  // Which Design sub-page to open straight into on the next switch to
  // "design" - set when an onboarding card jumps there directly (e.g.
  // "Personalize seu perfil" -> Header), cleared on every other navigation
  // so a later, unrelated switch to Design doesn't inherit a stale jump.
  const [designInitialCategory, setDesignInitialCategory] = useState<"header" | null>(null);

  // The design view has no autosave - warn before discarding unsaved edits.
  // Confirming actually reverts the local state too, otherwise it would sit
  // there dirty and get silently persisted by autosave once it turns back on
  // outside the design view.
  const confirmDiscardDesignChanges = () => {
    if (activeView !== "design" || !isDirty) return true;
    const confirmed = window.confirm("Você tem alterações não salvas. Sair mesmo assim?");
    if (confirmed) discardChanges();
    return confirmed;
  };

  // Warn on hard navigation too (tab close, refresh, typing a new URL) -
  // in-app view/route changes are guarded individually since this event
  // doesn't fire for client-side navigation.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeView === "design" && isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeView, isDirty]);

  // Clicking a "button" link in the live preview panel sets selectedLinkId
  // purely to highlight/scroll to its card in the list below (see
  // AdminLinkItem's `highlighted` prop) - fade it back out on its own after a
  // beat, since there's no dialog here to dismiss it. "cards" blocks are
  // excluded: their own dialog (gated on selectedLinkId further down) manages
  // this id's lifecycle itself.
  useEffect(() => {
    if (!selectedLinkId) return;
    const link = links.find((l) => l.id === selectedLinkId);
    if (link?.linkType !== "button") return;
    const timeout = setTimeout(() => setSelectedLinkId(null), 2000);
    return () => clearTimeout(timeout);
  }, [selectedLinkId, links, setSelectedLinkId]);

  // Handle view change - update URL without full navigation
  const handleViewChange = (view: AdminView, designCategory?: "header") => {
    if (view === activeView) return;
    if (!confirmDiscardDesignChanges()) return;
    setActiveView(view);
    setDesignInitialCategory(view === "design" ? designCategory ?? null : null);
    // Update URL without reload
    const paths: Record<AdminView, string> = { links: "/admin", design: "/design", analytics: "/analytics", settings: "/settings" };
    window.history.replaceState(null, "", paths[view]);
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Links helpers - "button" and "cards" both live in the same reorderable
  // list (only "social" gets its own section below), so a cards block can
  // sit anywhere among the regular link buttons.
  const buttons = links.filter((l) => l.linkType === "button" || l.linkType === "cards");
  const socials = links.filter((l) => l.linkType === "social");
  const selectedLink = links.find((l) => l.id === selectedLinkId);

  // Onboarding checklist completion - derived live from profile/links data,
  // not a dismissible flag, so it reflects deletions too (e.g. removing the
  // only link brings card 1 back to pending).
  const hasOnboardingLinks = links.length > 0;
  const hasOnboardingProfileSetup = !!profile.avatarUrl?.trim() && !!profile.displayName?.trim();

  const handleOpenAddSheet = () => {
    setShowAddLinkSheet(true);
  };

  const handleSelectAddOption = (option: AddLinkOptionId) => {
    setShowAddLinkSheet(false);
    setSelectedLinkId(null);
    if (option === "cards") {
      setIsCreatingCards(true);
      return;
    }

    // "Link"/"WhatsApp" blocks are created empty and filled in inline, right
    // in their new AdminLinkItem card - no separate create dialog anymore.
    const newId = addLink({
      title: "",
      url: "",
      icon: option === "whatsapp" ? WHATSAPP_DEFAULT_ICON_VALUE : null,
      iconVariant: option === "whatsapp" ? "brand" : null,
      thumbnailUrl: null,
      linkType: "button",
      style: "filled",
      isActive: true,
      buttonBgColor: null,
      buttonTextColor: null,
      buttonBorderRadius: "rounded-xl",
      buttonKind: option,
      whatsappCountryCode: option === "whatsapp" ? DEFAULT_WHATSAPP_COUNTRY_CODE : null,
      whatsappPhone: null,
      whatsappMessage: null,
      cardsData: null,
    });
    setSelectedLinkId(newId);
    // Open straight into edit mode - a blank new block is useless collapsed.
    setExpandedId(newId);
  };

  const handleSaveSocial = (username: string) => {
    if (!selectedPlatform) return;

    let url = selectedPlatform.urlTemplate;
    if (selectedPlatform.isPhone) {
      url = url.replace("{phone}", username.replace(/\D/g, ""));
    } else {
      url = url.replace("{username}", username);
    }

    // Re-resolve against the live links array (not the `editingSocial`
    // snapshot) so this can't target a stale id — e.g. a temp id that
    // autosave already swapped for the real database id in the background.
    // A platform is identified by its icon, so at most one social per
    // platform is enforced here regardless of id churn.
    const currentExisting = links.find(
      (l) => l.linkType === "social" && l.icon === selectedPlatform.icon
    );

    if (currentExisting) {
      updateLink(currentExisting.id, { url });
    } else {
      addLink({
        title: selectedPlatform.name,
        url,
        icon: selectedPlatform.icon,
        iconVariant: null,
        thumbnailUrl: null,
        linkType: "social",
        style: "filled",
        isActive: true,
        buttonBgColor: null,
        buttonTextColor: null,
        buttonBorderRadius: "rounded-full",
        buttonKind: "link",
        whatsappCountryCode: null,
        whatsappPhone: null,
        whatsappMessage: null,
        cardsData: null,
      });
    }
    setShowAddSocial(false);
    setSelectedPlatform(null);
    setEditingSocial(null);
  };

  const handleToggleLink = (id: string, isActive: boolean) => {
    updateLink(id, { isActive });
  };

  const handleSaveCards = (cardsData: CardItem[]) => {
    if (isCreatingCards) {
      addLink({
        title: "Cards informativos",
        url: "",
        icon: null,
        iconVariant: null,
        thumbnailUrl: null,
        linkType: "cards",
        style: "filled",
        isActive: true,
        buttonBgColor: null,
        buttonTextColor: null,
        buttonBorderRadius: "rounded-xl",
        buttonKind: "link",
        whatsappCountryCode: null,
        whatsappPhone: null,
        whatsappMessage: null,
        cardsData,
      });
      setIsCreatingCards(false);
    } else if (selectedLinkId) {
      updateLink(selectedLinkId, { cardsData });
      setSelectedLinkId(null);
    }
  };

  const handlePreviewClick = (type: string, linkId?: string) => {
    if (type === "link" && linkId) {
      // For a "button" link this highlights/scrolls to its card and expands
      // it so its fields are actually visible (see the effect above) -
      // "cards" blocks ignore `expanded` and still open CardsInfoEditor,
      // gated on selectedLinkId further down.
      setSelectedLinkId(linkId);
      setExpandedId(linkId);
    } else if (type === "avatar" || type === "username" || type === "bio") {
      navigate("/editor");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background overflow-hidden pt-[env(safe-area-inset-top)] md:pt-0">
      {/* Collapsible animated sidebar - desktop only now (hover to expand); mobile navigation is handled entirely by MobileBottomNav below, there's no mobile top bar anymore */}
      <AdminSidebar
        activeSection={activeView}
        username={profile.username}
        onNavigate={handleViewChange}
        onBeforeNavigate={confirmDiscardDesignChanges}
      />

      {/* Mobile-only fixed bottom navigation bar (replaces the old fullscreen hamburger menu) */}
      <MobileBottomNav
        activeSection={activeView}
        username={profile.username}
        onNavigate={handleViewChange}
        onBeforeNavigate={confirmDiscardDesignChanges}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        {activeView === "links" ? (
          <main key="links" className="flex-1 overflow-auto animate-fade-in">
          <div className="max-w-2xl mx-auto pt-8 px-6 pb-24 md:pb-8">
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
              onUpdateUsername={(newUsername) => {
                updateProfile({ username: newUsername });
                saveNow();
              }}
              onUpdateHandle={(newHandle) => {
                // Bidirectional sync with "Nome de exibição" (Header) - see
                // the matching sync in HeaderSection.tsx's displayName input.
                updateProfile({ handle: newHandle, displayName: newHandle });
                saveNow();
              }}
            />

            {/* Onboarding Checklist */}
            <OnboardingCards
              hasLinks={hasOnboardingLinks}
              hasProfileSetup={hasOnboardingProfileSetup}
              createdAt={profile.createdAt}
              onAddLink={handleOpenAddSheet}
              onPersonalizeProfile={() => handleViewChange("design", "header")}
            />

            {/* Add Link Button */}
            <Button
              onClick={handleOpenAddSheet}
              className="w-full rounded-xl h-14 text-lg font-medium mb-6 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Link
            </Button>

            {/* Links List */}
            {buttons.length > 0 ? (
              <AdminLinksList
                links={buttons}
                highlightedId={selectedLinkId}
                expandedId={expandedId}
                onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                onReorder={reorderLinks}
                onToggle={handleToggleLink}
                onUpdate={updateLink}
                onSaveNow={saveNow}
                onEditCards={(id) => {
                  setSelectedLinkId(id);
                  setIsCreatingCards(false);
                }}
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
                setEditingSocial(existingSocial ?? null);
                setShowAddSocial(true);
              }}
              onDeleteSocial={(linkId) => {
                deleteLink(linkId);
              }}
            />

            {/* Real-time Preview */}
            <AdminRealtimePreview profile={profile} links={links} />
          </div>
        </main>
      ) : activeView === "design" ? (
        <DesignDrilldownView
          profile={profile}
          links={links}
          onUpdate={updateProfile}
          isSaving={isSaving}
          isDirty={isDirty}
          onSave={save}
          initialCategory={designInitialCategory ?? undefined}
        />
      ) : activeView === "analytics" ? (
        <main key="analytics" className="flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-xl mx-auto pt-8 px-6 pb-24 md:pb-8">
            <AnalyticsSection />
          </div>
        </main>
      ) : (
        <main
          key="settings"
          className="flex-1 overflow-y-auto animate-fade-in"
        >
          <div className="max-w-xl mx-auto pt-8 px-6 pb-24 md:pb-8">
            <SettingsSection />
          </div>
        </main>
        )}

        {/* Preview Panel */}
        <aside className="w-[380px] border-l border-border bg-muted/30 flex-shrink-0 p-6 flex items-center justify-center hidden lg:flex">
          <EditorPreview
            profile={profile}
            links={links}
            onClickElement={activeView === "links" ? handlePreviewClick : undefined}
          />
        </aside>
      </div>

      {/* "Adicionar link ou bloco" bottom sheet - only for links view */}
      <AddLinkSheet
        open={showAddLinkSheet}
        onClose={() => setShowAddLinkSheet(false)}
        onSelect={handleSelectAddOption}
      />

      <CardsInfoEditor
        open={isCreatingCards || (!!selectedLinkId && selectedLink?.linkType === "cards")}
        onClose={() => {
          setSelectedLinkId(null);
          setIsCreatingCards(false);
        }}
        onSave={handleSaveCards}
        initialCards={selectedLink?.linkType === "cards" ? selectedLink.cardsData : null}
      />

      {/* Social Add Modal */}
      <SocialAddModal
        open={showAddSocial}
        onClose={() => {
          setShowAddSocial(false);
          setSelectedPlatform(null);
          setEditingSocial(null);
        }}
        onSave={handleSaveSocial}
        platform={selectedPlatform}
        existingSocial={editingSocial}
      />
    </div>
  );
}
