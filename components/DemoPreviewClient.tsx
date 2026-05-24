"use client";

import { useMemo, useState } from "react";
import { AddRecipeForm } from "@/components/AddRecipeForm";
import { DrinksClient } from "@/components/DrinksClient";
import { FriendsClient } from "@/components/FriendsClient";
import { HomeDashboard } from "@/components/HomeDashboard";
import { NotificationsClient } from "@/components/NotificationsClient";
import { RecipeBrowser } from "@/components/RecipeBrowser";
import { RecipeDetailClient } from "@/components/RecipeDetailClient";
import { useRecipes } from "@/components/RecipeStore";
import { SettingsClient } from "@/components/SettingsClient";

type DemoView =
  | "home"
  | "recipes"
  | "recipe-detail"
  | "recipe-form"
  | "drinks"
  | "friends"
  | "notifications"
  | "settings";

const demoViews: Array<{ label: string; value: DemoView }> = [
  { label: "Home", value: "home" },
  { label: "Recipes", value: "recipes" },
  { label: "Detail", value: "recipe-detail" },
  { label: "Form", value: "recipe-form" },
  { label: "Drinks", value: "drinks" },
  { label: "Friends", value: "friends" },
  { label: "Alerts", value: "notifications" },
  { label: "Settings", value: "settings" },
];

export function DemoPreviewClient() {
  const [activeView, setActiveView] = useState<DemoView>("home");
  const { recipes, visibleRecipes } = useRecipes();
  const detailRecipe = useMemo(
    () =>
      visibleRecipes.find((recipe) => recipe.id === "demo-gulab-jamun") ??
      visibleRecipes[0],
    [visibleRecipes],
  );
  const editableRecipe = useMemo(
    () =>
      recipes.find((recipe) => recipe.id === "demo-gulab-jamun") ??
      recipes[0],
    [recipes],
  );

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-stone-200 bg-white/76 p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {demoViews.map((view) => (
            <button
              className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-bold transition ${
                activeView === view.value
                  ? "bg-stone-950 text-white"
                  : "bg-[#fff8ee] text-stone-700 hover:bg-white"
              }`}
              data-testid={`demo-view-${view.value}`}
              key={view.value}
              onClick={() => setActiveView(view.value)}
              type="button"
            >
              {view.label}
            </button>
          ))}
        </div>
      </section>

      {activeView === "home" ? <HomeDashboard /> : null}
      {activeView === "recipes" ? <RecipeBrowser /> : null}
      {activeView === "recipe-detail" && detailRecipe ? (
        <RecipeDetailClient recipeId={detailRecipe.id} />
      ) : null}
      {activeView === "recipe-form" && editableRecipe ? (
        <AddRecipeForm mode="edit" recipe={editableRecipe} />
      ) : null}
      {activeView === "drinks" ? (
        <DrinksClient
          demoCabinetIngredients={[
            "blanco tequila",
            "lime juice",
            "agave",
            "ginger beer",
            "mango pulp",
            "plain yogurt",
            "mint",
            "lemon lime soda",
          ]}
        />
      ) : null}
      {activeView === "friends" ? <FriendsClient /> : null}
      {activeView === "notifications" ? <NotificationsClient /> : null}
      {activeView === "settings" ? <SettingsClient /> : null}
    </div>
  );
}
