import { describe, expect, it } from "vitest";
import { normalizeLinkUrl } from "./linkUrl";

describe("normalizeLinkUrl - any link", () => {
  it("leaves an empty field alone", () => {
    expect(normalizeLinkUrl("", null)).toBe("");
    expect(normalizeLinkUrl("   ", null)).toBe("   ");
  });

  it("prepends https:// to a bare domain", () => {
    expect(normalizeLinkUrl("seu-site.com/pagina", null)).toBe("https://seu-site.com/pagina");
  });

  it("keeps a full URL as is (trimmed)", () => {
    expect(normalizeLinkUrl("  http://site.com/a?x=1  ", null)).toBe("http://site.com/a?x=1");
  });

  it("keeps only the last URL when one was pasted after another", () => {
    expect(normalizeLinkUrl("https://site.com/https://outro.com/p", null)).toBe("https://outro.com/p");
  });

  it("doesn't apply Instagram rules without an Instagram icon", () => {
    expect(normalizeLinkUrl("@usuario", null)).toBe("https://@usuario");
    expect(normalizeLinkUrl("https://instagram.com/usuario?igsh=abc", "si-whatsapp")).toBe(
      "https://instagram.com/usuario?igsh=abc",
    );
  });
});

describe.each(["si-instagram", "instagram-icon"])("normalizeLinkUrl - Instagram (%s)", (icon) => {
  const cases: [string, string][] = [
    ["https://instagram.com/usuario", "https://instagram.com/usuario"],
    ["https://instagram.com/@usuario", "https://instagram.com/usuario"],
    ["@usuario", "https://instagram.com/usuario"],
    ["usuario", "https://instagram.com/usuario"],
    ["instagram.com/usuario", "https://instagram.com/usuario"],
    ["www.instagram.com/usuario", "https://instagram.com/usuario"],
    ["https://www.instagram.com/usuario/", "https://instagram.com/usuario"],
    // Pasted/typed after the prefilled prefix
    ["https://instagram.com/instagram.com/usuario", "https://instagram.com/usuario"],
    ["https://instagram.com/www.instagram.com/usuario", "https://instagram.com/usuario"],
    ["https://instagram.com/https://www.instagram.com/usuario/", "https://instagram.com/usuario"],
    // Tracking params from the app's share link
    ["https://www.instagram.com/usuario?igsh=MTIzNDU2", "https://instagram.com/usuario"],
    ["https://instagram.com/usuario/?utm_source=ig_web&utm_medium=copy_link", "https://instagram.com/usuario"],
    ["https://instagram.com/usuario?igshid=x&hl=pt", "https://instagram.com/usuario?hl=pt"],
    ["https://instagram.com/https://www.instagram.com/usuario?igsh=abc", "https://instagram.com/usuario"],
  ];

  it.each(cases)("%s -> %s", (input, expected) => {
    expect(normalizeLinkUrl(input, icon)).toBe(expected);
  });

  it("keeps just the prefix as is (no username to make up)", () => {
    expect(normalizeLinkUrl("https://instagram.com/", icon)).toBe("https://instagram.com/");
  });

  it("falls back to the generic rules for a non-Instagram address", () => {
    expect(normalizeLinkUrl("https://linktr.ee/usuario?igsh=abc", icon)).toBe("https://linktr.ee/usuario?igsh=abc");
    expect(normalizeLinkUrl("meusite.com/insta", icon)).toBe("https://meusite.com/insta");
  });
});
