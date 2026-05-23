"use client";

import {
  BookOpen,
  PackageSearch,
  Pencil,
  Plus,
  Save,
  Search,
  Store,
  Tags,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRecipes } from "@/components/RecipeStore";
import type {
  PantryIngredient,
  PantryIngredientCategory,
  PantryIngredientInput,
} from "@/lib/firebase/schema";
import type { Ingredient, Recipe } from "@/lib/recipes";
import {
  fetchPantryIngredients,
  normalizeIngredientName,
  savePantryIngredient,
} from "@/lib/services/pantryService";

const pantryCategories: PantryIngredientCategory[] = [
  "Produce",
  "Dairy",
  "Protein",
  "Pantry",
  "Spices",
  "Sauces",
  "Baking",
  "Frozen",
  "Other",
];

type IngredientUse = {
  ingredient: Ingredient;
  recipe: Recipe;
};

type PantryListItem = {
  displayName: string;
  normalizedName: string;
  pantryIngredient?: PantryIngredient;
  recipeUses: IngredientUse[];
};

type PantryFormState = {
  category: PantryIngredientCategory | "";
  name: string;
  notes: string;
  preferredBrand: string;
  preferredProductName: string;
  similarBrandsText: string;
  store: string;
  tagsText: string;
};

function listText(value?: string[]) {
  return value?.join(", ") ?? "";
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formStateFromIngredient(item?: PantryListItem): PantryFormState {
  const ingredient = item?.pantryIngredient;

  return {
    category: ingredient?.category ?? "",
    name: ingredient?.name ?? item?.displayName ?? "",
    notes: ingredient?.notes ?? "",
    preferredBrand: ingredient?.preferredBrand ?? "",
    preferredProductName: ingredient?.preferredProductName ?? "",
    similarBrandsText: listText(ingredient?.similarBrands),
    store: ingredient?.store ?? "",
    tagsText: listText(ingredient?.tags),
  };
}

function buildPantryItems({
  pantryIngredients,
  recipes,
}: {
  pantryIngredients: PantryIngredient[];
  recipes: Recipe[];
}) {
  const pantryByNormalizedName = new Map(
    pantryIngredients.map((ingredient) => [ingredient.normalizedName, ingredient]),
  );
  const itemMap = new Map<string, PantryListItem>();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const normalizedName = normalizeIngredientName(ingredient.item);

      if (!normalizedName) {
        return;
      }

      const currentItem = itemMap.get(normalizedName);

      if (currentItem) {
        currentItem.recipeUses.push({ ingredient, recipe });
        return;
      }

      const pantryIngredient = pantryByNormalizedName.get(normalizedName);
      itemMap.set(normalizedName, {
        displayName: pantryIngredient?.name ?? ingredient.item.trim(),
        normalizedName,
        pantryIngredient,
        recipeUses: [{ ingredient, recipe }],
      });
    });
  });

  pantryIngredients.forEach((ingredient) => {
    if (!itemMap.has(ingredient.normalizedName)) {
      itemMap.set(ingredient.normalizedName, {
        displayName: ingredient.name,
        normalizedName: ingredient.normalizedName,
        pantryIngredient: ingredient,
        recipeUses: [],
      });
    }
  });

  return [...itemMap.values()].sort((first, second) =>
    first.displayName.localeCompare(second.displayName),
  );
}

