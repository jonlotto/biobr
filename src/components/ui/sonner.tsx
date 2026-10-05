import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Top-center - bottom-right (the lib's default) used to collide with
      // the editor's phone-frame preview panel, which also sits at the
      // viewport's bottom-right corner (see EditorPreview.tsx).
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast cursor-default group-[.toaster]:rounded-lg group-[.toaster]:border-0 group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:shadow-md group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-[10px] sm:group-[.toaster]:text-xs",
          title: "text-background",
          description: "group-[.toast]:text-background/70",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-0 group-[.toast]:bg-transparent group-[.toast]:text-background/60 group-[.toast]:transition-colors group-[.toast]:ease-linear group-[.toast]:hover:bg-background/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
