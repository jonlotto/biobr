import type { ComponentType, CSSProperties } from "react";
import { LinkIcon } from "@/components/icons/LinkIcon";
import { CartIcon } from "@/components/icons/CartIcon";
import { StoreIcon } from "@/components/icons/StoreIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { LocationIcon } from "@/components/icons/LocationIcon";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { TwitterIcon } from "@/components/icons/TwitterIcon";
import { BrandIcon } from "@/components/icons/BrandIcon";
import {
  siWhatsapp,
  siInstagram,
  siFacebook,
  siTiktok,
  siPinterest,
  siTelegram,
  siX,
  siYoutube,
  siSpotify,
  siSnapchat,
  siDiscord,
  siTwitch,
  siReddit,
  siGithub,
  siThreads,
  siMedium,
  siVimeo,
  siSoundcloud,
  siTumblr,
  siBehance,
  siDribbble,
  siPatreon,
  siWechat,
  siLine,
  siVk,
  siEtsy,
  siShopify,
  siPaypal,
  siApplemusic,
} from "simple-icons";

// Color variant a link's icon renders in, chosen per-link in the "Biblioteca
// de Ícones" modal (tabs "Colorido"/"Escuro"/"Claro"):
// - "brand" (default): each brand's own official color (simple-icons hex);
//   generic icons render with currentColor, same as before this existed.
// - "dark": every icon forced to solid black, including generics.
// - "light": every icon forced to solid white, including generics.
export type IconVariant = "brand" | "dark" | "light";

type IconComponent = ComponentType<{ className?: string; title?: string; variant?: IconVariant }>;

export interface LinkIconEntry {
  value: string;
  label: string;
  keywords?: string[];
  Icon: IconComponent;
  // Official brand hex color (no leading "#"), only set for brand/social
  // logos - the color used when variant is "brand". Generic icons stay
  // undefined and render with currentColor in that variant.
  color?: string;
}

// Wraps a hand-drawn icon (which renders with fill="currentColor") so it also
// honors the "dark"/"light" variants, by forcing the CSS `color` it inherits
// fill from. Left alone (variant "brand"/undefined), it keeps rendering with
// whatever color the surrounding UI already sets - unchanged from before
// variants existed.
function withVariant(Component: ComponentType<{ className?: string; title?: string; style?: CSSProperties }>): IconComponent {
  return function VariantIcon({ className, title, variant }) {
    const style = variant === "dark" ? { color: "#000000" } : variant === "light" ? { color: "#FFFFFF" } : undefined;
    return <Component className={className} title={title} style={style} />;
  };
}

// Generic/utility icons - hand-drawn, predate this library. Kept as-is so
// already-saved links keep rendering exactly the same way. No brand color:
// these render with the current text/theme color (currentColor) in the
// "brand" variant, and forced black/white in "dark"/"light".
export const GENERIC_ICONS: LinkIconEntry[] = [
  { value: "link-icon", label: "Link", Icon: withVariant(LinkIcon) },
  { value: "cart-icon", label: "Carrinho", Icon: withVariant(CartIcon), keywords: ["loja", "compra", "shop"] },
  { value: "store-icon", label: "Loja", Icon: withVariant(StoreIcon), keywords: ["shop"] },
  { value: "star-icon", label: "Estrela", Icon: withVariant(StarIcon) },
  { value: "location-icon", label: "Localização", Icon: withVariant(LocationIcon), keywords: ["mapa", "endereço"] },
  { value: "email-icon", label: "Email", Icon: withVariant(EmailIcon), keywords: ["e-mail", "mail"] },
];

// Minimal shape of a simple-icons entry, so `brandIcon` also accepts the
// hand-picked LinkedIn fallback below (simple-icons dropped LinkedIn over a
// trademark dispute, same as react-icons/si).
interface BrandIconData {
  title: string;
  path: string;
  hex: string;
}

// Builds a LinkIconEntry's Icon component from simple-icons data: an SVG
// path filled with the brand's own official hex in the "brand" variant
// (instead of currentColor), or forced solid black/white in "dark"/"light".
function brandIcon(icon: BrandIconData): IconComponent {
  return function Icon({ className, title, variant = "brand" }) {
    const hex = variant === "dark" ? "000000" : variant === "light" ? "FFFFFF" : icon.hex;
    return <BrandIcon path={icon.path} hex={hex} title={title ?? icon.title} className={className} />;
  };
}

