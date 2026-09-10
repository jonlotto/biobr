import type { SVGProps } from "react";

interface VerifiedBadgeProps extends SVGProps<SVGSVGElement> {
  title?: string;
  /** Circle fill color - defaults to the blue used on the public page badge. */
  color?: string;
}

// "Verified" seal: two rounded squares overlapped 45° apart form the classic
// scalloped badge silhouette (a generic geometric construction, not a copy
// of any single platform's trademarked vector artwork) with a checkmark on
// top.
export function VerifiedBadge({ className, title = "Verificado", color = "#3B82F6", ...props }: VerifiedBadgeProps) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={title} className={className} {...props}>
      <title>{title}</title>
      <rect x="3" y="3" width="18" height="18" rx="6" fill={color} />
      <rect x="3" y="3" width="18" height="18" rx="6" fill={color} transform="rotate(45 12 12)" />
      <path
        d="M8.5 12.5l2.4 2.4 4.6-5.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
