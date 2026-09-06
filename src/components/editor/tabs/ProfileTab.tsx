import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, ImageIcon, X, Crop } from "lucide-react";
import { EditorProfile } from "@/hooks/useEditorState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { templates } from "@/data/templates";
import { BannerCropModal } from "@/components/editor/BannerCropModal";

interface ProfileTabProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
  focusField?: "avatar" | "username" | "bio" | "banner" | null;
}

export function ProfileTab({ profile, onUpdate, focusField }: ProfileTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const usernameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [initialCropOffsetY, setInitialCropOffsetY] = useState(0);
  const [isNewUpload, setIsNewUpload] = useState(false);

  const template = templates.find((t) => t.slug === profile.templateSlug);
  const hasBanner = template?.hasBanner || false;

  useEffect(() => {
    if (focusField === "username" && usernameRef.current) {
      usernameRef.current.focus();
    } else if (focusField === "bio" && bioRef.current) {
      bioRef.current.focus();
    } else if (focusField === "avatar" && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (focusField === "banner" && bannerInputRef.current) {
      bannerInputRef.current.click();
    }
  }, [focusField]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      onUpdate({ avatarUrl: `${publicUrl}?t=${Date.now()}` });
      toast({
        title: "Avatar atualizado",
        description: "Sua foto foi alterada com sucesso.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível atualizar seu avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Upload original image first
    try {
      const fileName = `${user.id}/banner_original.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const originalUrl = `${publicUrl}?t=${Date.now()}`;
      
      // Save original URL and open crop modal with it
      onUpdate({ bannerOriginalUrl: originalUrl });
      setImageToCrop(originalUrl);
      setInitialCropOffsetY(0);
      setIsNewUpload(true);
      setCropModalOpen(true);
    } catch (error) {
      console.error("Error uploading original banner:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível processar sua imagem.",
        variant: "destructive",
      });
    }
    
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob, offsetY: number) => {
    if (!user) return;

    setCropModalOpen(false);
    setIsUploadingBanner(true);

    try {
      const fileName = `${user.id}/banner.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Save cropped banner URL and the offset for future adjustments
      onUpdate({ 
        bannerUrl: `${publicUrl}?t=${Date.now()}`,
        bannerCropOffsetY: offsetY,
      });
      toast({
        title: "Banner atualizado",
        description: "Sua imagem de capa foi alterada com sucesso.",
      });
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível atualizar seu banner.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBanner(false);
      setImageToCrop(null);
      setIsNewUpload(false);
    }
  };

  const handleRemoveBanner = () => {
    onUpdate({ bannerUrl: null, bannerOriginalUrl: null, bannerCropOffsetY: 0 });
    toast({
      title: "Banner removido",
      description: "Sua imagem de capa foi removida.",
    });
  };

  const handleEditBanner = () => {
    // Use original image for re-cropping, fallback to current banner
    const imageToEdit = profile.bannerOriginalUrl || profile.bannerUrl;
    if (imageToEdit) {
      setImageToCrop(imageToEdit);
      setInitialCropOffsetY(profile.bannerCropOffsetY || 0);
      setIsNewUpload(false);
      setCropModalOpen(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Configure suas informações pessoais que aparecerão na sua página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Upload - Only show if template has banner */}
          {hasBanner && (
            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <div className="relative">
                {profile.bannerUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={profile.bannerUrl}
                      alt="Banner"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploadingBanner}
                      >
                        {isUploadingBanner ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        <span className="ml-2">Nova</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleEditBanner}
                        disabled={isUploadingBanner}
                      >
                        <Crop className="h-4 w-4" />
                        <span className="ml-2">Ajustar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleRemoveBanner}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    {isUploadingBanner ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Clique para adicionar uma imagem de capa</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerSelect}
                />
              </div>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback>
                  {profile.displayName?.charAt(0) || profile.username?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="text-sm text-muted-foreground">
              Clique no ícone para alterar sua foto
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">@usuário</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                ref={usernameRef}
                value={profile.username}
                onChange={(e) => onUpdate({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                placeholder="seunome"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Este será o link da sua página: {profile.username || "seunome"}.vtrinebio.site
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibição</Label>
            <Input
              id="displayName"
              value={profile.displayName}
              onChange={(e) => onUpdate({ displayName: e.target.value })}
              placeholder="Seu Nome"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              ref={bioRef}
              value={profile.bio}
              onChange={(e) => onUpdate({ bio: e.target.value })}
              placeholder="Uma breve descrição sobre você..."
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {profile.bio?.length || 0}/160 caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Crop Modal */}
      {imageToCrop && (
        <BannerCropModal
          open={cropModalOpen}
          onOpenChange={(open) => {
            setCropModalOpen(open);
            if (!open) {
              setImageToCrop(null);
              setIsNewUpload(false);
            }
          }}
          imageSrc={imageToCrop}
          initialOffsetY={initialCropOffsetY}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}