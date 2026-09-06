import { useEffect, useState, useRef } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorLink } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LinkIcon } from "@/components/icons/LinkIcon";
import { CartIcon } from "@/components/icons/CartIcon";
import { StoreIcon } from "@/components/icons/StoreIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { LocationIcon } from "@/components/icons/LocationIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

const WHATSAPP_ICON_VALUE = "whatsapp-icon";
const LINK_ICON_VALUE = "link-icon";
const CART_ICON_VALUE = "cart-icon";
const STORE_ICON_VALUE = "store-icon";
const STAR_ICON_VALUE = "star-icon";
const LOCATION_ICON_VALUE = "location-icon";

const ICONS = [
  { value: "", label: "Nenhum" },
  { value: WHATSAPP_ICON_VALUE, label: "WhatsApp" },
  { value: LINK_ICON_VALUE, label: "Link" },
  { value: CART_ICON_VALUE, label: "Carrinho" },
  { value: STORE_ICON_VALUE, label: "Loja" },
  { value: STAR_ICON_VALUE, label: "Estrela" },
  { value: LOCATION_ICON_VALUE, label: "Localização" },
];

interface ButtonEditDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Pick<EditorLink, "title" | "url" | "icon" | "isActive"> & { thumbnailUrl?: string | null }) => void;
  initialData?: EditorLink | null;
}

