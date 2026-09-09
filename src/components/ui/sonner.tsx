import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function SuccessIcon() {
  return (
    <div className="rounded-lg bg-white/5 p-1 text-[#2b9875] backdrop-blur-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="rounded-lg bg-white/5 p-1 text-[#d65563] backdrop-blur-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
    </div>
  );
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{ success: <SuccessIcon />, error: <ErrorIcon /> }}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast cursor-default group-[.toaster]:rounded-lg group-[.toaster]:border-0 group-[.toaster]:bg-[#232531] group-[.toaster]:text-white group-[.toaster]:text-[10px] sm:group-[.toaster]:text-xs",
          error: "type-error",
          title: "text-white",
          description: "group-[.toast]:text-gray-500",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-0 group-[.toast]:bg-transparent group-[.toast]:text-gray-600 group-[.toast]:transition-colors group-[.toast]:ease-linear group-[.toast]:hover:bg-white/5 [.type-error_&]:hover:bg-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
