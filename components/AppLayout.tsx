"use client";

import { ChefHat } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { FirebaseAuthProvider } from "@/components/AuthProvider";
import { DemoAppLayout } from "@/components/DemoProviders";
import { Navigation } from "@/components/Navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { NotificationProvider } from "@/components/NotificationProvider";
import { RecipeProvider } from "@/components/RecipeStore";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { SocialProvider } from "@/components/SocialProvider";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/demo")) {
    return <DemoAppLayout>{children}</DemoAppLayout>;
  }

  return (
    <FirebaseAuthProvider>
      <AuthGate>
        <SocialProvider>
          <RecipeProvider>
            <NotificationProvider>
              <ServiceWorkerRegistration />
              <div className="min-h-dvh">
                <Navigation />

                <div className="lg:pl-72">
                  <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fbf5eb]/92 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <Link className="flex min-w-0 items-center gap-3" href="/">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--tomato)] text-white">
                          <ChefHat aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-serif text-xl leading-none text-stone-950">
                            Miso Hungry
                          </span>
                          <span className="block truncate text-xs font-semibold text-stone-500">
                            Sophie and friends
                          </span>
                        </span>
                      </Link>
                      <NotificationBell />
                    </div>
                  </header>

                  <main className="mx-auto w-full max-w-7xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pt-6 lg:px-8 lg:pb-12 lg:pt-8">
                    {children}
                  </main>
                </div>
              </div>
            </NotificationProvider>
          </RecipeProvider>
        </SocialProvider>
      </AuthGate>
    </FirebaseAuthProvider>
  );
}
