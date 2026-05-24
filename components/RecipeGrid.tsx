import { type Recipe } from "@/lib/recipes";
import { RecipeCard } from "@/components/RecipeCard";

type RecipeGridProps = {
  recipes: Recipe[];
  emptyTitle?: string;
  emptyText?: string;
};

export function RecipeGrid({
  recipes,
  emptyTitle = "No recipes found",
  emptyText = "Try another search or category.",
}: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white/55 px-6 py-12 text-center">
        <h2 className="font-serif text-2xl text-stone-950">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-stone-600">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
