import { cn } from "@/lib/utils";
import { Link, type LinkProps } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import vtrineWordmark from "@/assets/biobr-logo.png";
import vtrineMark from "@/assets/ft005-logo.png";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  // Same children in both: the hover-to-expand rail on desktop, a top bar +
  // slide-in drawer on mobile.
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar className={props.className}>{props.children as React.ReactNode}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-black w-[300px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Mobile: fixed-height top bar (hamburger + logo) whose hamburger opens the
// very same sidebar content as a 300px drawer from the left, over a dimmed
// backdrop. Shares `open` with the desktop rail (which is hidden on mobile),
// so items render with their labels while it's open. Closes on the backdrop,
// the X, Escape, or any click inside - nav items, QR Code, "Sair" etc. all
// fire-and-dismiss.
export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  return (
    <div className="w-full shrink-0 bg-black pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center text-white"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Logo />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={cn(
                "fixed inset-y-0 left-0 z-[101] flex w-[300px] max-w-[85vw] flex-col bg-black px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]",
                className
              )}
              onClick={() => setOpen(false)}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-2 top-[calc(0.5rem+env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center text-white/70 hover:text-white"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & Omit<LinkProps, "to" | "className">) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-white/80 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

// Logos are plain images, not links: pointer-events-none means no hand
// cursor, hover, tap highlight or long-press image menu (and a tap inside the
// mobile drawer still reaches the drawer, which closes it).
export const Logo = () => {
  return (
    <div className="pointer-events-none flex select-none items-center gap-2 py-1 relative z-20">
      <img src={vtrineMark} alt="" className="h-6 w-6 flex-shrink-0 object-contain" />
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        src={vtrineWordmark}
        alt="Vtrine.bio"
        className="h-4 w-auto object-contain"
      />
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="pointer-events-none flex select-none items-center py-1 relative z-20">
      <img src={vtrineMark} alt="Vtrine" className="h-6 w-6 flex-shrink-0 object-contain" />
    </div>
  );
};
