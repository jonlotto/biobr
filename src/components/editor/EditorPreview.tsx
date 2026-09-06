import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { BioPreviewContent } from "@/components/editor/BioPreviewContent";

interface EditorPreviewProps {
  profile: EditorProfile;
  links: EditorLink[];
  onClickElement?: (type: "avatar" | "username" | "bio" | "link" | "banner", linkId?: string) => void;
}

export function EditorPreview({ profile, links, onClickElement }: EditorPreviewProps) {
  const openPreview = () => {
    if (profile.username) {
      window.open(`/${profile.username}`, "_blank");
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Phone Frame */}
      <div className="relative w-[320px] h-[640px] rounded-[3rem] border-8 border-foreground/20 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />

        {/* Content */}
        <BioPreviewContent profile={profile} links={links} onClickElement={onClickElement} interactive />
      </div>

      {/* Open in new tab button */}
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={openPreview}
        disabled={!profile.username}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Abrir em nova aba
      </Button>
    </div>
  );
}
