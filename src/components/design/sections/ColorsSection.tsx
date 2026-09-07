import { useRef, useState } from "react";
import { ImageIcon, Loader2, RotateCcw, Upload, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditorProfile } from "@/hooks/useEditorState";
import { ColorRow } from "@/components/design/ColorPickerPopover";
import { extractPaletteFromImage } from "@/lib/extractPalette";
import { GRADIENT_DIRECTIONS, buildLinearGradient, parseLinearGradient } from "@/lib/color";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ColorsSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

const DEFAULT_GRADIENT = { angle: 135, from: "#667eea", to: "#764ba2" };

// Site background type/color/gradient/image all live on the same
// globalBackgroundColor/globalBackgroundImage fields the old standalone
// "Fundo" category used - this section is a different UI on top of the
// exact same state, not a parallel copy of it, so nothing here needs
// migrating: a gradient or image saved before this section existed reads
// back exactly the same way.
function getBackgroundTab(profile: EditorProfile): "color" | "gradient" | "image" {
  if (profile.globalBackgroundImage) return "image";
  if (profile.globalBackgroundColor?.startsWith("linear-gradient")) return "gradient";
  return "color";
}

export function ColorsSection({ profile, onUpdate }: ColorsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // Draft gradient stops/angle, seeded from whatever's already saved (if it
  // parses as a gradient) so switching to this tab shows the real thing
  // instead of resetting it - only committed to the profile once the user
  // actually touches a stop or the direction.
  const [gradientDraft, setGradientDraft] = useState(() => parseLinearGradient(profile.globalBackgroundColor) ?? DEFAULT_GRADIENT);

  // Prefer the avatar - every profile can have one, while a banner only
  // exists for banner-style header layouts.
  const sourceImage = profile.avatarUrl || profile.bannerUrl;
  const opacity = profile.globalButtonBgOpacity ?? 100;

  // The site background row only reflects a plain color - a gradient or
  // image isn't representable as one circle, so the row falls back to
  // showing its default swatch instead of a wrong color. Picking a color
  // here always overwrites whichever of the two was active.
  const flatBackgroundColor =
    profile.globalBackgroundColor && !profile.globalBackgroundColor.startsWith("linear-gradient")
      ? profile.globalBackgroundColor
      : null;

  const updateGradient = (next: Partial<typeof gradientDraft>) => {
    const merged = { ...gradientDraft, ...next };
    setGradientDraft(merged);
    onUpdate({ globalBackgroundColor: buildLinearGradient(merged), globalBackgroundImage: null });
  };

  const handleGenerateFromImage = async () => {
    if (!sourceImage) return;
    setIsExtracting(true);
    try {
      const palette = await extractPaletteFromImage(sourceImage);
      onUpdate({
        globalButtonBgColor: palette.buttonBgColor,
        globalButtonTextColor: palette.buttonTextColor,
        titleColor: palette.titleColor,
        globalBackgroundColor: palette.backgroundColor,
        globalBackgroundImage: null,
      });
      toast({
        title: "Cores geradas",
        description: "Paleta extraída da sua foto. Ajuste como preferir.",
      });
    } catch (error) {
      console.error("Error extracting palette:", error);
      toast({
        title: "Erro ao gerar cores",
        description: "Não foi possível extrair cores dessa imagem.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Por favor, selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingBg(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      onUpdate({ globalBackgroundImage: urlData.publicUrl, globalBackgroundColor: null });
      toast({ title: "Imagem enviada", description: "Sua imagem de fundo foi atualizada." });
    } catch (error) {
      console.error("Error uploading background:", error);
      toast({ title: "Erro ao enviar", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setIsUploadingBg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    onUpdate({
      titleColor: null,
      globalButtonBgColor: null,
      globalButtonBgOpacity: null,
      globalButtonTextColor: null,
      globalBackgroundColor: null,
      globalBackgroundImage: null,
    });
    setGradientDraft(DEFAULT_GRADIENT);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Cores</h3>
        <p className="text-sm text-muted-foreground">Personalize as cores do texto, dos botões e do fundo</p>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateFromImage}
          disabled={!sourceImage || isExtracting}
          className="w-full justify-center"
        >
          {isExtracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
          Gerar cores a partir da imagem
        </Button>
        {!sourceImage && (
          <p className="text-xs text-muted-foreground">Adicione uma foto de perfil ou banner para usar esta opção.</p>
        )}
      </div>

      <div className="divide-y divide-border rounded-xl border border-border/60 bg-card px-4">
        <ColorRow label="Texto" value={profile.titleColor} defaultValue="#1A1A1A" onChange={(value) => onUpdate({ titleColor: value })} />

        <ColorRow
          label="Cor de fundo do botão"
          value={profile.globalButtonBgColor}
          defaultValue="#FF7F6B"
          onChange={(value) => onUpdate({ globalButtonBgColor: value })}
        />

        <div className="space-y-2 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Opacidade do fundo do botão</span>
            <span className="text-sm tabular-nums text-muted-foreground">{opacity}%</span>
          </div>
          <Slider
            value={[opacity]}
            min={0}
            max={100}
            step={1}
            onValueChange={([next]) => onUpdate({ globalButtonBgOpacity: next })}
          />
        </div>

        <ColorRow
          label="Cor do texto do botão"
          value={profile.globalButtonTextColor}
          defaultValue="#FFFFFF"
          onChange={(value) => onUpdate({ globalButtonTextColor: value })}
        />
      </div>

      {/* Site background - same globalBackgroundColor/globalBackgroundImage
          fields the old "Fundo" category used, just with type (Sólido/
          Gradiente/Imagem) chosen here instead of on its own screen. */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
        <span className="text-sm font-medium">Fundo do site</span>

        <Tabs defaultValue={getBackgroundTab(profile)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="color">Sólido</TabsTrigger>
            <TabsTrigger value="gradient">Gradiente</TabsTrigger>
            <TabsTrigger value="image">Imagem</TabsTrigger>
          </TabsList>

          <TabsContent value="color" className="mt-4">
            <ColorRow
              label="Cor de fundo do site"
              value={flatBackgroundColor}
              defaultValue="#FFFFFF"
              onChange={(value) => onUpdate({ globalBackgroundColor: value, globalBackgroundImage: null })}
            />
          </TabsContent>

          <TabsContent value="gradient" className="mt-4 space-y-1">
            <ColorRow
              label="Cor inicial"
              value={gradientDraft.from}
              defaultValue={DEFAULT_GRADIENT.from}
              onChange={(value) => updateGradient({ from: value })}
            />
            <ColorRow
              label="Cor final"
              value={gradientDraft.to}
              defaultValue={DEFAULT_GRADIENT.to}
              onChange={(value) => updateGradient({ to: value })}
            />
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm font-medium">Direção</span>
              <Select value={String(gradientDraft.angle)} onValueChange={(value) => updateGradient({ angle: Number(value) })}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADIENT_DIRECTIONS.map((direction) => (
                    <SelectItem key={direction.angle} value={String(direction.angle)}>
                      {direction.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-12 w-full rounded-lg border border-border/60" style={{ background: buildLinearGradient(gradientDraft) }} />
          </TabsContent>

          <TabsContent value="image" className="mt-4 space-y-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="hidden" />

            {profile.globalBackgroundImage ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-border">
                <img src={profile.globalBackgroundImage} alt="Fundo" className="w-full aspect-video object-cover" />
                <button
                  type="button"
                  onClick={() => onUpdate({ globalBackgroundImage: null })}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingBg}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-muted/50 transition-all disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-3">
                  {isUploadingBg ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="p-3 bg-muted rounded-full">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{isUploadingBg ? "Enviando..." : "Clique para enviar"}</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
                  </div>
                </div>
              </button>
            )}

            {profile.globalBackgroundImage && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isUploadingBg}>
                <Upload className="h-4 w-4 mr-2" />
                Trocar imagem
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Restaurar padrões
      </Button>
    </div>
  );
}