function pantryItemMatches(item: PantryListItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const ingredient = item.pantryIngredient;
  const searchableText = [
    item.displayName,
    ingredient?.preferredBrand,
    ingredient?.preferredProductName,
    ingredient?.store,
    ingredient?.notes,
    ...(ingredient?.similarBrands ?? []),
    ...(ingredient?.tags ?? []),
    ...item.recipeUses.map((use) => use.recipe.title),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function PantryClient() {
  const { recipes, isLoading: recipesLoading } = useRecipes();
  const [pantryIngredients, setPantryIngredients] = useState<PantryIngredient[]>([]);
  const [selectedName, setSelectedName] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [formState, setFormState] = useState<PantryFormState>(() =>
    formStateFromIngredient(),
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoadingPantry, setIsLoadingPantry] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;

    async function loadPantryIngredients() {
      setIsLoadingPantry(true);
      setError(undefined);

      try {
        const nextIngredients = await fetchPantryIngredients();

        if (active) {
          setPantryIngredients(nextIngredients);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load pantry.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingPantry(false);
        }
      }
    }

    window.queueMicrotask(() => {
      loadPantryIngredients();
    });

    return () => {
      active = false;
    };
  }, []);

  const pantryItems = useMemo(
    () => buildPantryItems({ pantryIngredients, recipes }),
    [pantryIngredients, recipes],
  );
  const filteredItems = useMemo(
    () => pantryItems.filter((item) => pantryItemMatches(item, query)),
    [pantryItems, query],
  );
  const selectedItem = selectedName
    ? pantryItems.find((item) => item.normalizedName === selectedName)
    : filteredItems[0];

  useEffect(() => {
    if (isCreatingNew) {
      return;
    }

    if (!selectedName && filteredItems[0]) {
      window.queueMicrotask(() => {
        setSelectedName(filteredItems[0].normalizedName);
      });
      return;
    }

    if (selectedName && !pantryItems.some((item) => item.normalizedName === selectedName)) {
      window.queueMicrotask(() => {
        setSelectedName(filteredItems[0]?.normalizedName);
      });
    }
  }, [filteredItems, isCreatingNew, pantryItems, selectedName]);

  useEffect(() => {
    if (isCreatingNew) {
      return;
    }

    window.queueMicrotask(() => {
      setFormState(formStateFromIngredient(selectedItem));
    });
  }, [isCreatingNew, selectedItem]);

  function updateFormField<Key extends keyof PantryFormState>(
    key: Key,
    value: PantryFormState[Key],
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  }

  async function submitPantryIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);

    const input: PantryIngredientInput = {
      category: formState.category || undefined,
      name: formState.name,
      notes: formState.notes,
      preferredBrand: formState.preferredBrand,
      preferredProductName: formState.preferredProductName,
      similarBrands: textToList(formState.similarBrandsText),
      store: formState.store,
      tags: textToList(formState.tagsText),
    };

    try {
      const savedIngredient = await savePantryIngredient({
        ingredientId: isCreatingNew ? undefined : selectedItem?.pantryIngredient?.id,
        input,
      });
      setPantryIngredients((currentIngredients) => {
        const withoutSavedIngredient = currentIngredients.filter(
          (ingredient) => ingredient.id !== savedIngredient.id,
        );
        return [...withoutSavedIngredient, savedIngredient].sort((first, second) =>
          first.name.localeCompare(second.name),
        );
      });
      setSelectedName(savedIngredient.normalizedName);
      setIsCreatingNew(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save pantry ingredient.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startNewIngredient() {
    setIsCreatingNew(true);
    setSelectedName(undefined);
    setFormState(formStateFromIngredient());
  }

  function selectIngredient(item: PantryListItem) {
    setIsCreatingNew(false);
    setSelectedName(item.normalizedName);
  }

  const activeItem = isCreatingNew ? undefined : selectedItem;
  const recipeUses = activeItem?.recipeUses ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Pantry
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            Ingredient notes and favorite brands
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
            A knowledge base for ingredients used in your recipes, preferred products,
            substitutes, and where to buy them.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm"
          onClick={startNewIngredient}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New ingredient
        </button>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <aside className="space-y-4">
          <label className="relative block">
            <span className="sr-only">Search pantry ingredients</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              className={inputClassName}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ingredients or brands"
              type="search"
              value={query}
            />
          </label>

          <div className="rounded-lg border border-stone-200 bg-white/76 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 p-4">
              <p className="text-sm font-bold text-stone-700">
                {isLoadingPantry || recipesLoading
                  ? "Loading pantry..."
                  : `${filteredItems.length} ingredients`}
              </p>
              <PackageSearch aria-hidden="true" className="h-5 w-5 text-[var(--tomato)]" />
            </div>

            <div className="max-h-[34rem] overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <p className="p-4 text-sm leading-6 text-stone-500">
                  No ingredients found yet. Add a recipe or create a pantry ingredient.
                </p>
              ) : null}

              {filteredItems.map((item) => {
                const active = activeItem?.normalizedName === item.normalizedName;

                return (
                  <button
                    className={`w-full rounded-lg p-3 text-left transition ${
                      active
                        ? "bg-stone-950 text-white"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                    key={item.normalizedName}
                    onClick={() => selectIngredient(item)}
                    type="button"
                  >
                    <span className="block font-serif text-xl leading-tight">
                      {item.displayName}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-semibold ${
                        active ? "text-white/75" : "text-stone-500"
                      }`}
                    >
                      {item.recipeUses.length} recipe
                      {item.recipeUses.length === 1 ? "" : "s"}
                      {item.pantryIngredient ? ", saved notes" : ", recipe-derived"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-white/76 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
                  {isCreatingNew ? "New pantry note" : "Ingredient"}
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-tight text-stone-950">
                  {isCreatingNew ? "Create ingredient" : activeItem?.displayName ?? "Select one"}
                </h2>
              </div>
              {activeItem?.pantryIngredient ? (
                <span className="inline-flex min-h-9 items-center rounded-full bg-stone-100 px-3 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
                  Saved
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoTile
                icon={BookOpen}
                label="Recipes"
                value={`${recipeUses.length}`}
              />
              <InfoTile
                icon={Store}
                label="Store"
                value={activeItem?.pantryIngredient?.store || "Not set"}
              />
              <InfoTile
                icon={PackageSearch}
                label="Brand"
                value={activeItem?.pantryIngredient?.preferredBrand || "Not set"}
              />
              <InfoTile
                icon={Tags}
                label="Category"
                value={activeItem?.pantryIngredient?.category || "Other"}
              />
            </div>
          </section>

          <form
            className="space-y-5 rounded-lg border border-stone-200 bg-white/76 p-5 shadow-sm"
            onSubmit={submitPantryIngredient}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-100 text-rose-700">
                <Pencil aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-serif text-2xl text-stone-950">Pantry details</h3>
                <p className="text-sm text-stone-500">Notes, brands, stores, and tags.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Ingredient name"
                onChange={(value) => updateFormField("name", value)}
                placeholder="soy sauce"
                required
                value={formState.name}
              />
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-700">Category</span>
                <select
                  className={fieldClassName}
                  onChange={(event) =>
                    updateFormField(
                      "category",
                      event.target.value as PantryIngredientCategory | "",
                    )
                  }
                  value={formState.category}
                >
                  <option value="">Not set</option>
                  {pantryCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Preferred brand"
                onChange={(value) => updateFormField("preferredBrand", value)}
                placeholder="Kikkoman"
                value={formState.preferredBrand}
              />
              <TextField
                label="Preferred product"
                onChange={(value) => updateFormField("preferredProductName", value)}
                placeholder="low sodium soy sauce"
                value={formState.preferredProductName}
              />
            </div>

            <TextField
              label="Store / where to buy"
              onChange={(value) => updateFormField("store", value)}
              placeholder="H Mart, Trader Joe's, online"
              value={formState.store}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Similar brands"
                onChange={(value) => updateFormField("similarBrandsText", value)}
                placeholder="Lee Kum Kee, Yamasa"
                value={formState.similarBrandsText}
              />
              <TextField
                label="Tags"
                onChange={(value) => updateFormField("tagsText", value)}
                placeholder="umami, staple, salty"
                value={formState.tagsText}
              />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Notes</span>
              <textarea
                className={`${textareaClassName} min-h-32`}
                onChange={(event) => updateFormField("notes", event.target.value)}
                placeholder="What to buy, what to avoid, good substitutes..."
                value={formState.notes}
              />
            </label>

            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a] sm:w-auto"
              disabled={isSaving}
              type="submit"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save pantry details"}
            </button>
          </form>

          <section className="rounded-lg border border-stone-200 bg-white/76 p-5 shadow-sm">
            <h3 className="font-serif text-2xl text-stone-950">Recipes using this</h3>
            <div className="mt-4 space-y-3">
              {recipeUses.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                  No saved recipes use this ingredient yet.
                </p>
              ) : null}

              {recipeUses.map(({ ingredient, recipe }) => (
                <Link
                  className="block rounded-lg bg-stone-50 p-4 text-sm transition hover:bg-stone-100"
                  href={`/recipes/${recipe.id}`}
                  key={`${recipe.id}-${ingredient.item}-${ingredient.productName ?? ""}`}
                >
                  <span className="font-bold text-stone-950">{recipe.title}</span>
                  <span className="mt-1 block text-stone-600">
                    {[ingredient.quantity, ingredient.unit, ingredient.item]
                      .filter(Boolean)
                      .join(" ")}
                    {ingredient.brand ? `, ${ingredient.brand}` : ""}
                    {ingredient.productName ? `, ${ingredient.productName}` : ""}
                    {ingredient.note ? `, ${ingredient.note}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

const fieldClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

const textareaClassName =
  "w-full resize-y rounded-lg border border-stone-200 bg-white p-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

function TextField({
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <input
        className={fieldClassName}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200">
      <Icon aria-hidden="true" className="h-5 w-5 text-[var(--tomato)]" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </div>
  );
}
