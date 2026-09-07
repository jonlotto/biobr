// Converts a hex color ("#RRGGBB" or "#RGB") plus a 0-100 opacity percentage
// into an rgba() string, so a solid background color can be rendered
// semi-transparent (e.g. the button background opacity slider in the
// "Cores" design section). 100 (or omitted) always yields alpha 1, so
// applying this unconditionally to an already-opaque color is a no-op.
export interface GradientStops {
  angle: number;
  from: string;
  to: string;
}

// Every gradient this app has ever been able to save is a 2-stop
// `linear-gradient(<deg>deg, <hex>, <hex>)` - the old preset-swatch picker in
// "Fundo" only ever wrote exactly that shape (always 135deg), so this covers
// 100% of existing saved data even though the new builder lets the angle and
// both stops vary freely.
const LINEAR_GRADIENT_RE = /^linear-gradient\((\d+)deg,\s*(#[0-9A-Fa-f]{3,8}),\s*(#[0-9A-Fa-f]{3,8})\)$/i;

export function parseLinearGradient(value: string | null | undefined): GradientStops | null {
  if (!value) return null;
  const match = value.match(LINEAR_GRADIENT_RE);
  if (!match) return null;
  return { angle: Number(match[1]), from: match[2], to: match[3] };
}

export function buildLinearGradient({ angle, from, to }: GradientStops): string {
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

export const GRADIENT_DIRECTIONS: { label: string; angle: number }[] = [
  { label: "Para baixo", angle: 180 },
  { label: "Para cima", angle: 0 },
  { label: "Para a direita", angle: 90 },
  { label: "Para a esquerda", angle: 270 },
  { label: "Diagonal ↘", angle: 135 },
  { label: "Diagonal ↗", angle: 45 },
];

export function hexToRgba(hex: string, opacityPercent = 100): string {
  const clean = hex.replace("#", "");
  const expanded = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = parseInt(expanded, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const alpha = Math.max(0, Math.min(100, opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
