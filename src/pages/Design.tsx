import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEditorState } from "@/hooks/useEditorState";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DesignSidebar, SECTIONS } from "@/components/design/DesignSidebar";
import { EditorPreview } from "@/components/editor/EditorPreview";
import { HeaderSection } from "@/components/design/sections/HeaderSection";
import { ThemeSection } from "@/components/design/sections/ThemeSection";
import { TextSection } from "@/components/design/sections/TextSection";
import { ButtonsSection } from "@/components/design/sections/ButtonsSection";
import { Loader2, Check, Cloud } from "lucide-react";

const SECTION_IDS = SECTIONS.map((s) => s.id);

export default function Design() {
  const { user, loading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    profile,
    links,
    isLoading,
    isSaving,
    lastSaved,
    updateProfile,
  } = useEditorState();

  const activeSection = useScrollSpy(SECTION_IDS, containerRef, { offset: 80 });

  const handleNavigate = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Navigation Sidebar */}
      <AdminSidebar activeSection="design" username={profile.username} />

      {/* Design Sections Sidebar */}
      <div className="w-56 border-r border-border flex-shrink-0">
        <DesignSidebar 
          activeSection={activeSection} 
          onNavigate={handleNavigate} 
        />
      </div>

      {/* Main Content Area with Scroll */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {/* Save Status Bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Personalizar Design</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSaving ? (
                <>
                  <Cloud className="h-4 w-4 animate-pulse" />
                  <span>Salvando...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Salvo</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-xl mx-auto py-8 px-6 space-y-16">
          <section id="header" className="scroll-mt-20">
            <HeaderSection profile={profile} onUpdate={updateProfile} />
          </section>

          <section id="theme" className="scroll-mt-20">
            <ThemeSection profile={profile} onUpdate={updateProfile} />
          </section>

          <section id="text" className="scroll-mt-20">
            <TextSection profile={profile} onUpdate={updateProfile} />
          </section>

          <section id="buttons" className="scroll-mt-20 pb-8">
            <ButtonsSection profile={profile} onUpdate={updateProfile} />
          </section>
        </div>
      </main>

      {/* Preview Panel */}
      <aside className="w-[380px] border-l border-border bg-muted/30 flex-shrink-0 p-6 flex items-center justify-center">
        <EditorPreview profile={profile} links={links} />
      </aside>
    </div>
  );
}
