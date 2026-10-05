import { cn } from "@/lib/utils";
import { EditorProfile } from "@/hooks/useEditorState";
import { CONTENT_WARNING_LEVELS, getContentWarningHelpText } from "@/lib/contentWarning";

interface SensitiveContentSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

export function SensitiveContentSection({ profile, onUpdate }: SensitiveContentSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Conteúdo sensível
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Útil para conteúdo não recomendado para todos os públicos
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {CONTENT_WARNING_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onUpdate({ contentWarningLevel: level.value })}
            className={cn(
              "py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-all",
              profile.contentWarningLevel === level.value
                ? "border-primary bg-white"
                : "border-gray-200 bg-gray-50 text-muted-foreground hover:border-gray-300",
            )}
          >
            {level.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {getContentWarningHelpText(profile.contentWarningLevel)}
      </p>
    </div>
  );
}
