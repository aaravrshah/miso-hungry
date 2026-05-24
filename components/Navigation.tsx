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
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";

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
  { href: "/friends", label: "Friends", icon: Users },
];

const mobileMoreNavItems = [
  { href: "/drinks", label: "Drinks", icon: GlassWater },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket },
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

        <div className="mt-auto rounded-lg border border-stone-200 bg-white/70 p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              displayName={String(profile?.displayName ?? "Cook")}
              photoURL={profile?.photoURL}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate font-serif text-lg leading-tight text-stone-950">
                {profile?.displayName ?? "Cook"}
              </p>
              <p className="truncate text-xs font-semibold text-stone-500">
                {profile?.username ? `@${profile.username}` : (profile?.email ?? "Account")}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700 shadow-sm"
              href={profileHref}
            >
              Profile
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700 shadow-sm"
              href="/settings"
            >
              Settings
            </Link>
          </div>
          <button
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#fff1ea] px-3 text-sm font-bold text-[var(--tomato)]"
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-[#fbf5eb]/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(44,36,29,0.08)] backdrop-blur sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(28rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:pb-2 lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
          {mobilePrimaryNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            const isAdd = item.href === "/add-recipe";

            if (isAdd) {
              return (
                <Link
                  className="group relative -mt-6 flex min-h-[4.5rem] flex-col items-center justify-start gap-1 text-[0.68rem] font-bold text-[var(--tomato)]"
                  href={item.href}
                  key={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-full border-4 border-[#fbf5eb] shadow-lg transition ${
                      active
                        ? "bg-[var(--tomato)] text-white ring-2 ring-[var(--tomato)]/25"
                        : "bg-[var(--tomato)] text-white group-hover:bg-[#a94e3a]"
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-7 w-7" />
                  </span>
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            }

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
          <button
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-bold transition ${
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
                  {profile?.username ? `@${profile.username}` : "Miso Hungry"}
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

            <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  displayName={String(profile?.displayName ?? "Cook")}
                  photoURL={profile?.photoURL}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-xl leading-tight text-stone-950">
                    {profile?.displayName ?? "Cook"}
                  </p>
                  <p className="truncate text-xs font-semibold text-stone-500">
                    {profile?.username
                      ? `@${profile.username}`
                      : (profile?.email ?? "Account")}
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--tomato)] px-3 text-sm font-bold text-white"
                  href={profileHref}
                  onClick={() => setIsMoreOpen(false)}
                >
                  Profile
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
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
