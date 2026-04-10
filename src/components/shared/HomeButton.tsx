"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type HomeButtonProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
};

const baseClassName =
  "inline-flex items-center gap-2 rounded-none border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase tracking-widest text-black transition-all shadow-[2px_2px_0_0_#000] hover:-translate-y-px hover:-translate-x-px hover:shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-black dark:text-white dark:shadow-[2px_2px_0_0_#fff] dark:hover:shadow-[4px_4px_0_0_#fff]";

export default function HomeButton({
  href,
  onClick,
  className = "",
}: HomeButtonProps) {
  const composedClassName = `${baseClassName} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={composedClassName}>
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={composedClassName}>
      <ArrowLeft className="h-4 w-4" />
      Home
    </button>
  );
}
