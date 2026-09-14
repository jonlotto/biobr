import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CardItem } from "@/hooks/useEditorState";
import { getLinkIconComponent } from "@/lib/linkIcons";
import { cn } from "@/lib/utils";

interface CardsCarouselProps {
  cards: CardItem[];
  className?: string;
}

// How long a slide stays up before auto-advancing to the next one.
const AUTO_ADVANCE_INTERVAL_MS = 4000;
// How long after a manual arrow click before auto-advance resumes.
const RESUME_DELAY_MS = 2500;
const SLIDE_TRANSITION = { duration: 0.35, ease: "easeInOut" as const };

// Slides fully in/out horizontally in the direction of travel - forward
// (auto-advance or the right arrow) enters from the right, backward enters
// from the left.
const slideVariants: Variants = {
  enter: (direction: 1 | -1) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 1 | -1) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0 }),
};

function isLightHex(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

// Cards saved before title/subtitle were split only have the old `text`
// field - fall back to it so those cards keep rendering.
function getCardTitle(card: CardItem): string {
  return card.title || (card as unknown as { text?: string }).text || "";
}

// "Cards informativos" block - one full-width slide at a time (icon +
// title + optional subtitle), same width as the page's link buttons.
// Advances on its own at AUTO_ADVANCE_INTERVAL_MS, but clicking an arrow
// pauses that and it resumes on its own a couple seconds after the last
// click. Purely informational - slides are never clickable.
export function CardsCarousel({ cards, className }: CardsCarouselProps) {
  // Paired so a navigation always updates both atomically - the direction
  // decides which way the outgoing/incoming slides travel (see slideVariants).
  const [[index, direction], setSlide] = useState<[number, 1 | -1]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused || cards.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlide(([prev]) => [(prev + 1) % cards.length, 1]);
    }, AUTO_ADVANCE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, cards.length]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const pauseAndScheduleResume = () => {
    setPaused(true);
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };

  const goTo = (step: 1 | -1) => {
    setSlide(([prev]) => [((prev + step) % cards.length + cards.length) % cards.length, step]);
    pauseAndScheduleResume();
  };

  if (cards.length === 0) return null;

  const current = ((index % cards.length) + cards.length) % cards.length;
  const card = cards[current];
  const Icon = getLinkIconComponent(card.icon);
  const bg = card.bgColor || "#EEF2FF";
  const title = getCardTitle(card);
  const subtitle = card.subtitle;
  const autoContrastClass = isLightHex(bg) ? "text-neutral-900" : "text-white";
  const textColorStyle = card.textColor ? { color: card.textColor } : undefined;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full overflow-hidden rounded-2xl shadow-sm">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={card.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SLIDE_TRANSITION}
            className={cn(
              "flex w-full items-center justify-center gap-2 px-10 text-center",
              subtitle ? "py-4" : "py-3",
              !card.textColor && autoContrastClass,
            )}
            style={{ backgroundColor: bg, ...textColorStyle }}
          >
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{title}</p>
              {subtitle && <p className="truncate text-xs opacity-80">{subtitle}</p>}
            </div>
          </motion.div>
        </AnimatePresence>

        {cards.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Card anterior"
              onClick={() => goTo(-1)}
              className={cn(
                "absolute left-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100",
                !card.textColor && autoContrastClass,
              )}
              style={textColorStyle}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo card"
              onClick={() => goTo(1)}
              className={cn(
                "absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100",
                !card.textColor && autoContrastClass,
              )}
              style={textColorStyle}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
