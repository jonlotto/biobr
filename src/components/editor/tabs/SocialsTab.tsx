import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditorLink } from "@/hooks/useEditorState";
import { DraggableList } from "../DraggableList";
import { SocialAddModal } from "../SocialAddModal";

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷", urlTemplate: "https://instagram.com/{username}" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬", urlTemplate: "https://wa.me/{phone}", isPhone: true },
  { id: "tiktok", name: "TikTok", icon: "🎵", urlTemplate: "https://tiktok.com/@{username}" },
  { id: "twitter", name: "Twitter/X", icon: "🐦", urlTemplate: "https://x.com/{username}" },
  { id: "youtube", name: "YouTube", icon: "📺", urlTemplate: "https://youtube.com/@{username}" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", urlTemplate: "https://linkedin.com/in/{username}" },
  { id: "github", name: "GitHub", icon: "🐙", urlTemplate: "https://github.com/{username}" },
  { id: "spotify", name: "Spotify", icon: "🎧", urlTemplate: "https://open.spotify.com/user/{username}" },
];

interface SocialsTabProps {
  links: EditorLink[];
  onAdd: (link: Omit<EditorLink, "id" | "order" | "linkType">) => string;
  onUpdate: (id: string, updates: Partial<EditorLink>) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

export function SocialsTab({
  links,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: SocialsTabProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SOCIAL_PLATFORMS[0] | null>(null);

  const handleAddSocial = (platform: typeof SOCIAL_PLATFORMS[0]) => {
    setSelectedPlatform(platform);
  };

  const handleSaveSocial = (username: string) => {
    if (!selectedPlatform) return;

    const url = selectedPlatform.isPhone
      ? selectedPlatform.urlTemplate.replace("{phone}", username.replace(/\D/g, ""))
      : selectedPlatform.urlTemplate.replace("{username}", username);

    onAdd({
      title: selectedPlatform.name,
      url,
      icon: selectedPlatform.icon,
      thumbnailUrl: null,
      style: "filled",
      isActive: true,
      buttonBgColor: null,
      buttonTextColor: null,
      buttonBorderRadius: "rounded-xl",
    });

    setSelectedPlatform(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ícones Sociais</CardTitle>
          <CardDescription>
            Adicione suas redes sociais com ícones rápidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Add Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              // At most one icon per platform: once a platform is added, its
              // button is disabled instead of allowing another one to be
              // created (edit/remove happens via the "Adicionados" list below).
              const isAdded = links.some((l) => l.icon === platform.icon);
              return (
                <Button
                  key={platform.id}
                  variant="outline"
                  size="sm"
                  disabled={isAdded}
                  className="flex flex-col items-center gap-1 h-auto py-3 disabled:opacity-50"
                  onClick={() => handleAddSocial(platform)}
                  title={isAdded ? `${platform.name} já foi adicionado` : undefined}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className="text-xs">{platform.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Added Socials List */}
          {links.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Adicionados</h4>
              <DraggableList
                items={links}
                onReorder={onReorder}
                onEdit={() => {}}
                onDelete={onDelete}
                onToggle={(id, isActive) => onUpdate(id, { isActive })}
                showEdit={false}
                showDuplicate={false}
              />
            </div>
          )}

          {links.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Clique em um ícone acima para adicionar uma rede social.
            </div>
          )}
        </CardContent>
      </Card>

      <SocialAddModal
        open={!!selectedPlatform}
        onClose={() => setSelectedPlatform(null)}
        onSave={handleSaveSocial}
        platform={selectedPlatform}
      />
    </>
  );
}
