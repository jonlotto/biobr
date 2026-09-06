import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPWAProps {
  variant?: "button" | "banner";
  className?: string;
}

export function InstallPWA({ variant = "button", className }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt) return null;

  if (variant === "banner" && showBanner) {
    return (
      <div className={`fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-lg ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">Instalar VtrineBio</p>
            <p className="text-xs text-muted-foreground truncate">
              Adicione à tela inicial para acesso rápido
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" onClick={handleInstall}>
              <Download className="h-4 w-4 mr-1" />
              Instalar
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleInstall} className={className}>
      <Download className="h-4 w-4 mr-2" />
      Instalar App
    </Button>
  );
}
