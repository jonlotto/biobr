import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { BioPreviewContent } from "@/components/editor/BioPreviewContent";

interface AdminRealtimePreviewProps {
  profile: EditorProfile;
  links: EditorLink[];
}

export function AdminRealtimePreview({ profile, links }: AdminRealtimePreviewProps) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <h2 className="text-sm font-medium text-muted-foreground">
          Preview em tempo real
        </h2>
      </div>

      <div className="mx-auto w-full max-w-[375px] h-[600px] rounded-2xl border border-border shadow-sm overflow-hidden bg-background">
        <BioPreviewContent profile={profile} links={links} interactive={false} />
      </div>
    </div>
  );
}
