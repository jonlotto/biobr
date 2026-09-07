import { useState, type ComponentType, type MouseEvent, type SVGProps } from "react";
import { motion } from "framer-motion";
import { Link2, Palette, Settings, Users, QrCode, ExternalLink, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarBody, SidebarLink, Logo, LogoIcon, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { buildSubdomainUrl } from "@/utils/subdomain";
import { cn } from "@/lib/utils";
import { QrCodeModal } from "./QrCodeModal";

interface AdminSidebarProps {
  activeSection: "links" | "design" | "settings";
  username?: string;
  onNavigate?: (view: "links" | "design" | "settings") => void;
  /** Called before navigating away to a different page (Usuários) or signing out. Return false to cancel. */
  onBeforeNavigate?: () => boolean;
}

const NAV_ITEMS: { view: "links" | "design" | "settings"; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { view: "links", label: "Links", icon: Link2 },
  { view: "design", label: "Design", icon: Palette },
  { view: "settings", label: "Configurações", icon: Settings },
];

function SidebarHeader() {
  const { open } = useSidebar();
  return open ? <Logo /> : <LogoIcon />;
}

function SidebarActionButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { open, animate } = useSidebar();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-start gap-2 group/sidebar py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "text-white" : "text-white/70 hover:text-white",
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {label}
      </motion.span>
    </button>
  );
}

export function AdminSidebar({ activeSection, username, onNavigate, onBeforeNavigate }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [qrOpen, setQrOpen] = useState(false);

  const handleNavClick = (view: "links" | "design" | "settings") => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      const paths = { links: "/admin", design: "/design", settings: "/settings" };
      navigate(paths[view]);
    }
  };

  const handleUsersLinkClick = (e: MouseEvent) => {
    if (onBeforeNavigate && !onBeforeNavigate()) {
      e.preventDefault();
    }
  };

  const handleSignOut = async () => {
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <SidebarHeader />

          <div className="mt-8 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarActionButton
                key={item.view}
                icon={item.icon}
                label={item.label}
                active={activeSection === item.view}
                onClick={() => handleNavClick(item.view)}
              />
            ))}

            <SidebarActionButton
              icon={QrCode}
              label="QR Code"
              disabled={!username}
              onClick={() => setQrOpen(true)}
            />

            {isAdmin && (
              <SidebarLink
                className="text-white/70 hover:text-white"
                onClick={handleUsersLinkClick}
                link={{
                  label: "Usuários",
                  href: "/admin/users",
                  icon: <Users className="h-5 w-5 flex-shrink-0" />,
                }}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
          <SidebarActionButton
            icon={ExternalLink}
            label="Ver minha página"
            disabled={!username}
            onClick={() => {
              if (username) window.open(buildSubdomainUrl(username), "_blank");
            }}
          />
          <SidebarActionButton icon={LogOut} label="Sair" onClick={handleSignOut} />
        </div>
      </SidebarBody>

      <QrCodeModal open={qrOpen} onOpenChange={setQrOpen} username={username} />
    </Sidebar>
  );
}
