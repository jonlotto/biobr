import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/color";
import { getMinAge, type ContentWarningLevel } from "@/lib/contentWarning";

interface SensitiveContentGateProps {
  level: Exclude<ContentWarningLevel, "none">;
  /** "denied" shows the blocked message in place of the confirm/deny controls - set once the visitor says they're under the age limit (or clicks "Sair" on the "general" level). */
  state?: "gate" | "denied";
  onConfirm: () => void;
  onDeny: () => void;
  /** Two hex colors from the profile's template, used to tint the glass backdrop - falls back to a neutral gradient when not available. */
  themeColors?: { primary: string; accent: string } | null;
  /** "fixed" (default) covers the real browser viewport - the real public page. "absolute" covers the nearest positioned ancestor instead - the editor's phone-frame preview, which `fixed` would break out of. */
  position?: "fixed" | "absolute";
}

const FALLBACK_GRADIENT = "linear-gradient(135deg, rgba(30,41,59,0.6), rgba(15,23,42,0.6))";

// The intermediary screen a visitor sees in front of (not instead of) the
// real bio when its owner has a content warning level set - used both on the
// real public page (BioPage, which keeps rendering the real content blurred
// behind this) and inside the editor's phone preview (BioPreviewContent), so
// a shop owner can see exactly what visitors will see.
export function SensitiveContentGate({
  level,
  state = "gate",
  onConfirm,
  onDeny,
  themeColors,
  position = "fixed",
}: SensitiveContentGateProps) {
  const age = getMinAge(level);
  const isGeneral = level === "general";

  const backdropBackground = themeColors
    ? `linear-gradient(135deg, ${hexToRgba(themeColors.primary, 55)}, ${hexToRgba(themeColors.accent, 55)})`
    : FALLBACK_GRADIENT;

  return (
    <div
      className={cn(
        "inset-0 z-50 flex flex-col items-center justify-center gap-5 px-6 py-12 text-center backdrop-blur-xl",
        position,
      )}
      style={{ background: backdropBackground }}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-black/35 px-6 py-8 shadow-2xl backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
          <EyeOff className="h-6 w-6 text-white" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-white">Conteúdo sensível</h2>
          <p className="text-sm text-white/80">
            Esta bio pode conter conteúdo que não é apropriado para todos os públicos.
          </p>
        </div>

        {state === "denied" ? (
          <p className="text-sm font-medium text-white">
            {isGeneral ? "Este conteúdo não está disponível." : "Este conteúdo não está disponível para a sua idade."}
          </p>
        ) : isGeneral ? (
          <div className="flex w-full flex-col items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="text-sm font-medium text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Sair
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Tenho mais de {age} anos
            </button>
            <button
              type="button"
              onClick={onDeny}
              className="w-full rounded-full px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Tenho menos de {age} anos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
