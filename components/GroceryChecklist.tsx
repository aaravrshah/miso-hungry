"use client";

import {
  Check,
  Plus,
  Search,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRecipes } from "@/components/RecipeStore";
import type {
  GroceryItem,
  PantryIngredient,
  PantryIngredientCategory,
  UserProfile,
} from "@/lib/firebase/schema";
import type { Ingredient, Recipe } from "@/lib/recipes";
import {
  fetchGroceryList,
  saveGroceryItems,
} from "@/lib/services/groceryService";
import {
  fetchPantryIngredients,
  normalizeIngredientName,
} from "@/lib/services/pantryService";

const aisleOrder: PantryIngredientCategory[] = [
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

type ManualItemForm = {
  category: PantryIngredientCategory | "";
  name: string;
  notes: string;
  preferredBrand: string;
  productName: string;
  quantity: string;
  unit: string;
};

function emptyManualItemForm(): ManualItemForm {
  return {
    category: "",
    name: "",
    notes: "",
    preferredBrand: "",
    productName: "",
    quantity: "",
    unit: "",
  };
}

function createGroceryItemId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `grocery-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function cleanText(value?: string) {
  return value?.trim() || undefined;
}

function parseNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function combineQuantity(first?: string, second?: string) {
  if (!first) {
    return second;
  }

  if (!second || first === second) {
    return first;
  }

  const firstNumber = parseNumber(first);
  const secondNumber = parseNumber(second);

  if (typeof firstNumber === "number" && typeof secondNumber === "number") {
    return `${firstNumber + secondNumber}`;
  }

  return `${first} + ${second}`;
}

function combineText(first?: string, second?: string) {
  if (!first) {
    return second;
  }

  if (!second || first.includes(second)) {
    return first;
  }

  return `${first}; ${second}`;
}

function findMatchingPantryIngredient(
  pantryIngredients: PantryIngredient[],
  ingredientName: string,
) {
  const normalizedName = normalizeIngredientName(ingredientName);
  return pantryIngredients.find((ingredient) => ingredient.normalizedName === normalizedName);
}

function groceryItemFromRecipeIngredient({
  ingredient,
  pantryIngredient,
  recipe,
}: {
  ingredient: Ingredient;
  pantryIngredient?: PantryIngredient;
  recipe: Recipe;
}): GroceryItem | undefined {
  const name = ingredient.item.trim();

  if (!name) {
    return undefined;
  }

  return {
    id: createGroceryItemId(),
    name,
    quantity: cleanText(ingredient.quantity),
    unit: cleanText(ingredient.unit),
    category: pantryIngredient?.category ?? "Other",
    checked: false,
    recipeIds: [recipe.id],
    preferredBrand: pantryIngredient?.preferredBrand ?? cleanText(ingredient.brand),
    productName: pantryIngredient?.preferredProductName ?? cleanText(ingredient.productName),
    notes: cleanText(ingredient.note),
    createdAt: new Date().toISOString(),
  };
}

function mergeGroceryItems(items: GroceryItem[]) {
  return items.reduce<GroceryItem[]>((mergedItems, item) => {
    const duplicateIndex = mergedItems.findIndex(
      (currentItem) =>
        currentItem.name === item.name && (currentItem.unit ?? "") === (item.unit ?? ""),
    );

    if (duplicateIndex === -1) {
      return [...mergedItems, item];
    }

    const duplicate = mergedItems[duplicateIndex];
    const combinedItem = {
      ...duplicate,
      category:
        duplicate.category && duplicate.category !== "Other"
          ? duplicate.category
          : item.category ?? duplicate.category,
      notes: combineText(duplicate.notes, item.notes),
      preferredBrand: duplicate.preferredBrand ?? item.preferredBrand,
      productName: duplicate.productName ?? item.productName,
      quantity: combineQuantity(duplicate.quantity, item.quantity),
      recipeIds: Array.from(
        new Set([...(duplicate.recipeIds ?? []), ...(item.recipeIds ?? [])]),
      ),
    };

    return mergedItems.map((mergedItem, index) =>
      index === duplicateIndex ? combinedItem : mergedItem,
    );
  }, []);
}

function itemSearchText(item: GroceryItem, recipesById: Map<string, Recipe>) {
  return [
    item.name,
    item.quantity,
    item.unit,
    item.category,
    item.preferredBrand,
    item.productName,
    item.notes,
    ...(item.recipeIds ?? []).map((recipeId) => recipesById.get(recipeId)?.title),
  ]
    .join(" ")
    .toLowerCase();
}

export function GroceryChecklist() {
  const { profile } = useAuth();
  const { recipes, isLoading: recipesLoading } = useRecipes();
  const [pantryIngredients, setPantryIngredients] = useState<PantryIngredient[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [manualItem, setManualItem] = useState<ManualItemForm>(() => emptyManualItemForm());
  const [query, setQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!profile) {
      return;
    }

    const currentProfile: UserProfile = profile;
    let active = true;

    async function loadGroceryData(profileForList: UserProfile) {
      setIsLoadingList(true);
      setError(undefined);

      try {
        const [groceryList, nextPantryIngredients] = await Promise.all([
          fetchGroceryList(profileForList),
          fetchPantryIngredients(),
        ]);

        if (active) {
          setItems(groceryList.items ?? []);
          setPantryIngredients(nextPantryIngredients);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load grocery list.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    window.queueMicrotask(() => {
      loadGroceryData(currentProfile);
    });

    return () => {
      active = false;
    };
  }, [profile]);

  const recipesById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes],
  );
  const checkedCount = items.filter((item) => item.checked).length;
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => itemSearchText(item, recipesById).includes(normalizedQuery));
  }, [items, query, recipesById]);
  const groupedItems = useMemo(
    () =>
      aisleOrder.map((category) => ({
        category,
        items: filteredItems.filter((item) => (item.category ?? "Other") === category),
      })),
    [filteredItems],
  );

  async function persistItems(nextItems: GroceryItem[]) {
    if (!profile) {
      throw new Error("You must be signed in to update the grocery list.");
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const savedList = await saveGroceryItems({ items: nextItems, user: profile });
      setItems(savedList.items);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save grocery list.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleRecipe(recipeId: string) {
    setSelectedRecipeIds((currentRecipeIds) =>
      currentRecipeIds.includes(recipeId)
        ? currentRecipeIds.filter((currentRecipeId) => currentRecipeId !== recipeId)
        : [...currentRecipeIds, recipeId],
    );
  }

  async function addSelectedRecipeIngredients() {
    const selectedRecipes = recipes.filter((recipe) => selectedRecipeIds.includes(recipe.id));
    const recipeItems = selectedRecipes.flatMap((recipe) =>
      recipe.ingredients
        .map((ingredient) =>
          groceryItemFromRecipeIngredient({
            ingredient,
            pantryIngredient: findMatchingPantryIngredient(pantryIngredients, ingredient.item),
            recipe,
          }),
        )
        .filter((item): item is GroceryItem => Boolean(item)),
    );

    if (recipeItems.length === 0) {
      setError("Choose at least one recipe with ingredients to add.");
      return;
    }

    await persistItems(mergeGroceryItems([...items, ...recipeItems]));
  }

  async function submitManualItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matchingPantryIngredient = findMatchingPantryIngredient(
      pantryIngredients,
      manualItem.name,
    );
    const name = manualItem.name.trim();

    if (!name) {
      setError("Grocery item name is required.");
      return;
    }

    const nextItem: GroceryItem = {
      id: createGroceryItemId(),
      name,
      quantity: cleanText(manualItem.quantity),
      unit: cleanText(manualItem.unit),
      category: manualItem.category || matchingPantryIngredient?.category || "Other",
      checked: false,
      preferredBrand:
        cleanText(manualItem.preferredBrand) ?? matchingPantryIngredient?.preferredBrand,
      productName:
        cleanText(manualItem.productName) ?? matchingPantryIngredient?.preferredProductName,
      notes: cleanText(manualItem.notes),
      createdAt: new Date().toISOString(),
    };

    await persistItems(mergeGroceryItems([...items, nextItem]));
    setManualItem(emptyManualItemForm());
  }

  async function toggleItem(itemId: string) {
    await persistItems(
      items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  async function removeItem(itemId: string) {
    const item = items.find((currentItem) => currentItem.id === itemId);

    if (!window.confirm(`Remove ${item?.name ?? "this item"} from the grocery list?`)) {
      return;
    }

    await persistItems(items.filter((item) => item.id !== itemId));
  }

  async function clearCheckedItems() {
    if (!window.confirm("Clear all checked grocery items?")) {
      return;
    }

    await persistItems(items.filter((item) => !item.checked));
  }

  function updateManualItem<Key extends keyof ManualItemForm>(
    key: Key,
    value: ManualItemForm[Key],
  ) {
    setManualItem((currentItem) => ({
      ...currentItem,
      [key]: value,
    }));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Grocery List
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            Plan the next market run
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
            Pull ingredients from recipes, keep pantry brand preferences visible, and
            check things off while shopping.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white/72 p-4 shadow-sm">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-lime-100 text-lime-800">
            <ShoppingBasket aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-stone-950">
              {checkedCount}/{items.length}
            </p>
            <p className="text-sm font-medium text-stone-500">checked off</p>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-stone-950">Recipes</h2>
                <p className="mt-1 text-sm text-stone-500">Select recipes to add.</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                {selectedRecipeIds.length}
              </span>
            </div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {recipesLoading ? (
                <p className="text-sm font-semibold text-stone-500">Loading recipes...</p>
              ) : null}
              {recipes.map((recipe) => {
                const selected = selectedRecipeIds.includes(recipe.id);

                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "bg-stone-950 text-white"
                        : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                    }`}
                    key={recipe.id}
                    onClick={() => toggleRecipe(recipe.id)}
                    type="button"
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${
                        selected
                          ? "border-white/70 bg-white text-stone-950"
                          : "border-stone-300 bg-white"
                      }`}
                    >
                      {selected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{recipe.title}</span>
                      <span className={selected ? "text-white/70" : "text-stone-500"}>
                        {recipe.ingredients.length} ingredients
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a]"
              disabled={isSaving || selectedRecipeIds.length === 0}
              onClick={addSelectedRecipeIngredients}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add recipe ingredients
            </button>
          </section>

          <form
            className="space-y-4 rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
            onSubmit={submitManualItem}
          >
            <h2 className="font-serif text-2xl text-stone-950">Custom item</h2>
            <TextField
              label="Item"
              onChange={(value) => updateManualItem("name", value)}
              placeholder="soy sauce"
              required
              value={manualItem.name}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Quantity"
                onChange={(value) => updateManualItem("quantity", value)}
                placeholder="1"
                value={manualItem.quantity}
              />
              <TextField
                label="Unit"
                onChange={(value) => updateManualItem("unit", value)}
                placeholder="bottle"
                value={manualItem.unit}
              />
            </div>
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Aisle</span>
              <select
                className={fieldClassName}
                onChange={(event) =>
                  updateManualItem(
                    "category",
                    event.target.value as PantryIngredientCategory | "",
                  )
                }
                value={manualItem.category}
              >
                <option value="">Use pantry match</option>
                {aisleOrder.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Brand"
                onChange={(value) => updateManualItem("preferredBrand", value)}
                placeholder="Kikkoman"
                value={manualItem.preferredBrand}
              />
              <TextField
                label="Product"
                onChange={(value) => updateManualItem("productName", value)}
                placeholder="low sodium"
                value={manualItem.productName}
              />
            </div>
            <TextField
              label="Notes"
              onChange={(value) => updateManualItem("notes", value)}
              placeholder="large bottle if available"
              value={manualItem.notes}
            />
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
              disabled={isSaving}
              type="submit"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add custom item
            </button>
          </form>
        </aside>

        <section className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <span className="sr-only">Search grocery items</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
              />
              <input
                className="h-12 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search grocery list"
                type="search"
                value={query}
              />
            </label>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
              disabled={isSaving || checkedCount === 0}
              onClick={clearCheckedItems}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Clear checked
            </button>
          </div>

          {isLoadingList ? (
            <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600 shadow-sm">
              Loading grocery list...
            </p>
          ) : null}

          {!isLoadingList && items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-white/55 px-6 py-12 text-center text-sm leading-6 text-stone-600">
              Select recipes or add a custom item to start the list.
            </p>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {groupedItems.map((group) =>
              group.items.length > 0 ? (
                <section
                  className="rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
                  key={group.category}
                >
                  <h2 className="font-serif text-2xl text-stone-950">{group.category}</h2>
                  <div className="mt-4 space-y-2">
                    {group.items.map((item) => (
                      <GroceryItemRow
                        item={item}
                        key={item.id}
                        onRemove={() => removeItem(item.id)}
                        onToggle={() => toggleItem(item.id)}
                        recipesById={recipesById}
                      />
                    ))}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function GroceryItemRow({
  item,
  onRemove,
  onToggle,
  recipesById,
}: {
  item: GroceryItem;
  onRemove: () => void;
  onToggle: () => void;
  recipesById: Map<string, Recipe>;
}) {
  const recipeNames = (item.recipeIds ?? [])
    .map((recipeId) => recipesById.get(recipeId)?.title)
    .filter(Boolean);

  return (
    <div
      className={`rounded-lg px-3 py-3 ring-1 transition ${
        item.checked
          ? "bg-lime-50 text-lime-950 ring-lime-200"
          : "bg-stone-50 text-stone-700 ring-stone-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label={item.checked ? `Uncheck ${item.name}` : `Check ${item.name}`}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${
            item.checked
              ? "border-lime-600 bg-lime-600 text-white"
              : "border-stone-300 bg-white text-transparent"
          }`}
          onClick={onToggle}
          type="button"
        >
          <Check aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`font-bold leading-snug text-stone-950 ${
              item.checked ? "line-through decoration-lime-700/50" : ""
            }`}
          >
            {[item.quantity, item.unit, item.name].filter(Boolean).join(" ")}
            {item.preferredBrand ? ` -- ${item.preferredBrand}` : ""}
          </p>
          {item.productName || item.notes || recipeNames.length > 0 ? (
            <p className="mt-1 text-sm leading-6 text-stone-500">
              {item.productName ? item.productName : null}
              {item.productName && item.notes ? ", " : ""}
              {item.notes ? item.notes : null}
              {(item.productName || item.notes) && recipeNames.length > 0 ? " | " : ""}
              {recipeNames.length > 0 ? `From ${recipeNames.join(", ")}` : null}
            </p>
          ) : null}
        </div>

        <button
          aria-label={`Remove ${item.name}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition hover:text-red-700"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const fieldClassName =
  "h-12 w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";

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
