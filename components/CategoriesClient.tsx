"use client";

import { ArrowRight, ChefHat, Pencil, Plus, Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CategoryPill } from "@/components/CategoryPill";
import { useRecipes } from "@/components/RecipeStore";

export function CategoriesClient() {
  const {
    addCategory,
    categories: firestoreCategories,
    error,
    isLoading,
    recipes,
    updateCategory,
  } = useRecipes();
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const visibleCategories = firestoreCategories;

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, {
          description: categoryDescription,
          name: categoryName,
        });
      } else {
        await addCategory({
          description: categoryDescription,
          name: categoryName,
        });
      }

      setCategoryName("");
      setCategoryDescription("");
      setEditingCategoryId(undefined);
    } catch (categoryError) {
      setFormError(
        categoryError instanceof Error ? categoryError.message : "Unable to save category.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Categories
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            Little shelves for every craving
          </h1>
        </div>

        <form
          className="space-y-3 rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm"
          onSubmit={submitCategory}
        >
          <h2 className="font-serif text-2xl text-stone-950">
            {editingCategoryId ? "Edit category" : "New category"}
          </h2>
          <input
            className={inputClassName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Soup Season"
            required
            value={categoryName}
          />
          <textarea
            className={`${inputClassName} min-h-24 py-3`}
            onChange={(event) => setCategoryDescription(event.target.value)}
            placeholder="Warm bowls, broths, and cozy leftovers."
            value={categoryDescription}
          />
          {formError || error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              {formError ?? error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm"
              type="submit"
            >
              {editingCategoryId ? (
                <Save aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Plus aria-hidden="true" className="h-4 w-4" />
              )}
              {editingCategoryId ? "Save" : "Add"}
            </button>
            {editingCategoryId ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-600"
                onClick={() => {
                  setEditingCategoryId(undefined);
                  setCategoryName("");
                  setCategoryDescription("");
                }}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {isLoading ? (
        <p className="rounded-lg border border-stone-200 bg-white/72 p-4 text-sm font-semibold text-stone-600 shadow-sm">
          Loading categories...
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {!isLoading && visibleCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white/55 px-6 py-12 text-center md:col-span-2 xl:col-span-4">
            <h2 className="font-serif text-2xl text-stone-950">No categories yet</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Create your first shelf to organize recipes.
            </p>
          </div>
        ) : null}

        {visibleCategories.map((category) => {
          const categoryRecipes = recipes.filter(
            (recipe) => recipe.categoryId === category.id || recipe.category === category.name,
          );
          const coverRecipe = categoryRecipes[0];

          return (
            <section
              className="overflow-hidden rounded-lg border border-stone-200 bg-white/76 shadow-sm"
              id={category.slug}
              key={category.slug}
            >
              <div className="relative aspect-[4/3] bg-stone-100">
                {coverRecipe?.coverImageUrl ? (
                  <Image
                    alt={coverRecipe.title}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 44vw, 92vw"
                    src={coverRecipe.coverImageUrl}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-stone-400">
                    <ChefHat aria-hidden="true" className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-4">
                <CategoryPill active count={categoryRecipes.length} name={category.name} />
                <p className="min-h-12 text-sm leading-6 text-stone-600">
                  {category.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--tomato)]"
                    href={`/recipes?category=${category.id}`}
                  >
                    Open shelf
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <button
                    className="inline-flex items-center gap-2 text-sm font-bold text-stone-600"
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setCategoryName(category.name);
                      setCategoryDescription(category.description);
                    }}
                    type="button"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-stone-200 bg-white px-4 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100";
