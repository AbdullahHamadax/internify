"use client";

import { useEffect, useState } from "react";
import LogoLoop from "@/components/LogoLoop";
import { Typography } from "@/components/ui/Typography";

const baseLogos = [
  { src: "/google.svg", alt: "Google", href: "https://google.com" },
  { src: "/microsoft.svg", alt: "Microsoft", href: "https://microsoft.com" },
  { src: "/ibm.svg", alt: "IBM", href: "https://ibm.com" },
  { src: "/meta.svg", alt: "Meta", href: "https://meta.com" },
];

// Theme-dependent logos: [light variant, dark variant]
const themedLogos = [
  {
    light: "/OpenAI_wordmark_light.svg",
    dark: "/OpenAI_wordmark_dark.svg",
    alt: "OpenAI",
    href: "https://openai.com",
  },
  {
    light: "/Uber_light.svg",
    dark: "/Uber_dark.svg",
    alt: "Uber",
    href: "https://uber.com",
  },
];

export default function PartnerLogos() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains("dark"));

    // Observe class changes on <html> for theme toggles
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const logos = [
    ...baseLogos,
    ...themedLogos.map((logo) => ({
      src: isDark ? logo.dark : logo.light,
      alt: logo.alt,
      href: logo.href,
    })),
  ];

  return (
    <section id="partners" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <Typography
          variant="caption"
          color="muted"
          weight="medium"
          className="uppercase tracking-widest"
        >
          Trusted by leading organizations
        </Typography>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <LogoLoop
            logos={logos}
            speed={100}
            direction="left"
            logoHeight={44}
            gap={50}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            fadeOutColor="var(--logo-fade)"
            ariaLabel="Technology partners"
          />
        </div>
      </div>
    </section>
  );
}
