export type HeaderLayout = "classic" | "banner" | "banner-full" | "banner-card";

export interface HeaderLayoutOption {
  id: HeaderLayout | "cutout";
  label: string;
  /** Not selectable yet - shown with a lock badge. */
  locked?: boolean;
}

// Order matches the horizontal card picker in Personalizar Design > Header.
export const HEADER_LAYOUTS: HeaderLayoutOption[] = [
  { id: "classic", label: "Classic" },
  { id: "banner", label: "Banner" },
  { id: "banner-full", label: "Banner Full" },
  { id: "banner-card", label: "Banner Card" },
  { id: "cutout", label: "Cutout", locked: true },
];

export const HEADER_LAYOUT_LABELS: Record<HeaderLayout, string> = {
  classic: "Classic",
  banner: "Banner",
  "banner-full": "Banner Full",
  "banner-card": "Banner Card",
};

const VALID_HEADER_LAYOUTS = new Set<string>(["classic", "banner", "banner-full", "banner-card"]);

/**
 * `headerLayout` is null for every profile that existed before this feature
 * shipped - falling back to the template's own `hasBanner` flag keeps those
 * pages rendering exactly as they did before, until the user explicitly
 * picks a layout in the new UI. Any stored value that isn't one of the
 * currently supported layouts (e.g. a stale "hero"/"shape" from a removed
 * option) is treated the same way, so old rows never crash the renderer.
 */
export function resolveHeaderLayout(headerLayout: string | null, templateHasBanner: boolean): HeaderLayout {
  if (headerLayout && VALID_HEADER_LAYOUTS.has(headerLayout)) {
    return headerLayout as HeaderLayout;
  }
  return templateHasBanner ? "banner" : "classic";
}
