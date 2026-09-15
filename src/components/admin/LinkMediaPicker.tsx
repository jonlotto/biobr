import { useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getLinkIconComponent, type IconVariant } from "@/lib/linkIcons";
import { IconLibraryModal } from "@/components/editor/IconLibraryModal";
import { cn } from "@/lib/utils";

interface LinkMediaPickerProps {
  icon: string | null;
  iconVariant: IconVariant | null;
  thumbnailUrl: string | null;
  onChange: (updates: { icon: string | null; iconVariant: IconVariant | null; thumbnailUrl: string | null }) => void;
}

// The small clickable thumbnail shown on an AdminLinkItem card, and the
// icon-library/image-upload popover it opens - extracted from the old
// ButtonEditDrawer's "Ícone ou Imagem" section so the same upload/pick logic
// works inline in the card instead of a separate edit dialog.
export function LinkMediaPicker({ icon, iconVariant, thumbnailUrl, onChange }: LinkMediaPickerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<"icon" | "image">(thumbnailUrl ? "image" : "icon");
  const [iconLibraryOpen, setIconLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const SelectedIcon = getLinkIconComponent(icon);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Tipo inválido", description: "Por favor, selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/button-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      onChange({ icon: null, iconVariant: null, thumbnailUrl: urlData.publicUrl });
      toast({ title: "Imagem carregada", description: "A imagem foi enviada com sucesso." });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Erro ao enviar", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted transition-colors hover:border-muted-foreground/50",
              iconVariant === "light" && "bg-neutral-900",
            )}
            title="Ícone ou imagem do bloco"
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : SelectedIcon ? (
              <SelectedIcon className="h-4 w-4" variant={iconVariant || "brand"} />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "icon" | "image")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="icon">Ícone</TabsTrigger>
              <TabsTrigger value="image">Imagem</TabsTrigger>
            </TabsList>

            <TabsContent value="icon" className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setIconLibraryOpen(true);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-muted p-2.5 text-left transition-colors hover:border-muted-foreground/50"
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconVariant === "light" ? "bg-neutral-900" : "bg-muted")}>
                  {SelectedIcon ? <SelectedIcon className="h-4 w-4" variant={iconVariant || "brand"} /> : <span className="text-xs text-muted-foreground">—</span>}
                </span>
                <span className="text-sm font-medium">Escolher ícone</span>
              </button>
            </TabsContent>

            <TabsContent value="image" className="mt-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {thumbnailUrl ? (
                <div className="relative inline-block">
                  <img src={thumbnailUrl} alt="Thumbnail" className="h-16 w-16 rounded-lg border border-muted object-cover" />
                  <button
                    type="button"
                    onClick={() => onChange({ icon: null, iconVariant: null, thumbnailUrl: null })}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-muted p-4 transition-colors hover:border-muted-foreground/50"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">{uploading ? "Enviando..." : "Enviar imagem (máx. 2MB)"}</span>
                </button>
              )}
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      <IconLibraryModal
        open={iconLibraryOpen}
        onClose={() => setIconLibraryOpen(false)}
        onSelect={(value, variant) => {
          onChange({ icon: value, iconVariant: variant, thumbnailUrl: null });
          setIconLibraryOpen(false);
        }}
      />
    </>
  );
}
