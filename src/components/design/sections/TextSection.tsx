import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorProfile } from "@/hooks/useEditorState";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TextSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

const FONTS = [
  // Sans Serif
  { id: "Inter", label: "Inter", category: "Sans Serif" },
  { id: "Poppins", label: "Poppins", category: "Sans Serif" },
  { id: "Roboto", label: "Roboto", category: "Sans Serif" },
  { id: "Montserrat", label: "Montserrat", category: "Sans Serif" },
  { id: "Lato", label: "Lato", category: "Sans Serif" },
  { id: "Raleway", label: "Raleway", category: "Sans Serif" },
  { id: "Nunito", label: "Nunito", category: "Sans Serif" },
  { id: "Space Grotesk", label: "Space Grotesk", category: "Sans Serif" },
  { id: "DM Sans", label: "DM Sans", category: "Sans Serif" },
  // Serif
  { id: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { id: "Merriweather", label: "Merriweather", category: "Serif" },
  { id: "Lora", label: "Lora", category: "Serif" },
  { id: "Crimson Text", label: "Crimson Text", category: "Serif" },
  // Display
  { id: "Oswald", label: "Oswald", category: "Display" },
  { id: "Bebas Neue", label: "Bebas Neue", category: "Display" },
  { id: "Righteous", label: "Righteous", category: "Display" },
  { id: "Archivo Black", label: "Archivo Black", category: "Display" },
  { id: "Lobster", label: "Lobster", category: "Display" },
  // Handwritten
  { id: "Pacifico", label: "Pacifico", category: "Handwritten" },
  { id: "Dancing Script", label: "Dancing Script", category: "Handwritten" },
  { id: "Caveat", label: "Caveat", category: "Handwritten" },
  { id: "Satisfy", label: "Satisfy", category: "Handwritten" },
];

// Text color used to live here too, but that duplicated the "Texto" row in
// the "Cores" section which now owns it - this screen is typography-only
// (font + size).
export function TextSection({ profile, onUpdate }: TextSectionProps) {
  const selectedFont = FONTS.find(f => f.id === profile.titleFont) || FONTS[0];

  const handleResetText = () => {
    onUpdate({
      titleFont: "Inter",
      titleSize: "large",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Texto</h3>
        <p className="text-sm text-muted-foreground">
          Personalize a tipografia do seu perfil
        </p>
      </div>

      {/* Typography Section */}
      <div>
        <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
          Tipografia
        </h4>

        {/* Font Selector */}
        <div className="space-y-3">
          <Label>Fonte</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full py-3 px-4 bg-muted/50 rounded-xl flex justify-between items-center hover:bg-muted transition-colors">
                <span className="text-sm text-muted-foreground">Fonte</span>
                <span className="font-medium flex items-center gap-1" style={{ fontFamily: selectedFont.id }}>
                  {selectedFont.label}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-60 overflow-y-auto bg-background">
              {FONTS.map((font) => (
                <DropdownMenuItem
                  key={font.id}
                  onClick={() => onUpdate({ titleFont: font.id })}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span style={{ fontFamily: font.id }}>{font.label}</span>
                  {profile.titleFont === font.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title Size */}
        <div className="space-y-3 mt-4">
          <Label>Tamanho do título</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdate({ titleSize: "small" })}
              className={cn(
                "py-3 rounded-xl border-2 font-medium transition-all",
                profile.titleSize === "small"
                  ? "border-primary bg-white"
                  : "border-gray-200 bg-gray-50 text-muted-foreground hover:border-gray-300"
              )}
            >
              Pequeno
            </button>
            <button
              onClick={() => onUpdate({ titleSize: "large" })}
              className={cn(
                "py-3 rounded-xl border-2 font-medium transition-all",
                profile.titleSize === "large"
                  ? "border-primary bg-white"
                  : "border-gray-200 bg-gray-50 text-muted-foreground hover:border-gray-300"
              )}
            >
              Grande
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetText}
          className="w-full mt-4"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar padrões
        </Button>
      </div>
    </div>
  );
}
