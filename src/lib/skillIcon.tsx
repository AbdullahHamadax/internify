"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import deviconData from "devicon/devicon.json";

/**
 * Centralized skill-icon resolution. Replaces the per-component copies of
 * `getDeviconClass` that were duplicated across the app.
 *
 * Resolution order:
 *   1. Devicon font glyph (bundled, offline) — for any skill devicon knows.
 *   2. Remote Iconify SVG (logos → devicon → simple-icons) — best-effort for
 *      skills devicon lacks (e.g. Seaborn, Google Colab, custom skills).
 *   3. A generic tag glyph — when nothing matches.
 *
 * Visibility: devicon ships some glyphs whose brand color is near-white (e.g.
 * Angular = #FFFFFF) or near-black (e.g. Next.js = #000). Those vanish on the
 * matching theme. We detect those by luminance and render them in the theme's
 * `currentColor` instead of the brand color, so they stay visible on both light
 * and dark. Mid-tone brand colors are kept (they read fine either way).
 */

interface DeviconEntry {
  name: string;
  altnames?: string[];
  versions: { font: string[] };
  color?: string;
}

const DEVICON_LIST = deviconData as DeviconEntry[];

/**
 * Skill name (normalized) → devicon entry name, for cases where the names don't
 * line up on their own (devicon calls Vue "vuejs", AWS "amazonwebservices", …).
 */
const DEVICON_NAME_OVERRIDES: Record<string, string> = {
  vue: "vuejs",
  html: "html5",
  css: "css3",
  reactnative: "react",
  aws: "amazonwebservices",
  gcp: "googlecloud",
  tensorflow: "tensorflow",
};

/** Strip everything but a-z0-9 — matches devicon's compact naming. */
function normalizeCompact(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Slug for remote icon CDNs (Iconify), which use hyphen-separated names. */
function toRemoteSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Relative luminance (0 = black, 1 = white) of a #rgb / #rrggbb color. */
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pick a real, available font version, preferring a plain non-wordmark glyph. */
function pickFontVersion(entry: DeviconEntry): string {
  const fonts = entry.versions?.font ?? [];
  for (const pref of ["plain", "original", "line"]) {
    if (fonts.includes(pref)) return pref;
  }
  return fonts.find((v) => !v.includes("wordmark")) ?? fonts[0] ?? "plain";
}

function findEntry(skill: string): DeviconEntry | null {
  const norm = normalizeCompact(skill);
  if (!norm) return null;
  const overridden = DEVICON_NAME_OVERRIDES[norm];
  if (overridden) {
    return DEVICON_LIST.find((e) => e.name === overridden) ?? null;
  }
  return (
    DEVICON_LIST.find(
      (e) => e.name === norm || e.altnames?.includes(norm),
    ) ?? null
  );
}

type ResolvedIcon =
  | { kind: "devicon"; className: string }
  | { kind: "remote"; sources: string[]; alt: string }
  | { kind: "none" };

export function resolveSkillIcon(skill: string): ResolvedIcon {
  const entry = findEntry(skill);
  if (entry) {
    const version = pickFontVersion(entry);
    const lum = entry.color ? luminance(entry.color) : 0.5;
    // Near-white or near-black brand colors clash with one of the themes —
    // fall back to currentColor (theme-adaptive) for those.
    const useBrandColor = lum <= 0.85 && lum >= 0.06;
    const className = `devicon-${entry.name}-${version}${useBrandColor ? " colored" : ""}`;
    return { kind: "devicon", className };
  }

  const slug = toRemoteSlug(skill);
  if (slug) {
    return {
      kind: "remote",
      alt: skill,
      sources: [
        `https://api.iconify.design/logos:${slug}.svg`,
        `https://api.iconify.design/devicon:${slug}.svg`,
        // simple-icons are monochrome; tint mid-gray so they read on both themes
        `https://api.iconify.design/simple-icons:${slug}.svg?color=%23888888`,
      ],
    };
  }
  return { kind: "none" };
}

interface SkillIconProps {
  skill: string;
  /** Extra classes (typically a text-size utility that drives the glyph size). */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders the best available icon for a skill. Drop-in for the old
 * `getDeviconClass(skill)` + `<i className={...} />` pattern.
 */
export function SkillIcon({ skill, className = "", style }: SkillIconProps) {
  const resolved = resolveSkillIcon(skill);
  const [remoteIdx, setRemoteIdx] = useState(0);

  if (resolved.kind === "devicon") {
    return <i className={`${resolved.className} ${className}`.trim()} style={style} />;
  }

  if (resolved.kind === "remote" && remoteIdx < resolved.sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved.sources[remoteIdx]}
        alt={resolved.alt}
        className={className}
        loading="lazy"
        onError={() => setRemoteIdx((i) => i + 1)}
        style={{
          width: "1em",
          height: "1em",
          display: "inline-block",
          objectFit: "contain",
          verticalAlign: "-0.125em",
          ...style,
        }}
      />
    );
  }

  return <Tag className={className} style={{ width: "1em", height: "1em", ...style }} />;
}
