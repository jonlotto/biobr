import { NotificationPermission } from "@/components/NotificationPermission";
import { EditorProfile } from "@/hooks/useEditorState";
import { SensitiveContentSection } from "./SensitiveContentSection";

interface SettingsSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

export function SettingsSection({ profile, onUpdate }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as preferências do seu app
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Notificações
        </h3>
        <NotificationPermission variant="card" />
      </div>

      <SensitiveContentSection profile={profile} onUpdate={onUpdate} />
    </div>
  );
}
