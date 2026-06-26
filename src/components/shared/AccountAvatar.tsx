"use client";

import Image from "next/image";

type AccountAvatarProps = {
  role: "student" | "employer";
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
  /** "cover" for photos, "contain" for logos (avoids cropping wide brand marks). */
  fit?: "cover" | "contain";
  /** When the avatar is a clickable trigger, enable the press-to-flatten hover. */
  interactive?: boolean;
};

export default function AccountAvatar({
  role,
  name,
  imageUrl,
  className = "",
  fit = "cover",
  interactive = false,
}: AccountAvatarProps) {
  const fallback = (name?.trim().charAt(0) || "U").toUpperCase();
  const backgroundColor = role === "employer" ? "#AB47BC" : "#2563EB";

  return (
    <span
      className={`relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden border-2 bg-[var(--background)] font-black text-white shadow-[2px_2px_0_0_var(--foreground)] ${
        interactive
          ? "cursor-pointer transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          : ""
      } ${className}`.trim()}
      style={{
        backgroundColor,
        borderColor: "var(--foreground)",
      }}
      aria-hidden="true"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="36px"
          className={fit === "contain" ? "object-contain bg-white p-0.5" : "object-cover"}
        />
      ) : (
        <span className="relative z-10 text-[0.8125rem] leading-none">
          {fallback}
        </span>
      )}
    </span>
  );
}
