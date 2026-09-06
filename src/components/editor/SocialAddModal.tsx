import { useState, useEffect, useRef, ComponentType, SVGProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  urlTemplate: string;
  isPhone?: boolean;
}

interface ExistingSocial {
  url: string;
}

interface SocialAddModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (username: string) => void;
  platform: SocialPlatform | null;
  /** Present when this platform is already configured — puts the modal in edit mode. */
  existingSocial?: ExistingSocial | null;
}

// Reverses urlTemplate.replace("{username}"/"{phone}", value) back into the
// raw value, so an existing social link can be re-opened for editing
// pre-filled with its current username/phone instead of a blank field.
function extractValueFromUrl(url: string, template: string, isPhone?: boolean): string {
  const placeholder = isPhone ? "{phone}" : "{username}";
  const idx = template.indexOf(placeholder);
  if (idx === -1) return "";

  const prefix = template.slice(0, idx);
  const suffix = template.slice(idx + placeholder.length);

  let value = url.startsWith(prefix) ? url.slice(prefix.length) : url;
  if (suffix && value.endsWith(suffix)) {
    value = value.slice(0, value.length - suffix.length);
  }

  return isPhone ? value.replace(/\D/g, "") : value;
}

export function SocialAddModal({
  open,
  onClose,
  onSave,
  platform,
  existingSocial,
}: SocialAddModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const isEditing = !!existingSocial;

  // Only (re)initialize when the modal actually opens, not on every render
  // while it stays open — avoids wiping in-progress typing if the underlying
  // link changes identity in the background (see ButtonEditDrawer for the
  // same issue and fix).
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (existingSocial && platform) {
      setValue(extractValueFromUrl(existingSocial.url, platform.urlTemplate, platform.isPhone));
    } else {
      setValue("");
    }
    setError("");
  }, [open, existingSocial, platform]);

  const handleSave = () => {
    if (!value.trim()) {
      setError(platform?.isPhone ? "Digite o número de telefone" : "Digite o nome de usuário");
      return;
    }

    onSave(value.trim());
    setValue("");
  };

  // Phone mask function (XX) XXXXX-XXXX
  const maskPhoneNumber = (phoneValue: string): string => {
    const digits = phoneValue.replace(/\D/g, "").slice(0, 11);
    
    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : "";
    }
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const getPlaceholder = () => {
    if (!platform) return "";
    if (platform.isPhone) return "(11) 99999-9999";
    return "seunome";
  };

  const getPreviewUrl = () => {
    if (!platform || !value) return "";
    if (platform.isPhone) {
      // Always prepend 55 (Brazil country code)
      const cleanDigits = value.replace(/\D/g, "");
      return platform.urlTemplate.replace("{phone}", `55${cleanDigits}`);
    }
    return platform.urlTemplate.replace("{username}", value);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {platform?.Icon ? (
              <platform.Icon className="h-6 w-6" />
            ) : (
              <span className="text-2xl">{platform?.icon}</span>
            )}
            {isEditing ? "Editar" : "Adicionar"} {platform?.name}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Você já tem esta rede social configurada. Atualize os dados abaixo."
              : platform?.isPhone
              ? "Digite seu número de telefone com código do país."
              : "Digite seu nome de usuário na plataforma."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="value">
              {platform?.isPhone ? "Número de telefone" : "Nome de usuário"}
            </Label>
            {platform?.isPhone ? (
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted border border-input rounded-md text-sm font-medium text-muted-foreground">
                  +55
                </div>
                <Input
                  id="value"
                  type="tel"
                  value={maskPhoneNumber(value)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setValue(digits);
                    setError("");
                  }}
                  placeholder={getPlaceholder()}
                  className="flex-1"
                  autoFocus
                />
              </div>
            ) : (
              <Input
                id="value"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                placeholder={getPlaceholder()}
                autoFocus
              />
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {value && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Preview do link:</p>
              <p className="text-sm break-all">{getPreviewUrl()}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{isEditing ? "Salvar" : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
