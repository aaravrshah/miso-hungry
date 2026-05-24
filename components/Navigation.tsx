"use client";

import {
  BookOpen,
  ChefHat,
  GlassWater,
  Home,
  LogOut,
  Menu,
  PackageSearch,
  PlusCircle,
  Settings,
  ShoppingBasket,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const desktopNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/drinks", label: "Drinks", icon: GlassWater },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/pantry", label: "Pantry", icon: PackageSearch },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket },
  { href: "/add-recipe", label: "Add", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobilePrimaryNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/add-recipe", label: "Add", icon: PlusCircle },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket },
];

const mobileMoreNavItems = [
  { href: "/drinks", label: "Drinks", icon: GlassWater },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/pantry", label: "Pantry", icon: PackageSearch },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const profileHref = profile ? `/profiles/${profile.id}` : "/settings";
  const isMoreActive =
    mobileMoreNavItems.some((item) => isActivePath(pathname, item.href)) ||
    pathname.startsWith("/profiles/");

  async function handleSignOut() {
    await signOut();
    setIsMoreOpen(false);
    router.replace("/");
  }

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
              Sophie and friends
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="mt-10 space-y-2">
          {desktopNavItems.map((item) => {
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
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-stone-700"
            href={profileHref}
          >
            <UserCircle aria-hidden="true" className="h-4 w-4" />
            View profile
          </Link>
          <button
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
            onClick={handleSignOut}
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
        <div className="flex gap-1 overflow-x-auto pb-1">
          {mobilePrimaryNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                className={`flex min-h-14 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-bold transition ${
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
          <button
            className={`flex min-h-14 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-bold transition ${
              isMoreActive || isMoreOpen
                ? "bg-white text-[var(--tomato)] shadow-sm ring-1 ring-stone-200"
                : "text-stone-500"
            }`}
            onClick={() => setIsMoreOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
            <span className="max-w-full truncate">More</span>
          </button>
        </div>
      </nav>

      {isMoreOpen ? (
        <div className="fixed inset-0 z-50 bg-stone-950/35 backdrop-blur-sm lg:hidden">
          <button
            aria-label="Close more menu"
            className="absolute inset-0 h-full w-full"
            onClick={() => setIsMoreOpen(false)}
            type="button"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-stone-200 bg-[#fffaf1] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-xl">
            <div className="mx-auto h-1 w-12 rounded-full bg-stone-300" />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-2xl leading-tight text-stone-950">More</p>
                <p className="mt-1 truncate text-sm font-semibold text-stone-500">
                  {profile?.displayName ?? profile?.email ?? "Miso Hungry"}
                </p>
              </div>
              <button
                aria-label="Close more menu"
                className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500"
                onClick={() => setIsMoreOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <MoreLink
                active={pathname.startsWith("/profiles/")}
                href={profileHref}
                icon={UserCircle}
                label="My profile"
                onClick={() => setIsMoreOpen(false)}
              />
              {mobileMoreNavItems.map((item) => (
                <MoreLink
                  active={isActivePath(pathname, item.href)}
                  href={item.href}
                  icon={item.icon}
                  key={item.href}
                  label={item.label}
                  onClick={() => setIsMoreOpen(false)}
                />
              ))}
              <button
                className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 text-left text-sm font-bold text-[var(--tomato)] shadow-sm"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut aria-hidden="true" className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type MoreLinkProps = {
  active: boolean;
  href: string;
  icon: typeof Home;
  label: string;
  onClick: () => void;
};

function MoreLink({ active, href, icon: Icon, label, onClick }: MoreLinkProps) {
  return (
    <Link
      className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 text-sm font-bold shadow-sm ${
        active
          ? "border-stone-200 bg-white text-[var(--tomato)]"
          : "border-stone-200 bg-white/80 text-stone-700"
      }`}
      href={href}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
      {label}
    </Link>
  );
}
