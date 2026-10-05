// Cleans up a "Link" block's URL when its field loses focus (see
// AdminLinkItem). Generic links only get the basics; links whose icon is
// Instagram also accept the shapes people actually type or paste for a
// profile (@handle, bare domain, app share links with tracking params).

const INSTAGRAM_ICONS = new Set(["si-instagram", "instagram-icon"]);
const INSTAGRAM_BASE = "https://instagram.com/";
const PROTOCOL = /^https?:\/\//i;
const INSTAGRAM_HOST = /^(?:www\.)?instagram\.com(?:\/|$)/i;
// Instagram usernames: letters, digits, "." and "_" (optionally typed with @).
const BARE_HANDLE = /^@?[a-z0-9._]+\/?$/i;

export function isInstagramIcon(icon: string | null | undefined): boolean {
  return !!icon && INSTAGRAM_ICONS.has(icon);
}

/**
 * Normalizes a link URL typed into the admin's link field.
 *
 * Every link: trims, keeps only the last URL when one was pasted right after
 * a prefilled one ("https://a.com/https://b.com" -> "https://b.com"), and
 * prepends https:// to bare domains - same as the field always did.
 *
 * Instagram links (icon "si-instagram" or legacy "instagram-icon"): "@user",
 * "user", "instagram.com/user" and "www.instagram.com/user" - with or without
 * protocol, even pasted after the prefilled "https://instagram.com/" - all
 * become "https://instagram.com/user", minus a leading "@", trailing slash
 * and tracking params (igsh, igshid, utm_*). Just the bare prefix (no
 * username yet) is left as is.
 */
export function normalizeLinkUrl(raw: string, icon?: string | null): string {
  let value = raw.trim();
  if (!value) return raw;

  // Pasted a full URL after a prefilled one: keep the last one only.
  const protocols = [...value.matchAll(/https?:\/\//gi)];
  if (protocols.length > 1) value = value.slice(protocols[protocols.length - 1].index);

  if (isInstagramIcon(icon)) {
    const instagram = normalizeInstagram(value);
    if (instagram) return instagram;
  }

  return PROTOCOL.test(value) ? value : `https://${value}`;
}

// Returns null when `value` isn't recognizably an Instagram address (e.g. an
// Instagram-iconed button pointing at some other site), so the caller falls
// back to the generic rules.
function normalizeInstagram(value: string): string | null {
  const hadProtocol = PROTOCOL.test(value);
  let rest = value.replace(PROTOCOL, "");

  if (INSTAGRAM_HOST.test(rest)) {
    // Also strips a bare domain pasted after the prefill:
    // "instagram.com/www.instagram.com/user" -> "user".
    while (INSTAGRAM_HOST.test(rest)) rest = rest.replace(/^(?:www\.)?instagram\.com\/?/i, "");
  } else if (hadProtocol || !BARE_HANDLE.test(rest)) {
    return null;
  }

  const [pathPart, ...queryParts] = rest.split("?");
  const path = pathPart.replace(/^@/, "").replace(/\/+$/, "");
  // Only the prefix, no username yet - don't make one up.
  if (!path) return null;

  const params = new URLSearchParams(queryParts.join("?"));
  for (const key of [...params.keys()]) {
    if (key === "igsh" || key === "igshid" || key.startsWith("utm_")) params.delete(key);
  }
  const query = params.toString();

  return `${INSTAGRAM_BASE}${path}${query ? `?${query}` : ""}`;
}
