// Dynamic replacement for the old blanket <link> in index.html, which pulled
// in every font family + weight the admin's font picker offers (see
// TextSection.tsx's FONTS list) on every single page load - including the
// public bio page, which only ever needs the one family a profile picked.
// Weight sets below mirror what that original URL requested per family.
const FONT_WEIGHTS: Record<string, string | null> = {
  Inter: "400;500;600;700",
  Poppins: "400;500;600;700",
  Roboto: "400;500;700",
  Montserrat: "400;500;600;700",
  "Playfair Display": "400;500;600;700",
  Lato: "400;700",
  Raleway: "400;500;600;700",
  Nunito: "400;500;600;700",
  Oswald: "400;500;600;700",
  "Bebas Neue": null,
  Righteous: null,
  "Archivo Black": null,
  Pacifico: null,
  "Dancing Script": "400;500;600;700",
  Caveat: "400;500;600;700",
  Satisfy: null,
  Lobster: null,
  Merriweather: "400;700",
  Lora: "400;500;600;700",
  "Crimson Text": "400;600;700",
  "Space Grotesk": "400;500;600;700",
  "DM Sans": "400;500;600;700",
};

const DEFAULT_WEIGHTS = "400;500;600;700";

// Inter is already loaded by index.css's own @import (the app shell's default
// body font, needed on every page) with the same weight range this module
// would otherwise request - treat it as already satisfied so a profile using
// the default title font doesn't trigger a second, redundant request for it.
// Poppins is deliberately NOT seeded here: that same @import only pulls
// 600/700/800 (its heading use), missing 400/500 - narrower than what a
// profile picking "Poppins" as its title font or the admin font picker's
// preview list needs, so it still goes through the request path below.
const loadedFamilies = new Set<string>(["Inter"]);

function buildFamilyParam(family: string): string {
  const weights = family in FONT_WEIGHTS ? FONT_WEIGHTS[family] : DEFAULT_WEIGHTS;
  const encoded = family.trim().replace(/\s+/g, "+");
  return weights ? `family=${encoded}:wght@${weights}` : `family=${encoded}`;
}

/**
 * Injects a Google Fonts stylesheet <link> for the given families, skipping
 * any already loaded. Safe to call repeatedly (e.g. once per profile fetch)
 * or with a whole list at once (e.g. the admin font picker previewing every
 * option). `index.html` still owns the two `<link rel="preconnect">` tags
 * and this keeps the same `display=swap` this used to ship with.
 */
export function loadGoogleFonts(families: (string | null | undefined)[]): void {
  const toLoad = Array.from(new Set(families.filter((f): f is string => !!f && !loadedFamilies.has(f))));
  if (toLoad.length === 0) return;
  toLoad.forEach((f) => loadedFamilies.add(f));

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${toLoad.map(buildFamilyParam).join("&")}&display=swap`;
  document.head.appendChild(link);
}
