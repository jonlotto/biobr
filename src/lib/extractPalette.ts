import { getSwatches } from "colorthief";

export interface ExtractedPalette {
  buttonBgColor: string;
  buttonTextColor: string;
  titleColor: string;
  backgroundColor: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    img.src = url;
  });
}

// Extracts a 4-color suggestion (button background/text, title text, page
// background) from a profile's photo, using colorthief's semantic Vibrant/
// Muted swatches instead of the single dominant color, so the palette has
// contrast between a "background" tone and an "accent" tone instead of
// every field ending up close to the same hue. `.textColor` on each swatch
// is colorthief's own WCAG-aware black/white pick, used for the text colors
// so the suggested pair is always readable.
export async function extractPaletteFromImage(imageUrl: string): Promise<ExtractedPalette> {
  const img = await loadImage(imageUrl);
  const swatches = await getSwatches(img);

  const buttonSwatch = swatches.Vibrant ?? swatches.DarkVibrant ?? swatches.Muted ?? swatches.DarkMuted;
  const bgSwatch = swatches.LightMuted ?? swatches.LightVibrant ?? swatches.Muted;

  if (!buttonSwatch || !bgSwatch) {
    throw new Error("Não foi possível extrair cores dessa imagem.");
  }

  return {
    buttonBgColor: buttonSwatch.color.hex(),
    buttonTextColor: buttonSwatch.color.textColor,
    backgroundColor: bgSwatch.color.hex(),
    titleColor: bgSwatch.color.textColor,
  };
}
