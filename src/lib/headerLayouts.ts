export type HeaderLayout = "classic" | "banner" | "banner-wave" | "banner-card" | "editorial-badge";

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
  { id: "banner-wave", label: "Banner Wave" },
  { id: "banner-card", label: "Banner Card" },
  { id: "editorial-badge", label: "Selo Editorial" },
  { id: "cutout", label: "Cutout", locked: true },
];

export const HEADER_LAYOUT_LABELS: Record<HeaderLayout, string> = {
  classic: "Classic",
  banner: "Banner",
  "banner-wave": "Banner Wave",
  "banner-card": "Banner Card",
  "editorial-badge": "Selo Editorial",
};

const VALID_HEADER_LAYOUTS = new Set<string>(["classic", "banner", "banner-wave", "banner-card", "editorial-badge"]);

/**
 * `headerLayout` is null for every profile that existed before this feature
 * shipped - falling back to the template's own `hasBanner`/`hasCurvedBanner`
 * flags keeps those pages rendering exactly as they did before (the "Wave"
 * theme's curved banner in particular), until the user explicitly picks a
 * layout in the new UI. Any stored value that isn't one of the currently
 * supported layouts (e.g. a stale "hero"/"shape", or "banner-full" now that
 * it's been removed) is treated the same way, so old rows never crash the
 * renderer - a profile that had "Banner Full" selected just falls back here
 * like it had never picked a layout.
 */
export function resolveHeaderLayout(
  headerLayout: string | null,
  templateHasBanner: boolean,
  templateHasCurvedBanner?: boolean,
): HeaderLayout {
  if (headerLayout && VALID_HEADER_LAYOUTS.has(headerLayout)) {
    return headerLayout as HeaderLayout;
  }
  if (templateHasCurvedBanner) return "banner-wave";
  return templateHasBanner ? "banner" : "classic";
}
