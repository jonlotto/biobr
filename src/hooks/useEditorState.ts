import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { HeaderLayout } from "@/lib/headerLayouts";

export interface EditorLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  thumbnailUrl: string | null;
  linkType: "button" | "social";
  style: "filled" | "outline";
  isActive: boolean;
  order: number;
  // Button customization
  buttonBgColor: string | null;
  buttonTextColor: string | null;
  buttonBorderRadius: string;
}

export interface EditorProfile {
  templateSlug: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bannerOriginalUrl: string | null;
  bannerCropOffsetY: number;
  username: string;
  handle: string;
  displayName: string;
  bio: string;
  // Header layout - null means "not chosen yet, fall back to the template's
  // own hasBanner flag" (see resolveHeaderLayout), so older profiles keep
  // rendering the way they always have.
  headerLayout: HeaderLayout | null;
  // Global customization
  globalButtonBgColor: string | null;
  globalButtonTextColor: string | null;
  globalBackgroundColor: string | null;
  globalBackgroundImage: string | null;
  globalButtonStyle: "filled" | "outline";
  globalButtonBorderRadius: string;
  // Typography customization
  titleFont: string;
  titleColor: string | null;
  titleSize: "small" | "large";
}

export interface EditorState {
  profile: EditorProfile;
  links: EditorLink[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  isLoading: boolean;
}

const DEBOUNCE_DELAY = 800;

export interface UseEditorStateOptions {
  /** When false, edits only update local state - persisting requires calling `save()`. Defaults to true. */
  autosave?: boolean;
}

export function useEditorState(initialTemplateSlug?: string, options?: UseEditorStateOptions) {
  const autosave = options?.autosave ?? true;
  const { user } = useAuth();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const [state, setState] = useState<EditorState>({
    profile: {
      templateSlug: initialTemplateSlug || "starter",
      avatarUrl: null,
      bannerUrl: null,
      bannerOriginalUrl: null,
      bannerCropOffsetY: 0,
      username: "",
      handle: "",
      displayName: "",
      bio: "",
      headerLayout: null,
      globalButtonBgColor: null,
      globalButtonTextColor: null,
      globalBackgroundColor: null,
      globalBackgroundImage: null,
      globalButtonStyle: "filled",
      globalButtonBorderRadius: "rounded-xl",
      titleFont: "Inter",
      titleColor: null,
      titleSize: "large",
    },
    links: [],
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    isLoading: true,
  });

  // Ref to always have current state for saveData callback
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Snapshot of what's actually persisted - refreshed on load and after every
  // successful save, so `discardChanges` has something to revert to.
  const savedSnapshotRef = useRef<{ profile: EditorProfile; links: EditorLink[] }>({
    profile: state.profile,
    links: state.links,
  });

  // Load data from Supabase
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Load profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Load links
        const { data: links, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", user.id)
          .order("position", { ascending: true });

        if (linksError) throw linksError;

        // Prioritize URL template over database value
        const dbTemplateSlug = profile?.template_slug || "starter";
        const finalTemplateSlug = initialTemplateSlug || dbTemplateSlug;
        const templateChanged = initialTemplateSlug && initialTemplateSlug !== dbTemplateSlug;

        const loadedProfile: EditorProfile = {
          templateSlug: finalTemplateSlug,
          avatarUrl: profile?.avatar_url || null,
          bannerUrl: profile?.banner_url || null,
          bannerOriginalUrl: profile?.banner_original_url || null,
          bannerCropOffsetY: Number(profile?.banner_crop_offset_y) || 0,
          username: profile?.username || "",
          handle: (profile as any)?.handle || profile?.username || "",
          displayName: profile?.display_name || "",
          bio: profile?.bio || "",
          headerLayout: ((profile as any)?.header_layout as EditorProfile["headerLayout"]) || null,
          globalButtonBgColor: profile?.global_button_bg_color || null,
          globalButtonTextColor: profile?.global_button_text_color || null,
          globalBackgroundColor: profile?.global_background_color || null,
          globalBackgroundImage: (profile as any)?.global_background_image || null,
          globalButtonStyle: (profile?.global_button_style as "filled" | "outline") || "filled",
          globalButtonBorderRadius: profile?.global_button_border_radius || "rounded-xl",
          titleFont: (profile as any)?.title_font || "Inter",
          titleColor: (profile as any)?.title_color || null,
          titleSize: ((profile as any)?.title_size as "small" | "large") || "large",
        };
        const loadedLinks: EditorLink[] = (links || []).map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
          icon: link.icon,
          thumbnailUrl: (link as any).thumbnail_url || null,
          linkType: (link.link_type as "button" | "social") || "button",
          style: (link.style as "filled" | "outline") || "filled",
          isActive: link.is_active,
          order: link.position,
          buttonBgColor: link.button_bg_color || null,
          buttonTextColor: link.button_text_color || null,
          buttonBorderRadius: link.button_border_radius || "rounded-xl",
        }));

        // A changed template from the URL counts as a pending edit, so don't
        // snapshot it as "saved" - only the state actually persisted in the DB.
        savedSnapshotRef.current = {
          profile: templateChanged ? { ...loadedProfile, templateSlug: dbTemplateSlug } : loadedProfile,
          links: loadedLinks,
        };

        setState((prev) => ({
          ...prev,
          profile: loadedProfile,
          links: loadedLinks,
          isLoading: false,
          isDirty: templateChanged || false,
        }));
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadData();
  }, [user, initialTemplateSlug, toast]);

  // Auto-save with debounce - use ref to avoid stale closure
  const saveData = useCallback(async () => {
    if (!user) return;

    const currentState = stateRef.current;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      // Save profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          template_slug: currentState.profile.templateSlug,
          avatar_url: currentState.profile.avatarUrl,
          banner_url: currentState.profile.bannerUrl,
          banner_original_url: currentState.profile.bannerOriginalUrl,
          banner_crop_offset_y: currentState.profile.bannerCropOffsetY,
          username: currentState.profile.username,
          handle: currentState.profile.handle,
          display_name: currentState.profile.displayName,
          bio: currentState.profile.bio,
          header_layout: currentState.profile.headerLayout,
          global_button_bg_color: currentState.profile.globalButtonBgColor,
          global_button_text_color: currentState.profile.globalButtonTextColor,
          global_background_color: currentState.profile.globalBackgroundColor,
          global_background_image: currentState.profile.globalBackgroundImage,
          global_button_style: currentState.profile.globalButtonStyle,
          global_button_border_radius: currentState.profile.globalButtonBorderRadius,
          title_font: currentState.profile.titleFont,
          title_color: currentState.profile.titleColor,
          title_size: currentState.profile.titleSize,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Save links - delete removed, update existing, insert new
      const existingIds = currentState.links.filter((l) => !l.id.startsWith("temp-")).map((l) => l.id);
      
      // Delete links not in current state
      if (existingIds.length > 0) {
        await supabase
          .from("links")
          .delete()
          .eq("user_id", user.id)
          .not("id", "in", `(${existingIds.join(",")})`);
      } else {
        await supabase.from("links").delete().eq("user_id", user.id);
      }

      // Mirrors currentState.links but with temp ids swapped for real ones as
      // they're inserted below, so the post-save snapshot reflects real ids.
      const savedLinks = [...currentState.links];

      // Upsert all current links
      for (const link of currentState.links) {
        const linkData = {
          user_id: user.id,
          title: link.title,
          url: link.url,
          icon: link.icon,
          thumbnail_url: link.thumbnailUrl,
          link_type: link.linkType,
          style: link.style,
          is_active: link.isActive,
          position: link.order,
          button_bg_color: link.buttonBgColor,
          button_text_color: link.buttonTextColor,
          button_border_radius: link.buttonBorderRadius,
        };

        if (link.id.startsWith("temp-")) {
          // Insert new link
          const { data: newLink } = await supabase
            .from("links")
            .insert(linkData)
            .select()
            .single();

          if (newLink) {
            setState((prev) => ({
              ...prev,
              links: prev.links.map((l) =>
                l.id === link.id ? { ...l, id: newLink.id } : l
              ),
            }));
            const savedIndex = savedLinks.findIndex((l) => l.id === link.id);
            if (savedIndex !== -1) savedLinks[savedIndex] = { ...savedLinks[savedIndex], id: newLink.id };
            // Keep the currently-open editor pointed at the same link after
            // its temp id is replaced by the real database id, otherwise a
            // pending edit/save targets an id that no longer exists.
            setSelectedLinkId((prev) => (prev === link.id ? newLink.id : prev));
          }
        } else {
          // Update existing link
          await supabase
            .from("links")
            .update(linkData)
            .eq("id", link.id);
        }
      }

      savedSnapshotRef.current = { profile: currentState.profile, links: savedLinks };

      setState((prev) => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      }));
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [user, toast]);

  // Trigger auto-save when dirty (skipped entirely when autosave is disabled -
  // in that mode, only the manual `save()` call below persists changes)
  useEffect(() => {
    if (autosave && state.isDirty && !state.isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(saveData, DEBOUNCE_DELAY);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autosave, state.isDirty, state.isLoading, saveData]);

  // Update profile
  const updateProfile = useCallback((updates: Partial<EditorProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
      isDirty: true,
    }));
  }, []);

  // Add link
  const addLink = useCallback((link: Omit<EditorLink, "id" | "order">) => {
    const newLink: EditorLink = {
      ...link,
      id: `temp-${Date.now()}`,
      order: state.links.length,
    };
    setState((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
      isDirty: true,
    }));
    return newLink.id;
  }, [state.links.length]);

  // Update link
  const updateLink = useCallback((id: string, updates: Partial<EditorLink>) => {
    setState((prev) => ({
      ...prev,
      links: prev.links.map((link) =>
        link.id === id ? { ...link, ...updates } : link
      ),
      isDirty: true,
    }));
  }, []);

  // Delete link
  const deleteLink = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      links: prev.links
        .filter((link) => link.id !== id)
        .map((link, index) => ({ ...link, order: index })),
      isDirty: true,
    }));
  }, []);

  // Duplicate link
  const duplicateLink = useCallback((id: string) => {
    const linkToDuplicate = state.links.find((l) => l.id === id);
    if (!linkToDuplicate) return;

    const newLink: EditorLink = {
      ...linkToDuplicate,
      id: `temp-${Date.now()}`,
      title: `${linkToDuplicate.title} (cópia)`,
      order: state.links.length,
    };
    setState((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
      isDirty: true,
    }));
  }, [state.links]);

  // Reorder links
  const reorderLinks = useCallback((newOrder: string[]) => {
    setState((prev) => ({
      ...prev,
      links: newOrder.map((id, index) => {
        const link = prev.links.find((l) => l.id === id);
        return link ? { ...link, order: index } : prev.links[index];
      }).filter(Boolean) as EditorLink[],
      isDirty: true,
    }));
  }, []);

  // Manual save
  const save = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveData();
  }, [saveData]);

  // Revert local edits back to what's actually persisted - used when the
  // user chooses to leave with unsaved changes instead of saving them.
  const discardChanges = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setState((prev) => ({
      ...prev,
      profile: savedSnapshotRef.current.profile,
      links: savedSnapshotRef.current.links,
      isDirty: false,
    }));
  }, []);

  return {
    ...state,
    updateProfile,
    addLink,
    updateLink,
    deleteLink,
    duplicateLink,
    reorderLinks,
    save,
    discardChanges,
    selectedLinkId,
    setSelectedLinkId,
  };
}
