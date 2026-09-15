import { useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getLinkIconComponent, type IconVariant } from "@/lib/linkIcons";
import { IconPickerGrid } from "@/components/editor/IconPickerGrid";
import { cn } from "@/lib/utils";

interface LinkMediaPickerProps {
  icon: string | null;
  iconVariant: IconVariant | null;
  thumbnailUrl: string | null;
  onChange: (updates: { icon: string | null; iconVariant: IconVariant | null; thumbnailUrl: string | null }) => void;
}

// The small clickable thumbnail shown on an AdminLinkItem card, and the
// icon-or-image panel it opens: upload/drag-and-drop on the left, the shared
// icon library (IconPickerGrid) on the right - picking one always clears the
// other, since a link can only use one or the other.
export function LinkMediaPicker({ icon, iconVariant, thumbnailUrl, onChange }: LinkMediaPickerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const SelectedIcon = getLinkIconComponent(icon);

  const uploadFile = async (file: File) => {
    if (!user) return;

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl",
            // Mobile: anchor near the top with a fixed offset instead of the
            // shared dialog's default true-center (top-[50%] + translate),
            // and cap height against that same offset - centering would only
            // move the box's bottom edge up by half of whatever height gets
            // trimmed off, which isn't reliably enough to clear the fixed
            // MobileBottomNav bar (z-40, `md:hidden`) sitting flush at the
            // bottom of the viewport; anchoring the top instead makes the
            // bottom edge land exactly at `100dvh - reserved`, regardless of
            // viewport height. `dvh` (not `vh`) so mobile Safari's
            // collapsing address bar can't inflate the reserved space.
            "top-4 translate-y-0 max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))]",
            "md:top-[50%] md:translate-y-[-50%] md:max-h-[85vh]",
          )}
        >
          <DialogHeader className="border-b border-border px-4 py-3 pr-10 text-left sm:px-5 sm:py-4">
            <DialogTitle>Ícone ou imagem</DialogTitle>
            <DialogDescription>
              Adicione um ícone ou imagem para chamar mais atenção para este link.
              <br />
              Você pode usar ícone ou imagem, nunca os dois juntos.
            </DialogDescription>
          </DialogHeader>

          {/* Mobile: two rows - the upload block sized to its own (compact)
              content, then the icon column takes whatever's left and scrolls
              on its own (search/tabs stay put, only the grid scrolls) -
              same as the side-by-side desktop layout, just stacked. */}
          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:grid-cols-2 sm:grid-rows-1">
            {/* Upload column */}
            <div className="flex flex-col gap-2 border-b border-border p-4 sm:gap-3 sm:border-b-0 sm:border-r sm:p-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex min-h-[96px] flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-4 text-center transition-colors sm:min-h-[160px] sm:gap-2 sm:p-6",
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
                )}
              >
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Imagem selecionada" className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20" />
                ) : uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
                <p className="text-sm font-medium text-muted-foreground">
                  {uploading ? "Enviando..." : "Arraste ou clique para enviar"}
                </p>
                <p className="hidden text-xs text-muted-foreground sm:block">PNG ou JPG, máximo 2MB</p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar imagem
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!thumbnailUrl}
                  onClick={() => onChange({ icon: null, iconVariant: null, thumbnailUrl: null })}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              </div>
            </div>

            {/* Icon library column */}
            <div className="flex min-h-0 flex-col">
              <IconPickerGrid
                onSelect={(value, variant) => {
                  onChange({ icon: value, iconVariant: variant, thumbnailUrl: null });
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
