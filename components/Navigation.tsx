"use client";

import {
  BookOpen,
  ChefHat,
  Home,
  LogOut,
  PackageSearch,
  PlusCircle,
  ShoppingBasket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/pantry", label: "Pantry", icon: PackageSearch },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket },
  { href: "/add-recipe", label: "Add", icon: PlusCircle },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-[#fbf5eb]/92 px-5 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] shadow-sm backdrop-blur lg:flex lg:flex-col">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--tomato)] text-white shadow-sm">
            <ChefHat aria-hidden="true" className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-serif text-2xl leading-none text-stone-950">
              Miso Hungry
            </span>
            <span className="mt-1 block text-sm font-medium text-stone-500">
              Sophie and me
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="mt-10 space-y-2">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-[var(--tomato)] shadow-sm ring-1 ring-stone-200"
                    : "text-stone-600 hover:bg-white/70 hover:text-stone-950"
                }`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-stone-200 bg-white/65 p-4">
          <p className="font-serif text-lg text-stone-950">
            {profile?.displayName ?? "This week"}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Signed in for recipe edits, ratings, and cook logs.
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
            onClick={() => signOut()}
            type="button"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-[#fbf5eb]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(44,36,29,0.08)] backdrop-blur sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(44rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:pb-2 lg:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-bold transition ${
                  active
                    ? "bg-white text-[var(--tomato)] shadow-sm ring-1 ring-stone-200"
                    : "text-stone-500"
                }`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
