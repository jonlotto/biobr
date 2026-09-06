import { useState } from "react";
import { LayoutGrid, Palette, LogOut, ExternalLink, Users, Settings, QrCode, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import biobrLogo from "@/assets/biobr-logo.png";
import { buildSubdomainUrl } from "@/utils/subdomain";
import { QrCodeModal } from "./QrCodeModal";

interface AdminSidebarProps {
  activeSection: "links" | "design" | "settings";
  username?: string;
  onNavigate?: (view: "links" | "design" | "settings") => void;
}

export function AdminSidebar({ activeSection, username, onNavigate }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [qrOpen, setQrOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNavClick = (view: "links" | "design" | "settings") => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      const paths = { links: "/admin", design: "/design", settings: "/settings" };
      navigate(paths[view]);
    }
    setMenuOpen(false);
  };

  return (
    <header className="w-full h-14 border-b border-white/10 bg-black flex items-center px-4 flex-shrink-0 relative z-20">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-black border-white/10 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src={biobrLogo} alt="VtrineBio" className="h-8" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-xl h-11 text-white/80 hover:text-white hover:bg-white/10",
                activeSection === "links" && "bg-white/10 text-white"
              )}
              onClick={() => handleNavClick("links")}
            >
              <LayoutGrid className="h-5 w-5 mr-3" />
              Links
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-xl h-11 text-white/80 hover:text-white hover:bg-white/10",
                activeSection === "design" && "bg-white/10 text-white"
              )}
              onClick={() => handleNavClick("design")}
            >
              <Palette className="h-5 w-5 mr-3" />
              Design
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-xl h-11 text-white/80 hover:text-white hover:bg-white/10",
                activeSection === "settings" && "bg-white/10 text-white"
              )}
              onClick={() => handleNavClick("settings")}
            >
              <Settings className="h-5 w-5 mr-3" />
              Configurações
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl h-11 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => {
                setQrOpen(true);
                setMenuOpen(false);
              }}
              disabled={!username}
            >
              <QrCode className="h-5 w-5 mr-3" />
              QR Code
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-start rounded-xl h-11 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => {
                  navigate("/admin/users");
                  setMenuOpen(false);
                }}
              >
                <Users className="h-5 w-5 mr-3" />
                Usuários
              </Button>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl h-11 text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
              onClick={() => {
                if (username) window.open(buildSubdomainUrl(username), "_blank");
                setMenuOpen(false);
              }}
              disabled={!username}
            >
              <ExternalLink className="h-5 w-5 mr-3" />
              Ver minha página
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl h-11 text-white/60 hover:text-white hover:bg-white/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <img src={biobrLogo} alt="VtrineBio" className="h-7 ml-3" />

      <QrCodeModal open={qrOpen} onOpenChange={setQrOpen} username={username} />
    </header>
  );
}
