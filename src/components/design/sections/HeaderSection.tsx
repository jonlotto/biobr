import { useState } from "react";
import { ImageIcon, Upload, X, Crop, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { VerifiedBadge } from "@/components/icons/VerifiedBadge";
import { EditorProfile } from "@/hooks/useEditorState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BannerCropModal } from "@/components/editor/BannerCropModal";
import { templates } from "@/data/templates";
import { cn } from "@/lib/utils";
import { HEADER_LAYOUTS, resolveHeaderLayout, type HeaderLayout } from "@/lib/headerLayouts";

interface HeaderSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

function LayoutThumb({ layoutId, avatarUrl, primaryColor }: { layoutId: string; avatarUrl: string | null; primaryColor: string }) {
  const avatarNode = avatarUrl ? (
    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-muted-foreground/20">
      <User className="h-3 w-3 text-muted-foreground" />
    </div>
  );

  if (layoutId === "banner") {
    return (
      <div className="relative flex h-full w-full flex-col">
        <div className="h-[55%] w-full" style={{ backgroundColor: primaryColor }} />
        <div className="flex-1 bg-white" />
        <div className="absolute left-1/2 top-[42%] h-6 w-6 -translate-x-1/2 overflow-hidden rounded-full border-2 border-white shadow">
          {avatarNode}
        </div>
      </div>
    );
  }

  if (layoutId === "banner-wave") {
    return (
      <div className="relative flex h-full w-full flex-col">
        <div className="relative h-[55%] w-full overflow-hidden" style={{ backgroundColor: primaryColor }}>
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute bottom-[-1px] left-0 h-3 w-full">
            <path d="M0,20 Q50,0 100,20 L100,20 L0,20 Z" fill="white" />
          </svg>
        </div>
        <div className="flex-1 bg-white" />
        <div className="absolute left-1/2 top-[42%] h-6 w-6 -translate-x-1/2 overflow-hidden rounded-full border-2 border-white shadow">
          {avatarNode}
        </div>
      </div>
    );
  }

  if (layoutId === "banner-card") {
    return (
      <div className="relative flex h-full w-full flex-col">
        <div className="h-[58%] w-full" style={{ backgroundColor: primaryColor }} />
        <div className="flex-1 bg-white" />
        <div className="absolute left-1/2 top-[46%] flex -translate-x-1/2 items-center gap-1 rounded-md border border-border bg-white px-1.5 py-1 shadow">
          <div className="h-3 w-3 shrink-0 overflow-hidden rounded-sm bg-muted-foreground/20">{avatarNode}</div>
          <div className="h-1 w-6 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    );
  }

  if (layoutId === "editorial-badge") {
    return (
      <div className="flex h-full w-full items-center gap-1.5 bg-neutral-900 px-2">
        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40 ring-offset-1 ring-offset-neutral-900">
          {avatarNode}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="h-1 w-8 rounded-full bg-white" />
          <div className="h-1 w-10 rounded-full bg-white/40" />
        </div>
      </div>
    );
  }

  // classic + cutout (cutout is locked, this is just its dimmed placeholder)
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/40">
      <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white shadow">{avatarNode}</div>
      <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
    </div>
  );
}

export function HeaderSection({ profile, onUpdate }: HeaderSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [initialCropOffsetY, setInitialCropOffsetY] = useState(0);

  const template = templates.find((t) => t.slug === profile.templateSlug) || templates[0];
  const selectedLayout = resolveHeaderLayout(profile.headerLayout, !!template.hasBanner, !!template.hasCurvedBanner);

  const handleImageUpload = async (
    file: File,
    type: "avatar" | "banner"
  ) => {
    if (!user) return;

    const setUploading = type === "avatar" ? setIsUploadingAvatar : setIsUploadingBanner;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (type === "avatar") {
        onUpdate({ avatarUrl: urlData.publicUrl });
        toast({
          title: "Upload concluído",
          description: "Avatar atualizado com sucesso!",
        });
      } else {
        // Save as original and open crop modal
        onUpdate({ bannerOriginalUrl: urlData.publicUrl });
        setImageToCrop(urlData.publicUrl);
        setInitialCropOffsetY(0);
        setCropModalOpen(true);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob, offsetY: number) => {
    if (!user) return;

    setCropModalOpen(false);
    setIsUploadingBanner(true);

    try {
      const fileName = `${user.id}/banner-cropped-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      onUpdate({
        bannerUrl: `${urlData.publicUrl}?t=${Date.now()}`,
        bannerCropOffsetY: offsetY,
      });

      toast({
        title: "Banner atualizado",
        description: "Imagem de capa salva com sucesso!",
      });
    } catch (error) {
      console.error("Error saving cropped banner:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o banner.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleEditBanner = () => {
    const imageUrl = profile.bannerOriginalUrl || profile.bannerUrl;
    if (imageUrl) {
      setImageToCrop(imageUrl);
      setInitialCropOffsetY(profile.bannerCropOffsetY || 0);
      setCropModalOpen(true);
    }
  };

  const removeImage = (type: "avatar" | "banner") => {
    if (type === "avatar") {
      onUpdate({ avatarUrl: null });
    } else {
      onUpdate({ bannerUrl: null, bannerOriginalUrl: null });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Header</h3>
        <p className="text-sm text-muted-foreground">
          Configure seu avatar e banner
        </p>
      </div>

      {/* Avatar Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Foto de perfil</label>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="w-20 h-20 border-2 border-border">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {profile.displayName?.charAt(0) || profile.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            {profile.avatarUrl && (
              <button
                onClick={() => removeImage("avatar")}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground
                           rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "avatar");
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={() => document.getElementById("avatar-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploadingAvatar ? "Enviando..." : "Alterar foto"}
            </Button>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Nome de exibição</Label>
        <Input
          id="displayName"
          value={profile.displayName}
          onChange={(e) => onUpdate({ displayName: e.target.value })}
          placeholder="Seu nome"
        />
      </div>

      {/* Bio - the "Selo Editorial" layout renders this as a longer
          descriptive paragraph next to the badge, so it gets more room here
          than the one-liner other layouts show under the avatar. */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          placeholder="Uma breve descrição sobre você..."
          rows={selectedLayout === "editorial-badge" ? 4 : 3}
        />
        <p className="text-xs text-muted-foreground">
          {profile.bio.length}/{selectedLayout === "editorial-badge" ? 300 : 150} caracteres
        </p>
      </div>

      {/* Verified Badge Toggle - free for any shop owner to enable for now,
          no plan restriction. */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Verificado</Label>
            <VerifiedBadge className="h-4 w-4 shrink-0" color="#f97316" />
          </div>
          <p className="text-xs text-muted-foreground">
            Mostra o selo de verificado ao lado do seu nome.
          </p>
        </div>
        <Switch
          checked={profile.showVerifiedBadge}
          onCheckedChange={(checked) => onUpdate({ showVerifiedBadge: checked })}
        />
      </div>

      {/* Layout Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Layout</label>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {HEADER_LAYOUTS.map((layout) => {
            const isSelected = !layout.locked && selectedLayout === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                disabled={layout.locked}
                onClick={() => !layout.locked && onUpdate({ headerLayout: layout.id as HeaderLayout })}
                className={cn(
                  "relative flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-all",
                  isSelected ? "border-primary" : "border-transparent hover:border-border",
                  layout.locked && "cursor-not-allowed opacity-70",
                )}
              >
                <div className="relative h-16 w-full overflow-hidden rounded-lg border border-border">
                  <LayoutThumb layoutId={layout.id} avatarUrl={profile.avatarUrl} primaryColor={template.styles.primaryColor} />
                  {layout.locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{layout.label}</span>
                {layout.locked && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner Section - only relevant for the banner-style layouts, which
          fall back to the theme's own gradient when no image is uploaded.
          "Selo Editorial" uses a solid dark background instead, so it has no
          banner image to configure. */}
      {selectedLayout !== "classic" && selectedLayout !== "editorial-badge" && (
      <div className="space-y-3">
        <label className="text-sm font-medium">Banner</label>
        <div
          className="relative aspect-[8/5] rounded-lg border-2 border-dashed border-border
                     bg-muted/50 overflow-hidden group cursor-pointer hover:border-primary/50
                     transition-colors"
          onClick={() => document.getElementById("banner-upload")?.click()}
        >
          {profile.bannerUrl ? (
            <>
              <img
                src={profile.bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                              transition-opacity flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage("banner");
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground
                           rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-2" />
              <span className="text-sm">Clique para adicionar um banner</span>
            </div>
          )}
        </div>
        <input
          type="file"
          id="banner-upload"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, "banner");
          }}
        />
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            Recomendado: 1200x750px (proporção 8:5)
          </p>
          {profile.bannerUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditBanner();
              }}
            >
              <Crop className="h-4 w-4 mr-2" />
              Ajustar
            </Button>
          )}
        </div>
      </div>
      )}

      <BannerCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={imageToCrop || ""}
        initialOffsetY={initialCropOffsetY}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
