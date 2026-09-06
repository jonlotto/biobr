import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check, Link, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buildSubdomainUrl } from "@/utils/subdomain";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

type QrStyle = "classic" | "transparent";

const STYLES: { key: QrStyle; label: string; description: string }[] = [
  { key: "classic", label: "Clássico", description: "Preto e branco" },
  { key: "transparent", label: "Transparente", description: "QR branco, sem fundo" },
];

interface QrCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
}

export function QrCodeModal({ open, onOpenChange, username }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<QrStyle>("classic");
  const [mode, setMode] = useState<"bio" | "custom">("bio");
  const [customUrl, setCustomUrl] = useState("");
  const [confirmedCustomUrl, setConfirmedCustomUrl] = useState("");
  const bioUrl = username ? buildSubdomainUrl(username) : "";
  const activeUrl = mode === "bio" ? bioUrl : confirmedCustomUrl;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedQrCodes = [] } = useQuery({
    queryKey: ["qr_codes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  const normalizeUrl = (url: string) => {
    let trimmed = url.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const isValidCustom = normalizeUrl(customUrl).length > 8;

  const handleGenerateCustom = async () => {
    const finalUrl = normalizeUrl(customUrl);
    if (!finalUrl || finalUrl.length <= 8) {
      toast.error("Insira um link válido (ex: exemplo.com)");
      return;
    }
    setConfirmedCustomUrl(finalUrl);
    setCustomUrl(finalUrl);

    if (user?.id) {
      const { error } = await supabase.from("qr_codes").insert({
        user_id: user.id,
        url: finalUrl,
        label: new URL(finalUrl).hostname,
        style,
      });
      if (error) {
        toast.error("Erro ao salvar QR Code");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["qr_codes"] });
      toast.success("QR Code gerado e salvo!");
    } else {
      toast.success("QR Code gerado!");
    }
  };

  const handleDeleteQr = async (id: string) => {
    const { error } = await supabase.from("qr_codes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["qr_codes"] });
    toast.success("QR Code removido!");
  };

  const handleSelectSaved = (url: string, savedStyle: string) => {
    setMode("custom");
    setCustomUrl(url);
    setConfirmedCustomUrl(url);
    setStyle(savedStyle === "transparent" ? "transparent" : "classic");
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${mode === "bio" ? username : "custom"}-qrcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR Code baixado!");
  };

  const handleCopy = async () => {
    if (!activeUrl) return;
    await navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isTransparent = style === "transparent";
  const fgColor = isTransparent ? "#ffffff" : "#000000";
  const bgColor = isTransparent ? "rgba(0,0,0,0)" : "#ffffff";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription className="text-white/60">
            Escolha o estilo e escaneie para acessar sua página
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {/* Mode toggle */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setMode("bio")}
              className={`flex-1 rounded-lg border px-3 py-2 text-center transition-all text-sm ${
                mode === "bio"
                  ? "border-[#0137d7] bg-[#0137d7]/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
              }`}
            >
              Minha página
            </button>
            <button
              onClick={() => setMode("custom")}
              className={`flex-1 rounded-lg border px-3 py-2 text-center transition-all text-sm ${
                mode === "custom"
                  ? "border-[#0137d7] bg-[#0137d7]/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
              }`}
            >
              <Link className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
              Link personalizado
            </button>
          </div>

          {/* Custom URL input */}
          {mode === "custom" && (
            <div className="flex gap-2 w-full">
              <Input
                placeholder="exemplo.com"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateCustom()}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <Button
                onClick={handleGenerateCustom}
                disabled={!isValidCustom}
                className="shrink-0"
              >
                Gerar
              </Button>
            </div>
          )}

          {/* Style selector */}
          <div className="flex gap-2 w-full">
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStyle(s.key)}
                className={`flex-1 rounded-lg border px-3 py-2 text-center transition-all text-xs ${
                  style === s.key
                    ? "border-[#0137d7] bg-[#0137d7]/10 text-white"
                    : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                }`}
              >
                <span className="block font-medium">{s.label}</span>
                <span className="block text-[10px] opacity-60">{s.description}</span>
              </button>
            ))}
          </div>

          {/* QR Code with frame */}
          <div className="relative p-6">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] rounded-tl-sm border-white" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] rounded-tr-sm border-white" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] rounded-bl-sm border-white" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] rounded-br-sm border-white" />

            <div ref={canvasRef} className={`p-4 rounded-lg ${isTransparent ? "bg-black/40" : "bg-white"}`}>
              <QRCodeCanvas
                value={activeUrl || "https://placeholder"}
                size={200}
                level="H"
                fgColor={fgColor}
                bgColor={bgColor}
              />
            </div>
          </div>

          <p className="text-sm text-white/50 text-center break-all">{activeUrl}</p>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PNG
            </Button>
          </div>

          {/* Saved QR Codes */}
          {savedQrCodes.length > 0 && (
            <div className="w-full border-t border-white/10 pt-4 mt-2">
              <h4 className="text-sm font-medium text-white/70 mb-3">QR Codes salvos</h4>
              <div className="flex flex-col gap-2">
                {savedQrCodes.map((qr) => (
                  <div
                    key={qr.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 hover:border-white/20 transition-all"
                  >
                    <button
                      onClick={() => handleSelectSaved(qr.url, qr.style || "logo")}
                      className="flex-1 text-left flex items-center gap-2 min-w-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-sm text-white/80 truncate">{qr.label || qr.url}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteQr(qr.id)}
                      className="text-white/30 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
