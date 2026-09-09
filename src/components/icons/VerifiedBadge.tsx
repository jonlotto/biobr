import type { SVGProps } from "react";

interface VerifiedBadgeProps extends SVGProps<SVGSVGElement> {
  title?: string;
  /** Circle fill color - defaults to the blue used on the public page badge. */
  color?: string;
}

// Generic "verified" mark: a plain solid circle with a checkmark, deliberately
// not the scalloped/seal outline used by X/Instagram/Meta's verified badges,
// so it reads as "verified" without reproducing any specific platform's
// trademarked shape.
export function VerifiedBadge({ className, title = "Verificado", color = "#3B82F6", ...props }: VerifiedBadgeProps) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={title} className={className} {...props}>
      <title>{title}</title>
      <circle cx="12" cy="12" r="10" fill={color} />
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
