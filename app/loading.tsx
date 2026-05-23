import { ChefHat } from "lucide-react";

export default function Loading() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white/72 p-6 shadow-sm">
      <div className="flex items-center gap-3 text-stone-600">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--tomato)] text-white">
          <ChefHat aria-hidden="true" className="h-5 w-5 animate-pulse" />
        </span>
        <div>
          <p className="font-serif text-2xl text-stone-950">Loading Miso Hungry</p>
          <p className="mt-1 text-sm font-medium text-stone-500">Warming up the kitchen.</p>
        </div>
      </div>
    </div>
  );
}
