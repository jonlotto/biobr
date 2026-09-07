import { getLinkIconComponent, getLinkIconEntry, type IconVariant } from "@/lib/linkIcons";

export const renderIcon = (icon: string | undefined, className = "w-5 h-5 shrink-0", variant?: IconVariant) => {
  if (!icon) return null;
  const Icon = getLinkIconComponent(icon);
  if (Icon) return <Icon className={className} variant={variant} title={getLinkIconEntry(icon)?.label} />;
  return <span className="text-xl shrink-0">{icon}</span>;
};
