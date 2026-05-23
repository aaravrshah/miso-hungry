import Link from "next/link";
import { getCategoryByName, type CategoryName } from "@/lib/recipes";

type CategoryPillProps = {
  name: CategoryName | "All";
  active?: boolean;
  count?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function CategoryPill({
  name,
  active = false,
  count,
  href,
  onClick,
  className = "",
}: CategoryPillProps) {
  const category = name === "All" ? undefined : getCategoryByName(name);
  const tone = category?.accent ?? "bg-stone-100 text-stone-800 ring-stone-200";
  const state = active
    ? `${tone} shadow-sm`
    : "bg-white/65 text-stone-700 ring-stone-200 hover:bg-white";
  const classes = `inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${state} ${className}`;
  const content = (
    <>
      <span>{name}</span>
      {typeof count === "number" ? (
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs text-stone-600">
          {count}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <span className={classes}>{content}</span>;
}
