import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorProfile, EditorLink } from "@/hooks/useEditorState";
import { BioPreviewContent } from "@/components/editor/BioPreviewContent";

interface EditorPreviewProps {
  profile: EditorProfile;
  links: EditorLink[];
  onClickElement?: (type: "avatar" | "username" | "bio" | "link" | "banner", linkId?: string) => void;
  /** Passed through to BioPreviewContent - placeholder buttons for a bio with no links yet (Design view only). */
  showExampleButtons?: boolean;
  /**
   * Admin side column: size the phone to the space its parent gives it (the
   * whole frame always visible, no outer scroll) and render the bio at a real
   * phone width, scaled down to fit - see FittedPhone. Off (the default), the
   * frame keeps its original fixed size, as /editor still uses it.
   */
  fitToContainer?: boolean;
}

// Real-phone geometry the fitted preview reproduces: content laid out at
// 390px wide (iPhone 12-15) in a ~9:19.5 frame, capped at that phone's own
// height (844 + the 8px border on each side) so tall screens don't blow it up.
const PHONE_WIDTH = 390;
const FRAME_RATIO = 9 / 19.5;
const FRAME_BORDER = 8;
const MAX_FRAME_HEIGHT = 844 + FRAME_BORDER * 2;

export function EditorPreview({ profile, links, onClickElement, showExampleButtons, fitToContainer }: EditorPreviewProps) {
  const openPreview = () => {
    if (profile.username) {
      window.open(`/${profile.username}`, "_blank");
    }
  };

  const content = (
    <BioPreviewContent profile={profile} links={links} onClickElement={onClickElement} interactive showExampleButtons={showExampleButtons} />
  );

  const openButton = (
    <Button
      variant="outline"
      size="sm"
      className="mt-4 shrink-0"
      onClick={openPreview}
      disabled={!profile.username}
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      Abrir em nova aba
    </Button>
  );

  if (fitToContainer) {
    return (
      <div className="flex h-full w-full flex-col items-center">
        <FittedPhone>{content}</FittedPhone>
        {openButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Phone Frame - height caps at 70dvh (not a fixed 640px) so it shrinks
          on short viewports instead of overflowing its container's
          overflow-hidden ancestors uncontrolled. */}
      <div className="relative w-[320px] h-[min(640px,70dvh)] rounded-[3rem] border-8 border-foreground/20 shadow-2xl overflow-hidden">
        <Notch />
        {content}
      </div>

      {openButton}
    </div>
  );
}

function Notch() {
  return <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />;
}

/**
 * Fills the space left by its flex-column parent with the largest phone frame
 * that fits it, then lays the bio out at PHONE_WIDTH and scales it down into
 * the frame's screen - the exact mobile layout, just smaller, instead of a
 * squeezed one. Sizes come from a ResizeObserver: CSS alone can't both cap a
 * box by width *and* height while keeping its ratio, nor turn a length into
 * the unitless scale() factor.
 *
 * Clicks and scrolling keep working through the transform (browsers map
 * pointer coordinates through it), and the scroller is still
 * BioPreviewContent's own root; its scrollbar is just hidden (see
 * .preview-hide-scrollbar in index.css).
 */
function FittedPhone({ children }: { children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => setArea({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let frame: ReactNode = null;
  if (area && area.width > 0 && area.height > 0) {
    const height = Math.floor(Math.min(area.height, area.width / FRAME_RATIO, MAX_FRAME_HEIGHT));
    const width = Math.floor(height * FRAME_RATIO);
    const scale = (width - FRAME_BORDER * 2) / PHONE_WIDTH;
    const screenHeight = height - FRAME_BORDER * 2;

    frame = (
      // isolate: Safari otherwise skips the rounded overflow clip for
      // transformed children, letting the screen's square corners leak out.
      <div
        className="relative isolate rounded-[3rem] border-8 border-foreground/20 shadow-2xl overflow-hidden"
        style={{ width, height }}
      >
        <Notch />
        <div
          className="preview-hide-scrollbar"
          style={{
            width: PHONE_WIDTH,
            height: screenHeight / scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={areaRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
      {frame}
    </div>
  );
}
