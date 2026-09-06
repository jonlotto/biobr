import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useOneSignal } from "@/hooks/useOneSignal";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "biobr_notification_prompt_shown";

interface NotificationWelcomeModalProps {
  userId?: string;
}

export function NotificationWelcomeModal({ userId }: NotificationWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSupported, isLoading, requestPermission, permission } = useOneSignal();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only show if user is logged in, notifications are supported, and hasn't seen the prompt
    if (!userId || !isSupported || isLoading) return;

    // Check if user has already seen this prompt
    const hasSeenPrompt = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    
    if (!hasSeenPrompt && permission === "default") {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [userId, isSupported, isLoading, permission]);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      
      if (result === "granted") {
        toast({
          title: "Notificações ativadas! 🎉",
          description: "Você receberá atualizações importantes sobre seu perfil.",
        });
      } else if (result === "denied") {
        toast({
          title: "Permissão negada",
          description: "Você pode ativar nas configurações do navegador a qualquer momento.",
          variant: "destructive",
        });
      }
    } finally {
      setIsRequesting(false);
      markAsShown();
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    markAsShown();
    setIsOpen(false);
  };

  const markAsShown = () => {
    if (userId) {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, "true");
    }
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Quer receber notificações?
          </DialogTitle>
          <DialogDescription className="text-base">
            Receba avisos importantes sobre visitas ao seu perfil e atualizações do VtrineBio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleEnable} 
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? "Ativando..." : "Ativar notificações"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full text-muted-foreground"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
