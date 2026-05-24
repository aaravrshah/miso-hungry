"use client";

type UserAvatarProps = {
  className?: string;
  displayName?: string | null;
  photoURL?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "h-10 w-10 text-lg",
  md: "h-12 w-12 text-xl",
  lg: "h-16 w-16 text-3xl",
  xl: "h-20 w-20 text-4xl",
};

export function UserAvatar({
  className = "",
  displayName,
  photoURL,
  size = "md",
}: UserAvatarProps) {
  const initial = String(displayName || "Cook").slice(0, 1).toUpperCase();
  const baseClasses = `${sizeClasses[size]} shrink-0 rounded-full object-cover ring-1 ring-stone-200 ${className}`;

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className={baseClasses} src={photoURL} />
    );
  }

  return (
    <span
      className={`grid place-items-center bg-stone-100 font-serif text-stone-700 ${baseClasses}`}
    >
      {initial}
    </span>
  );
}
