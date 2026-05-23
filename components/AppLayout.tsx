import { ChefHat } from "lucide-react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { FirebaseAuthProvider } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { RecipeProvider } from "@/components/RecipeStore";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <FirebaseAuthProvider>
      <AuthGate>
        <RecipeProvider>
          <ServiceWorkerRegistration />
          <div className="min-h-dvh">
            <Navigation />

            <div className="lg:pl-72">
              <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fbf5eb]/92 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur lg:hidden">
                <Link className="flex items-center gap-3" href="/">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--tomato)] text-white">
                    <ChefHat aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-serif text-xl leading-none text-stone-950">
                      Miso Hungry
                    </span>
                    <span className="block text-xs font-semibold text-stone-500">
                      Sophie and me
                    </span>
                  </span>
                </Link>
              </header>

              <main className="mx-auto w-full max-w-7xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-12 lg:pt-8">
                {children}
              </main>
            </div>
          </div>
        </RecipeProvider>
      </AuthGate>
    </FirebaseAuthProvider>
  );
}