// LinkedIn's official brand blue - simple-icons (like react-icons/si) has no
// LinkedIn logo due to a trademark dispute, so the path is taken from the
// pre-existing hand-drawn LinkedInIcon and paired with LinkedIn's published
// brand hex to render consistently with the rest of the social icons.
const LINKEDIN_BRAND: BrandIconData = {
  title: "LinkedIn",
  hex: "0A66C2",
  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

// Brand/social logos from simple-icons - each icon is imported individually
// (never the whole package) so the bundle only pays for what's actually used
// here; simple-icons ships `sideEffects: false`, so Vite/Rollup tree-shakes
// away every unused brand. Rendered in each brand's official color (`color`)
// via the SVG path data, instead of a monochrome icon. These use "si-*"
// values so they never collide with the legacy hand-drawn icon values below.
export const SOCIAL_ICONS: LinkIconEntry[] = [
  { value: "si-whatsapp", label: "WhatsApp", Icon: brandIcon(siWhatsapp), color: siWhatsapp.hex },
  { value: "si-instagram", label: "Instagram", Icon: brandIcon(siInstagram), color: siInstagram.hex, keywords: ["insta"] },
  { value: "si-facebook", label: "Facebook", Icon: brandIcon(siFacebook), color: siFacebook.hex, keywords: ["face"] },
  { value: "si-tiktok", label: "TikTok", Icon: brandIcon(siTiktok), color: siTiktok.hex },
  { value: "si-pinterest", label: "Pinterest", Icon: brandIcon(siPinterest), color: siPinterest.hex },
  { value: "si-telegram", label: "Telegram", Icon: brandIcon(siTelegram), color: siTelegram.hex },
  { value: "si-x", label: "X", Icon: brandIcon(siX), color: siX.hex, keywords: ["twitter"] },
  // simple-icons has no LinkedIn logo (removed over a trademark dispute) -
  // falls back to the hand-picked path+color above, kept under the same
  // value so it's not treated as legacy.
  { value: "linkedin-icon", label: "LinkedIn", Icon: brandIcon(LINKEDIN_BRAND), color: LINKEDIN_BRAND.hex },
  { value: "si-youtube", label: "YouTube", Icon: brandIcon(siYoutube), color: siYoutube.hex },
  { value: "si-spotify", label: "Spotify", Icon: brandIcon(siSpotify), color: siSpotify.hex },
  { value: "si-snapchat", label: "Snapchat", Icon: brandIcon(siSnapchat), color: siSnapchat.hex },
  { value: "si-discord", label: "Discord", Icon: brandIcon(siDiscord), color: siDiscord.hex },
  { value: "si-twitch", label: "Twitch", Icon: brandIcon(siTwitch), color: siTwitch.hex },
  { value: "si-reddit", label: "Reddit", Icon: brandIcon(siReddit), color: siReddit.hex },
  { value: "si-github", label: "GitHub", Icon: brandIcon(siGithub), color: siGithub.hex },
  { value: "si-threads", label: "Threads", Icon: brandIcon(siThreads), color: siThreads.hex },
  { value: "si-medium", label: "Medium", Icon: brandIcon(siMedium), color: siMedium.hex },
  { value: "si-vimeo", label: "Vimeo", Icon: brandIcon(siVimeo), color: siVimeo.hex },
  { value: "si-soundcloud", label: "SoundCloud", Icon: brandIcon(siSoundcloud), color: siSoundcloud.hex },
  { value: "si-tumblr", label: "Tumblr", Icon: brandIcon(siTumblr), color: siTumblr.hex },
  { value: "si-behance", label: "Behance", Icon: brandIcon(siBehance), color: siBehance.hex },
  { value: "si-dribbble", label: "Dribbble", Icon: brandIcon(siDribbble), color: siDribbble.hex },
  { value: "si-patreon", label: "Patreon", Icon: brandIcon(siPatreon), color: siPatreon.hex },
  { value: "si-wechat", label: "WeChat", Icon: brandIcon(siWechat), color: siWechat.hex },
  { value: "si-line", label: "LINE", Icon: brandIcon(siLine), color: siLine.hex },
  { value: "si-vk", label: "VK", Icon: brandIcon(siVk), color: siVk.hex },
  { value: "si-etsy", label: "Etsy", Icon: brandIcon(siEtsy), color: siEtsy.hex },
  { value: "si-shopify", label: "Shopify", Icon: brandIcon(siShopify), color: siShopify.hex },
  { value: "si-paypal", label: "PayPal", Icon: brandIcon(siPaypal), color: siPaypal.hex },
  { value: "si-applemusic", label: "Apple Music", Icon: brandIcon(siApplemusic), color: siApplemusic.hex },
];

// Value auto-assigned when a link's type is switched to "WhatsApp" - kept
// as its own export so ButtonEditDrawer doesn't hardcode the string twice.
export const WHATSAPP_DEFAULT_ICON_VALUE = "si-whatsapp";

// Order shown in the "Biblioteca de Ícones" modal: social first (the bulk of
// what people look for), generics after.
export const ICON_PICKER_ENTRIES: LinkIconEntry[] = [...SOCIAL_ICONS, ...GENERIC_ICONS];

// Old hand-drawn brand icons - no longer offered in the picker (superseded
// by the simple-icons versions above), but a link that already saved one
// of these values must keep rendering exactly as it did before (monochrome,
// no brand color).
const LEGACY_ICONS: Record<string, LinkIconEntry> = {
  "whatsapp-icon": { value: "whatsapp-icon", label: "WhatsApp", Icon: withVariant(WhatsAppIcon) },
  "instagram-icon": { value: "instagram-icon", label: "Instagram", Icon: withVariant(InstagramIcon) },
  "tiktok-icon": { value: "tiktok-icon", label: "TikTok", Icon: withVariant(TikTokIcon) },
  "youtube-icon": { value: "youtube-icon", label: "YouTube", Icon: withVariant(YouTubeIcon) },
  "twitter-icon": { value: "twitter-icon", label: "Twitter", Icon: withVariant(TwitterIcon) },
};

const ICON_LOOKUP = new Map<string, LinkIconEntry>(ICON_PICKER_ENTRIES.map((entry) => [entry.value, entry]));

// The saved link's icon `value` (e.g. "si-whatsapp") fully determines both
// its label and its official brand color through this lookup, so every
// render site (editor preview, live preview, public bio page) stays in sync
// automatically instead of needing a second persisted color field that could
// drift out of sync with the icon set here. The color *variant*
// (brand/dark/light) is a separate user choice, independent of the icon
// itself, and is persisted on the link as `iconVariant` - see EditorLink.
export function getLinkIconEntry(value: string | null | undefined): LinkIconEntry | null {
  if (!value) return null;
  return ICON_LOOKUP.get(value) ?? LEGACY_ICONS[value] ?? null;
}

export function getLinkIconComponent(value: string | null | undefined): IconComponent | null {
  return getLinkIconEntry(value)?.Icon ?? null;
}
