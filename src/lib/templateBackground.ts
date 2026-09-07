import type { CSSProperties } from "react";
import type { Template } from "@/data/templates";
import type { EditorProfile } from "@/hooks/useEditorState";

// Priority: custom image > custom color/gradient > template's own image background.
// Shared by every preview surface (full page preview, compact mobile preview)
// so they never drift out of sync with each other.
export function getProfileBackgroundStyle(profile: EditorProfile, template: Template): CSSProperties | undefined {
  if (profile.globalBackgroundImage) {
    return {
      backgroundImage: `url(${profile.globalBackgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (profile.globalBackgroundColor) {
    if (profile.globalBackgroundColor.startsWith("linear-gradient")) {
      return { background: profile.globalBackgroundColor };
    }
    return { backgroundColor: profile.globalBackgroundColor };
  }
  if (template.styles.backgroundType === "image" && template.styles.backgroundImage) {
    return {
      backgroundImage: `url(${template.styles.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return undefined;
}

export function hasCustomProfileBackground(profile: EditorProfile): boolean {
  return !!profile.globalBackgroundImage || !!profile.globalBackgroundColor;
}
