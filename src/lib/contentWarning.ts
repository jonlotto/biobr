// "Conteúdo sensível" (Configurações admin + BioPage's age gate). "general"
// is a plain content warning with no age check - see SensitiveContentGate,
// which renders a single "Continuar" button for it instead of the two
// age-confirmation buttons the "18+"/"21+"/"25+" levels get.
export type ContentWarningLevel = "none" | "general" | "18+" | "21+" | "25+";

export const CONTENT_WARNING_LEVELS: { value: ContentWarningLevel; label: string }[] = [
  { value: "none", label: "Nenhum" },
  { value: "general", label: "Geral" },
  { value: "18+", label: "18+" },
  { value: "21+", label: "21+" },
  { value: "25+", label: "25+" },
];

export function isContentWarningLevel(value: string | null | undefined): value is ContentWarningLevel {
  return !!value && CONTENT_WARNING_LEVELS.some((l) => l.value === value);
}

// Minimum age implied by a level - null for "none" and "general" (neither
// gates on age).
export function getMinAge(level: ContentWarningLevel): number | null {
  return level === "none" || level === "general" ? null : parseInt(level, 10);
}

export function getContentWarningHelpText(level: ContentWarningLevel): string {
  if (level === "none") return "Nenhum aviso será exibido antes da sua bio.";
  if (level === "general") {
    return "Mostra um aviso de conteúdo antes de exibir a bio, sem exigir confirmação de idade.";
  }
  return `Exige confirmação de idade (${level}) antes de mostrar sua bio para visitantes.`;
}

// Remembers a visitor's answer for the current browser session only
// (sessionStorage) - a refresh or clicking one of the bio's own links
// doesn't re-prompt, but closing the browser and coming back does. Keyed per
// username so visiting two different bios in the same tab (e.g. a shared
// device) doesn't leak one profile's answer onto another's.
export type GateAnswer = "confirmed" | "denied";
const STORAGE_PREFIX = "vtrine-content-warning:";

export function getStoredGateAnswer(username: string): GateAnswer | null {
  try {
    const value = sessionStorage.getItem(STORAGE_PREFIX + username);
    return value === "confirmed" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setStoredGateAnswer(username: string, answer: GateAnswer): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + username, answer);
  } catch {
    // Private browsing / storage disabled - worst case the visitor is asked
    // again if they navigate away and back, nothing to recover from here.
  }
}
