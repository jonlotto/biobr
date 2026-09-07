export type ButtonLayout =
  | "unified-card"
  | "overlap-alternate"
  | "pill-square-icon"
  | "pill-round-icon"
  | "card-overlap-alternate";

export interface ButtonLayoutOption {
  id: ButtonLayout | string;
  label: string;
  /** Not selectable yet - shown with a lock badge. */
  locked?: boolean;
}

// Order matches the 2x4 grid picker in Personalizar Design > Botões. The last
// three slots are reserved placeholders for models not designed/implemented yet.
export const BUTTON_LAYOUTS: ButtonLayoutOption[] = [
  { id: "unified-card", label: "Card Único" },
  { id: "overlap-alternate", label: "Ícone Alternado" },
  { id: "pill-square-icon", label: "Pílula Quadrada" },
  { id: "pill-round-icon", label: "Pílula Redonda" },
  { id: "card-overlap-alternate", label: "Card com Ícone" },
  { id: "locked-1", label: "Em breve", locked: true },
  { id: "locked-2", label: "Em breve", locked: true },
  { id: "locked-3", label: "Em breve", locked: true },
];

export const BUTTON_LAYOUT_LABELS: Record<ButtonLayout, string> = {
  "unified-card": "Card Único",
  "overlap-alternate": "Ícone Alternado",
  "pill-square-icon": "Pílula Quadrada",
  "pill-round-icon": "Pílula Redonda",
  "card-overlap-alternate": "Card com Ícone",
};

const VALID_BUTTON_LAYOUTS = new Set<string>([
  "unified-card",
  "overlap-alternate",
  "pill-square-icon",
  "pill-round-icon",
  "card-overlap-alternate",
]);

/**
 * `buttonLayout` is null for every profile that existed before this feature
 * shipped - falling back to "pill-square-icon" keeps those pages rendering
 * the way the button list always looked (icon fixed left, inside the pill),
 * until the user explicitly picks a layout in the new UI. Any stored value
 * that isn't one of the currently supported layouts falls back the same way.
 */
export function resolveButtonLayout(buttonLayout: string | null): ButtonLayout {
  if (buttonLayout && VALID_BUTTON_LAYOUTS.has(buttonLayout)) {
    return buttonLayout as ButtonLayout;
  }
  return "pill-square-icon";
}
