import { EditorProfile } from "@/hooks/useEditorState";
import { templates } from "@/data/templates";
import { TemplateThumbCard } from "../TemplateThumbCard";
import { ImageIcon } from "lucide-react";

interface ThemeSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

export function ThemeSection({ profile, onUpdate }: ThemeSectionProps) {
  const standardTemplates = templates.filter(t => !t.hasBanner);
  const bannerTemplates = templates.filter(t => t.hasBanner);

  const applyTemplate = (template: typeof templates[0]) => {
    onUpdate({
      templateSlug: template.slug,
      // Reset ALL custom settings to use the new template's defaults
      globalBackgroundColor: null,
      globalButtonBgColor: null,
      globalButtonBgOpacity: null,
      globalButtonTextColor: null,
      globalButtonStyle: "filled",
      globalButtonBorderRadius: template.styles.buttonStyle,
      // Typography
      titleFont: template.styles.font,
      titleColor: null,
      titleSize: template.styles.textSize,
    });
  };

  return (
    <div className="space-y-6">
      {/* Standard Templates Section */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Tema</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha um tema para sua página
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {standardTemplates.map((template) => (
            <TemplateThumbCard
              key={template.slug}
              template={template}
              isSelected={profile.templateSlug === template.slug}
              onClick={() => applyTemplate(template)}
            />
          ))}
        </div>
      </div>

      {/* Divider + Banner Templates Section */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2">
            <ImageIcon className="h-4 w-4" />
            <span>Com Imagem de Capa</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {bannerTemplates.map((template) => (
            <TemplateThumbCard
              key={template.slug}
              template={template}
              isSelected={profile.templateSlug === template.slug}
              onClick={() => applyTemplate(template)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
