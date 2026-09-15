import { useState, type ComponentType, type SVGProps } from "react";
import { Link2, Palette, BarChart3, Settings, QrCode, ExternalLink, LogOut, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAuth } from "@/hooks/useAuth";
import { buildSubdomainUrl } from "@/utils/subdomain";
import { cn } from "@/lib/utils";
import { QrCodeModal } from "./QrCodeModal";
import type { AdminView } from "@/layouts/AdminLayout";

interface MobileBottomNavProps {
  activeSection: AdminView;
  username?: string;
  onNavigate?: (view: AdminView) => void;
  /** Called before signing out. Return false to cancel. */
  onBeforeNavigate?: () => boolean;
}

const NAV_ITEMS: { view: AdminView; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { view: "links", label: "Links", icon: Link2 },
  { view: "design", label: "Design", icon: Palette },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "settings", label: "Configurações", icon: Settings },
];

const PATHS: Record<AdminView, string> = {
  links: "/admin",
  design: "/design",
  analytics: "/analytics",
  settings: "/settings",
};

export function MobileBottomNav({ activeSection, username, onNavigate, onBeforeNavigate }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [qrOpen, setQrOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNavClick = (view: AdminView) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      navigate(PATHS[view]);
    }
  };

  const handleSignOut = async () => {
    setMoreOpen(false);
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Outer spacer: keeps the floating bar off the screen edges and folds
          the safe-area inset into that margin instead of the bar's own
          background, so the white card never touches the bottom edge. */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <nav
          className="flex items-stretch rounded-2xl border border-black/5 bg-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)]"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors",
                  active ? "text-primary" : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] text-neutral-500 transition-colors hover:text-neutral-800"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </nav>
      </div>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2 text-center sm:text-center">
            <DrawerTitle>Mais opções</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-1 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={!username}
              onClick={() => {
                setMoreOpen(false);
                setQrOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <QrCode className="h-5 w-5" />
              QR Code
            </button>
            <button
              type="button"
              disabled={!username}
              onClick={() => {
                setMoreOpen(false);
                if (username) window.open(buildSubdomainUrl(username), "_blank");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ExternalLink className="h-5 w-5" />
              Ver minha página
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <QrCodeModal open={qrOpen} onOpenChange={setQrOpen} username={username} />
    </>
  );
}
