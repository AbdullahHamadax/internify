import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for the brand-mark size. Changing this one value
 * resizes the logo everywhere (navbar, footer, dashboards, auth, splash) so the
 * lockup can never drift out of sync across surfaces again. It's the default
 * height; a caller can still override by passing its own `h-*` in `className`.
 */
const LOGO_SIZE = "h-18";

/**
 * Internify brand mark (handshake icon + wordmark lockup).
 *
 * The primary asset is the full-color PNG (`/InternifyLogo.png`). Its wordmark
 * and outlines are black, so on dark backgrounds it would disappear — for dark
 * mode we swap to the monochrome trace (`/Internify.svg`) rendered white via a
 * CSS mask. One `<Logo>` therefore reads correctly in both themes.
 *
 * Renders at {@link LOGO_SIZE} by default; the intrinsic 577:433 aspect ratio is
 * preserved automatically. Just drop in `<Logo />`.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      {/* Light mode: full-color logo. */}
      <Image
        src="/InternifyLogo.png"
        alt="Internify"
        width={577}
        height={433}
        priority
        className={cn(LOGO_SIZE, "w-auto dark:hidden", className)}
      />
      {/* Dark mode: monochrome mark filled white (color PNG's black text would vanish). */}
      <span
        aria-hidden
        className={cn(
          LOGO_SIZE,
          "hidden aspect-[577/433] w-auto bg-white align-middle dark:inline-block",
          className,
        )}
        style={{
          WebkitMaskImage: "url(/Internify.svg)",
          maskImage: "url(/Internify.svg)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </>
  );
}
