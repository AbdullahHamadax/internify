import React from "react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type Variant = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "label" | "caption";
type Color = "default" | "muted" | "white" | "gradient";
type Weight = "normal" | "medium" | "semibold" | "bold" | "extrabold";

/* ─── Variant definitions ─── */

const variantElements: Record<Variant, string> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  span: "span",
  label: "span",
  caption: "span",
};

const variantStyles: Record<Variant, string> = {
  h1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]",
  h2: "text-3xl sm:text-4xl font-bold",
  h3: "text-xl sm:text-2xl font-bold",
  h4: "text-lg font-bold",
  p: "text-base",
  span: "text-sm",
  label: "text-sm font-medium",
  caption: "text-xs",
};

/* ─── Color definitions ─── */

const colorStyles: Record<Color, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  white: "text-white",
  gradient: "text-brand-gradient",
};

/* ─── Weight definitions ─── */

const weightStyles: Record<Weight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

type TypographyProps<T extends React.ElementType = "p"> = {
  /** Visual style preset — determines size, default weight, and default element. */
  variant?: Variant;
  /** Theme-aware colour token. Defaults to `"default"` (foreground). */
  color?: Color;
  /** Override the default weight that comes with the variant. */
  weight?: Weight;
  /** Render a different HTML element while keeping the variant styling. */
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "color">;

/* ─── Component ─── */

export function Typography<T extends React.ElementType = "p">({
  variant = "p",
  color = "default",
  weight,
  as,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Component = as ?? variantElements[variant];

  return (
    <Component
      className={cn(
        variantStyles[variant],
        colorStyles[color],
        weight && weightStyles[weight],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