export function ButtonEditDrawer({
  open,
  onClose,
  onSave,
  initialData,
}: ButtonEditDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; url?: string; whatsapp?: string }>({});
  const [uploading, setUploading] = useState(false);
  
  // Button type (link or whatsapp)
  const [buttonType, setButtonType] = useState<"link" | "whatsapp">("link");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  // Icon/Image tab
  const [mediaTab, setMediaTab] = useState<"icon" | "image">("icon");

  // Only (re)initialize the form when the drawer actually opens, not on every
  // change to `initialData` while it stays open — the underlying link's id can
  // change under our feet (e.g. a temp id gets replaced by the real database
  // id after autosave), which would otherwise wipe out in-progress typing.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (initialData) {
      setTitle(initialData.title);
      setIcon(initialData.icon || "");
      setThumbnailUrl(initialData.thumbnailUrl || null);
      
      // Set media tab based on existing data
      if (initialData.thumbnailUrl) {
        setMediaTab("image");
      } else {
        setMediaTab("icon");
      }
      
      // Detect if it's a WhatsApp link
      if (initialData.url?.startsWith("https://wa.me/")) {
        setButtonType("whatsapp");
        try {
          const waUrl = new URL(initialData.url);
          const pathNumber = waUrl.pathname.replace("/", "");
          const message = waUrl.searchParams.get("text") || "";
          // Remove 55 prefix if present (we'll add it automatically)
          const numberWithout55 = pathNumber.startsWith("55") ? pathNumber.slice(2) : pathNumber;
          setWhatsappNumber(numberWithout55);
          setWhatsappMessage(message);
        } catch {
          const rawNumber = initialData.url.replace("https://wa.me/", "").split("?")[0];
          const numberWithout55 = rawNumber.startsWith("55") ? rawNumber.slice(2) : rawNumber;
          setWhatsappNumber(numberWithout55);
          setWhatsappMessage("");
        }
        setUrl("");
      } else {
        setButtonType("link");
        setUrl(initialData.url);
        setWhatsappNumber("");
        setWhatsappMessage("");
      }
    } else {
      setTitle("");
      setUrl("");
      setIcon("");
      setThumbnailUrl(null);
      setButtonType("link");
      setWhatsappNumber("");
      setWhatsappMessage("");
      setMediaTab("icon");
    }
    setErrors({});
  }, [initialData, open]);

  const validateUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  // Phone mask function (XX) XXXXX-XXXX
  const maskPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    
    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : "";
    }
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/button-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setThumbnailUrl(urlData.publicUrl);
      setIcon(""); // Clear icon when image is uploaded
      
      toast({
        title: "Imagem carregada",
        description: "A imagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setThumbnailUrl(null);
  };

  const handleSave = () => {
    const newErrors: { title?: string; url?: string; whatsapp?: string } = {};

    if (!title.trim()) {
      newErrors.title = "O título é obrigatório";
    }

    if (buttonType === "link") {
      if (!url.trim()) {
        newErrors.url = "O link é obrigatório";
      } else if (!validateUrl(url)) {
        newErrors.url = "Digite uma URL válida (ex: https://exemplo.com)";
      }
    } else {
      // WhatsApp validation (10-11 digits without country code)
      const cleanNumber = whatsappNumber.replace(/\D/g, "");
      if (!cleanNumber) {
        newErrors.whatsapp = "O número é obrigatório";
      } else if (cleanNumber.length < 10 || cleanNumber.length > 11) {
        newErrors.whatsapp = "Digite um número válido com DDD (10 ou 11 dígitos)";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let finalUrl: string;
    if (buttonType === "whatsapp") {
      const cleanNumber = whatsappNumber.replace(/\D/g, "");
      // Always prepend 55 (Brazil country code)
      finalUrl = `https://wa.me/55${cleanNumber}`;
      if (whatsappMessage.trim()) {
        finalUrl += `?text=${encodeURIComponent(whatsappMessage.trim())}`;
      }
    } else {
      finalUrl = url.trim();
    }

    onSave({
      title: title.trim(),
      url: finalUrl,
      icon: mediaTab === "image" ? null : (icon || null),
      isActive: initialData?.isActive ?? true,
      thumbnailUrl: mediaTab === "image" ? thumbnailUrl : null,
    });
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm max-h-[85vh] overflow-auto">
          <DrawerHeader>
            <DrawerTitle>
              {initialData ? "Editar Botão" : "Novo Botão"}
            </DrawerTitle>
            <DrawerDescription>
              Configure as informações do botão.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="Ex: Meu Site"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Button Type */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={buttonType}
                onValueChange={(v) => {
                  const newType = v as "link" | "whatsapp";
                  setButtonType(newType);
                  setErrors({});
                  // Auto-set WhatsApp icon when switching to WhatsApp
                  if (newType === "whatsapp" && !icon && !thumbnailUrl) {
                    setIcon(WHATSAPP_ICON_VALUE);
                    setMediaTab("icon");
                  }
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="link" id="type-link" />
                  <Label htmlFor="type-link" className="font-normal cursor-pointer">
                    Link
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="type-whatsapp" />
                  <Label htmlFor="type-whatsapp" className="font-normal cursor-pointer">
                    WhatsApp
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* URL or WhatsApp */}
            {buttonType === "link" ? (
              <div className="space-y-2">
                <Label htmlFor="url">Link (URL) *</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setErrors((prev) => ({ ...prev, url: undefined }));
                  }}
                  placeholder="https://exemplo.com"
                />
                {errors.url && (
                  <p className="text-xs text-destructive">{errors.url}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Número do WhatsApp *</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted border border-input rounded-md text-sm font-medium text-muted-foreground">
                      +55
                    </div>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={maskPhoneNumber(whatsappNumber)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setWhatsappNumber(digits);
                        setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                      }}
                      placeholder="(11) 99999-9999"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite DDD + número (ex: 11 99999-9999)
                  </p>
                  {errors.whatsapp && (
                    <p className="text-xs text-destructive">{errors.whatsapp}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-message">Mensagem pré-definida (opcional)</Label>
                  <Input
                    id="whatsapp-message"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Olá! Vim pelo seu link..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Texto que aparece automaticamente ao abrir a conversa
                  </p>
                </div>
              </div>
            )}

            {/* Icon/Image Selection */}
            <div className="space-y-2">
              <Label className="text-sm">Ícone ou Imagem (opcional)</Label>
              <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "icon" | "image")}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="icon">Ícone</TabsTrigger>
                  <TabsTrigger value="image">Imagem</TabsTrigger>
                </TabsList>

                <TabsContent value="icon" className="mt-3">
                  <div className="flex gap-2 justify-start flex-wrap">
                    {ICONS.map((i) => {
                      const isSelected = icon === i.value || (icon === "" && i.value === "");
                      return (
                        <button
                          key={i.value || "none"}
                          type="button"
                          onClick={() => {
                            setIcon(i.value);
                            setThumbnailUrl(null);
                          }}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-all",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-muted-foreground/50"
                          )}
                          title={i.label}
                        >
                          {i.value === "" && <span className="text-xs text-muted-foreground">—</span>}
                          {i.value === WHATSAPP_ICON_VALUE && <WhatsAppIcon className="w-5 h-5" />}
                          {i.value === LINK_ICON_VALUE && <LinkIcon className="w-5 h-5" />}
                          {i.value === CART_ICON_VALUE && <CartIcon className="w-5 h-5" />}
                          {i.value === STORE_ICON_VALUE && <StoreIcon className="w-5 h-5" />}
                          {i.value === STAR_ICON_VALUE && <StarIcon className="w-5 h-5" />}
                          {i.value === LOCATION_ICON_VALUE && <LocationIcon className="w-5 h-5" />}
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="image" className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {thumbnailUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-muted"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center gap-2 hover:border-muted-foreground/50 transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploading ? "Enviando..." : "Clique para enviar uma imagem"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Máximo 2MB
                      </span>
                    </button>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleSave}>Salvar</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}