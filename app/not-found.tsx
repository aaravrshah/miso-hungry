import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white/72 p-6 text-center shadow-sm">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[var(--tomato)] text-white">
        <ChefHat aria-hidden="true" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-serif text-3xl text-stone-950">Page not found</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        That page is not on the menu anymore.
      </p>
      <Link
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white"
        href="/"
      >
        Back home
      </Link>
    </div>
  );
}
