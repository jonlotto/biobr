import { cn } from "@/lib/utils";

interface BrandIconProps {
  path: string;
  hex: string;
  title?: string;
  className?: string;
}

// Renders a brand logo path (from simple-icons) filled with the brand's
// official color, instead of the monochrome currentColor used by the
// hand-drawn generic icons.
export function BrandIcon({ path, hex, title, className }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill={`#${hex}`}
    >
      {title ? <title>{title}</title> : null}
      <path d={path} />
    </svg>
  );
}
