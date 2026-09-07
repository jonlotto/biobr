import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export interface PresetColor {
  name: string;
  value: string;
}

// Shared palette for every color row in the "Cores" section - one place to
// add/remove swatches instead of each field keeping its own copy.
export const COLOR_PRESETS: PresetColor[] = [
  { name: "Coral", value: "#FF7F6B" },
  { name: "Laranja", value: "#F97316" },
  { name: "Amarelo", value: "#FACC15" },
  { name: "Verde", value: "#22C55E" },
  { name: "Menta", value: "#14B8A6" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Índigo", value: "#6366F1" },
  { name: "Roxo", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Cinza", value: "#6B7280" },
  { name: "Preto", value: "#1A1A1A" },
  { name: "Branco", value: "#FFFFFF" },
];

interface ColorRowProps {
  label: string;
  value: string | null;
  defaultValue: string;
  onChange: (value: string) => void;
}

// One line: label on the left, a click-to-open color circle on the right.
// The popover splits presets (a grid of swatches, ring around the selected
// one) from "Custom" (free hex input + native color picker) - replacing the
// always-visible swatch grid + hex field that used to sit inline under every
// field.
export function ColorRow({ label, value, defaultValue, onChange }: ColorRowProps) {
  const current = value || defaultValue;
  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(current);

  // Refresh the draft from the committed value each time the popover opens,
  // so it doesn't show a stale in-progress hex from a previous open.
  const handleOpenChange = (next: boolean) => {
    if (next) setHexDraft(current);
    setOpen(next);
  };

  const handleHexInput = (raw: string) => {
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    if (!/^#[0-9A-Fa-f]{0,6}$/.test(withHash)) return;
    setHexDraft(withHash);
    if (withHash.length === 7) onChange(withHash);
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: current }}
            aria-label={`Escolher cor - ${label}`}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <Tabs defaultValue="presets">
            <TabsList className="mb-3 grid w-full grid-cols-2">
              <TabsTrigger value="presets">Cores</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-0">
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PRESETS.map((color) => {
                  const isSelected = current.toLowerCase() === color.value.toLowerCase();
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        onChange(color.value);
                        setHexDraft(color.value);
                      }}
                      className={cn(
                        "relative h-8 w-8 rounded-full border transition-all",
                        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-popover" : "border-black/10 hover:scale-105",
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check
                          className={cn(
                            "absolute inset-0 m-auto h-3.5 w-3.5",
                            color.value === "#FFFFFF" ? "text-gray-700" : "text-white",
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-0">
              <div className="flex items-center gap-3">
                <div
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(hexDraft) ? hexDraft : current }}
                >
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(hexDraft) ? hexDraft : current}
                    onChange={(e) => {
                      setHexDraft(e.target.value);
                      onChange(e.target.value);
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Selecionar cor personalizada"
                  />
                </div>
                <Input
                  value={hexDraft.toUpperCase()}
                  onChange={(e) => handleHexInput(e.target.value)}
                  placeholder="#FFFFFF"
                  className="font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
