import { ComponentType, SVGProps } from "react";
import { EditorLink } from "@/hooks/useEditorState";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { X } from "lucide-react";

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  urlTemplate: string;
  isPhone?: boolean;
}

interface SocialIconsSectionProps {
  socials: EditorLink[];
  platforms: SocialPlatform[];
  onSelectPlatform: (platform: SocialPlatform, existingSocial?: EditorLink) => void;
  onDeleteSocial: (linkId: string) => void;
}

export function SocialIconsSection({
  socials,
  platforms,
  onSelectPlatform,
  onDeleteSocial,
}: SocialIconsSectionProps) {
  // Create a map of platform id -> existing social link
  const existingSocialsMap = new Map<string, EditorLink>();
  socials.forEach((s) => {
    const platform = platforms.find(
      (p) =>
        s.icon === p.icon ||
        s.icon?.includes(p.id) ||
        s.title?.toLowerCase() === p.name.toLowerCase()
    );
    if (platform) {
      existingSocialsMap.set(platform.id, s);
    }
  });

  return (
    <div className="mt-8 flex flex-col items-center py-8 px-4 bg-card rounded-2xl border border-border">
      <div className="text-center mb-6">
        <h2 className="text-base font-semibold">Ícones de redes sociais</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aparecem no rodapé da sua página, depois dos links.
        </p>
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {platforms.map((platform) => {
            const existingSocial = existingSocialsMap.get(platform.id);
            const isAdded = !!existingSocial;
            const Icon = platform.Icon;

            return (
              <Tooltip key={platform.id}>
                <TooltipTrigger asChild>
                  <div className="relative group">
                    {/* Delete button (appears on hover for added socials) */}
                    {isAdded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSocial(existingSocial.id);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground
                                   rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                                   flex items-center justify-center z-10 hover:bg-destructive/90"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPlatform(platform, existingSocial)}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${isAdded
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isAdded ? `Editar ${platform.name}` : `Adicionar ${platform.name}`}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
