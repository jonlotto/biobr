// Shared WhatsApp helpers for the "button" link kind - used by the inline
// AdminLinkItem card (and previously by ButtonEditDrawer/SocialAddModal,
// which each hardcoded their own "55"/mask logic before this existed).

export const DEFAULT_WHATSAPP_COUNTRY_CODE = "55";

export interface WhatsappCountryOption {
  /** Dialing code, no leading "+". */
  code: string;
  label: string;
  flag: string;
}

// Only Brazil is supported today - every WhatsApp flow in the app hardcoded
// "+55" before this existed. Kept as a list (not a single constant) so the
// country selector can grow without changing shape later.
export const WHATSAPP_COUNTRY_CODES: WhatsappCountryOption[] = [
  { code: "55", label: "BR", flag: "🇧🇷" },
];

/** Formats raw digits as "(XX) XXXXX-XXXX" while typing a DDD + phone number. */
export function maskWhatsappPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Builds the public https://wa.me/... url a WhatsApp button links to; empty string when there's no phone yet. */
export function buildWhatsappUrl(countryCode: string | null, phone: string | null, message: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  let url = `https://wa.me/${countryCode || DEFAULT_WHATSAPP_COUNTRY_CODE}${digits}`;
  if (message?.trim()) {
    url += `?text=${encodeURIComponent(message.trim())}`;
  }
  return url;
}
