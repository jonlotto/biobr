import type { ReactNode } from "react";
import { Link2, UserCircle, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  completed: boolean;
  onClick: () => void;
}

function OnboardingCard({ icon, title, subtitle, completed, onClick }: OnboardingCardProps) {
  const card = (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors",
        completed ? "opacity-60" : "hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          completed ? "bg-success/15 text-success" : "bg-accent/10 text-accent",
        )}
      >
        {completed ? <Check className="h-5 w-5" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", completed && "text-muted-foreground line-through")}>{title}</p>
        <p className={cn("text-xs text-muted-foreground", completed && "text-muted-foreground/70")}>
          {completed ? "Concluído" : subtitle}
        </p>
      </div>
      {!completed && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );

  // A completed card is informational only - no click target, no chevron.
  if (completed) return card;

  return (
    <button type="button" onClick={onClick} className="block w-full">
      {card}
    </button>
  );
}

// Accounts created before this date never see the checklist, even if they'd
// otherwise qualify (no link, no profile setup) - there are no old accounts
// relying on this today, so a fixed cutoff is simpler than a "seen it"
// dismissal flag. Bump this only if the feature is intentionally reset.
const ONBOARDING_CUTOFF_DATE = new Date("2026-09-14T00:00:00Z");

interface OnboardingCardsProps {
  /** Card 1: at least one link (button or social) exists. */
  hasLinks: boolean;
  /** Card 2: avatar and display name are both filled in. */
  hasProfileSetup: boolean;
  /** Profile's `created_at` (ISO string) - gates the whole block on ONBOARDING_CUTOFF_DATE. Null (not loaded yet) hides it. */
  createdAt: string | null;
  onAddLink: () => void;
  onPersonalizeProfile: () => void;
}

// Onboarding checklist shown above the links list - reactive to the actual
// profile/links data (not a dismissible "seen it" flag), so it comes back if
// e.g. the user deletes their only link. The whole block disappears once
// both cards are complete, and never shows at all for accounts that predate
// ONBOARDING_CUTOFF_DATE.
export function OnboardingCards({ hasLinks, hasProfileSetup, createdAt, onAddLink, onPersonalizeProfile }: OnboardingCardsProps) {
  if (!createdAt || new Date(createdAt) < ONBOARDING_CUTOFF_DATE) return null;
  if (hasLinks && hasProfileSetup) return null;

  return (
    <div className="space-y-3 mb-6">
      <OnboardingCard
        icon={<Link2 className="h-5 w-5" />}
        title="Cadastre seu primeiro link"
        subtitle="Adicione o link do seu WhatsApp, site ou rede social."
        completed={hasLinks}
        onClick={onAddLink}
      />
      <OnboardingCard
        icon={<UserCircle className="h-5 w-5" />}
        title="Personalize seu perfil"
        subtitle="Adicione uma foto e o nome de exibição."
        completed={hasProfileSetup}
        onClick={onPersonalizeProfile}
      />
    </div>
  );
}
