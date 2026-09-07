import { useState } from "react";
import { Check, Pencil, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EditorProfile } from "@/hooks/useEditorState";

interface ColorsSectionProps {
  profile: EditorProfile;
  onUpdate: (updates: Partial<EditorProfile>) => void;
}

const PRESET_COLORS = [
  { name: "Coral", value: "#FF7F6B" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#22C55E" },
  { name: "Roxo", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Preto", value: "#1A1A1A" },
  { name: "Branco", value: "#FFFFFF" },
];

function ColorSwatchPicker({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: string | null;
  defaultValue: string;
  onChange: (value: string) => void;
}) {
  const [custom, setCustom] = useState(value || defaultValue);
  const isCustomSelected = value && !PRESET_COLORS.some((c) => c.value === value);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {PRESET_COLORS.map((color) => {
          const isSelected = value === color.value;
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                setCustom(color.value);
                onChange(color.value);
              }}
              className={cn(
                "w-10 h-10 rounded-full border-2 transition-all relative shadow-sm",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 scale-110"
                  : "border-gray-200 hover:border-gray-300 hover:scale-105",
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "absolute inset-0 m-auto h-4 w-4",
                    color.value === "#FFFFFF" ? "text-gray-700" : "text-white",
                  )}
                />
              )}
            </button>
          );
        })}

        <div className="relative">
          <button
            type="button"
            className={cn(
              "w-10 h-10 rounded-full border-2 border-dashed transition-all flex items-center justify-center shadow-sm",
              isCustomSelected
                ? "border-primary ring-2 ring-primary/30 scale-110"
                : "border-gray-300 hover:border-gray-400 hover:scale-105",
            )}
            style={{ backgroundColor: isCustomSelected ? custom : "transparent" }}
            title="Cor personalizada"
          >
            {isCustomSelected ? (
              <Check className="h-4 w-4 text-white mix-blend-difference" />
            ) : (
              <Pencil className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <input
            type="color"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              onChange(e.target.value);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export function ColorsSection({ profile, onUpdate }: ColorsSectionProps) {
  const handleReset = () => {
    onUpdate({
      globalButtonBgColor: null,
      globalButtonTextColor: null,
      titleColor: null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Cores</h3>
        <p className="text-sm text-muted-foreground">Personalize as cores dos botões e do texto</p>
      </div>

      <ColorSwatchPicker
        label="Cor de fundo dos botões"
        value={profile.globalButtonBgColor}
        defaultValue="#FF7F6B"
        onChange={(value) => onUpdate({ globalButtonBgColor: value })}
      />

      <ColorSwatchPicker
        label="Cor do texto dos botões"
        value={profile.globalButtonTextColor}
        defaultValue="#FFFFFF"
        onChange={(value) => onUpdate({ globalButtonTextColor: value })}
      />

      <ColorSwatchPicker
        label="Cor do título/texto"
        value={profile.titleColor}
        defaultValue="#1A1A1A"
        onChange={(value) => onUpdate({ titleColor: value })}
      />

      <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Restaurar padrões
      </Button>
    </div>
  );
}
