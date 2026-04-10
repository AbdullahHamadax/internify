"use client";

import Image from "next/image";

type AccountAvatarProps = {
  role: "student" | "employer";
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
};

export default function AccountAvatar({
  role,
  name,
  imageUrl,
  className = "",
}: AccountAvatarProps) {
  const fallback = (name?.trim().charAt(0) || "U").toUpperCase();
  const backgroundColor = role === "employer" ? "#AB47BC" : "#2563EB";

  return (
    <span
      className={`relative inline-flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center overflow-hidden border-2 bg-[var(--background)] font-black text-white ${className}`.trim()}
      style={{
        backgroundColor,
        borderColor: "var(--foreground)",
        boxShadow: "2px 2px 0 0 var(--foreground)",
      }}
      aria-hidden="true"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="34px"
          className="object-cover"
        />
      ) : (
        <span className="relative z-10 text-[0.8125rem] leading-none">
          {fallback}
        </span>
      )}
    </span>
  );
}
