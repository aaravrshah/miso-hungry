"use client";

import {
  BookOpen,
  CheckCircle2,
  GlassWater,
  Search,
  Save,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CategoryPill } from "@/components/CategoryPill";
import { useRecipes } from "@/components/RecipeStore";
import { useSocial } from "@/components/SocialProvider";
import {
  catalogDrinks,
  collectDrinkIngredientSuggestions,
  drinkCandidateFromCatalog,
  drinkCandidateFromRecipe,
  drinkMatchesQuery,
  isDrinkRecipe,
  matchDrinkCandidate,
  sortDrinkMatches,
  type DrinkMatch,
  type DrinkMatchStatus,
  type DrinkSource,
  type DrinkSourceFilter,
} from "@/lib/drinks";
import {
  fetchDrinkCabinet,
  parseDrinkIngredientText,
  saveDrinkCabinet,
} from "@/lib/services/drinkCabinetService";

type MatchFilter = DrinkMatchStatus | "all";

const sourceFilters: Array<{ label: string; value: DrinkSourceFilter }> = [
  { label: "All", value: "all" },
  { label: "Mine", value: "mine" },
  { label: "Friends", value: "friends" },
  { label: "Catalog", value: "catalog" },
];

const matchFilters: Array<{ label: string; value: MatchFilter }> = [
  { label: "Best matches", value: "all" },
  { label: "Can make", value: "canMake" },
  { label: "Missing 1", value: "missing1" },
  { label: "Missing 2", value: "missing2" },
];

function sourceLabel(source: DrinkSource) {
  if (source === "mine") {
    return "My recipe";
  }

  if (source === "friends") {
    return "Friend recipe";
  }

  return "Catalog";
}

function statusLabel(status: DrinkMatchStatus) {
  if (status === "canMake") {
    return "Can make now";
  }

  if (status === "missing1") {
    return "Missing 1";
  }

  if (status === "missing2") {
    return "Missing 2";
  }

  return "Needs a shop";
}

function statusClassName(status: DrinkMatchStatus) {
  if (status === "canMake") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "missing1") {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }

  if (status === "missing2") {
    return "bg-orange-50 text-orange-800 ring-orange-200";
  }

  return "bg-stone-100 text-stone-600 ring-stone-200";
}

export function DrinksClient() {
  const { profile } = useAuth();
  const { friendRecipes, recipes } = useRecipes();
  const { friends } = useSocial();
  const [cabinetText, setCabinetText] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoadingCabinet, setIsLoadingCabinet] = useState(true);
  const [isSavingCabinet, setIsSavingCabinet] = useState(false);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<DrinkSourceFilter>("all");
  const availableIngredients = useMemo(
    () => parseDrinkIngredientText(cabinetText),
    [cabinetText],
  );
  const friendLookup = useMemo(
    () => new Map(friends.map((friend) => [friend.id, friend])),
    [friends],
  );
  const currentUserSummary = useMemo(
    () =>
      profile
        ? {
            id: profile.id,
            displayName: String(profile.displayName || profile.email || "Me"),
            email: profile.email,
            username: profile.username,
            photoURL: profile.photoURL,
          }
        : undefined,
    [profile],
  );

  useEffect(() => {
    let active = true;

    async function loadCabinet() {
      if (!profile) {
        setIsLoadingCabinet(false);
        return;
      }

      setIsLoadingCabinet(true);
      setError(undefined);

      try {
        const cabinet = await fetchDrinkCabinet(profile.id);

        if (active) {
          setCabinetText(cabinet.ingredients.join("\n"));
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load drinks cabinet.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingCabinet(false);
        }
      }
    }

    window.queueMicrotask(() => {
      loadCabinet();
    });

    return () => {
      active = false;
    };
  }, [profile]);

  const candidates = useMemo(() => {
    const searchableRecipes = [...recipes, ...friendRecipes];
    const savedDrinkCandidates = searchableRecipes.filter(isDrinkRecipe).flatMap((recipe) => {
      const isMine = !recipe.createdBy || recipe.createdBy === profile?.id;
      const friend = recipe.createdBy ? friendLookup.get(recipe.createdBy) : undefined;

      if (isMine) {
        return [
          drinkCandidateFromRecipe({
            owner: currentUserSummary,
            recipe,
            source: "mine",
          }),
        ];
      }

      if (friend) {
        return [
          drinkCandidateFromRecipe({
            owner: friend,
            recipe,
            source: "friends",
          }),
        ];
      }

      return [];
    });
    const catalogCandidates = catalogDrinks.map(drinkCandidateFromCatalog);

    return [...savedDrinkCandidates, ...catalogCandidates];
  }, [currentUserSummary, friendLookup, friendRecipes, profile?.id, recipes]);

  const ingredientSuggestions = useMemo(
    () => collectDrinkIngredientSuggestions(candidates),
    [candidates],
  );
  const matchedDrinks = useMemo(() => {
    const sourceFilteredCandidates =
      sourceFilter === "all"
        ? candidates
        : candidates.filter((candidate) => candidate.source === sourceFilter);
    const queryFilteredCandidates = sourceFilteredCandidates.filter((candidate) =>
      drinkMatchesQuery(candidate, query),
    );
    const matches = sortDrinkMatches(
      queryFilteredCandidates.map((candidate) =>
        matchDrinkCandidate({ availableIngredients, candidate }),
      ),
    );

    return matchFilter === "all"
      ? matches
      : matches.filter((match) => match.matchStatus === matchFilter);
  }, [availableIngredients, candidates, matchFilter, query, sourceFilter]);
  const canMakeCount = matchedDrinks.filter((drink) => drink.matchStatus === "canMake").length;
  const missingOneCount = matchedDrinks.filter((drink) => drink.matchStatus === "missing1").length;
  const missingTwoCount = matchedDrinks.filter((drink) => drink.matchStatus === "missing2").length;

  function setIngredients(nextIngredients: string[]) {
    setCabinetText(parseDrinkIngredientText(nextIngredients.join("\n")).join("\n"));
  }

  function addIngredient(ingredient: string) {
    setIngredients([...availableIngredients, ingredient]);
  }

  function removeIngredient(ingredient: string) {
    setIngredients(availableIngredients.filter((item) => item !== ingredient));
  }

  async function saveCabinet() {
    if (!profile) {
      setError("You must be signed in to save your drinks cabinet.");
      return;
    }

    setIsSavingCabinet(true);
    setError(undefined);

    try {
      const cabinet = await saveDrinkCabinet({
        ingredients: availableIngredients,
        user: profile,
      });
      setCabinetText(cabinet.ingredients.join("\n"));
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save drinks cabinet.",
      );
    } finally {
      setIsSavingCabinet(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
            Drinks
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            What can the cabinet make?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Search your drinks, friends&apos; drinks, and the starter catalog. Add what you
            have on hand to see what is ready now, one bottle away, or two ingredients away.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <DrinkStat label="can make" value={`${canMakeCount}`} />
          <DrinkStat label="missing 1" value={`${missingOneCount}`} />
          <DrinkStat label="missing 2" value={`${missingTwoCount}`} />
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <aside className="space-y-4 rounded-lg border border-stone-200 bg-white/76 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-stone-950">Drinks cabinet</h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                One ingredient per line, or paste a comma-separated shelf.
              </p>
            </div>
            <GlassWater aria-hidden="true" className="h-5 w-5 text-[var(--tomato)]" />
          </div>

          <textarea
            className="min-h-56 w-full resize-y rounded-lg border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
            disabled={isLoadingCabinet}
            onChange={(event) => setCabinetText(event.target.value)}
            placeholder={"Gin\nLime\nTonic water\nCampari\nSimple syrup"}
            value={cabinetText}
          />

          {availableIngredients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableIngredients.map((ingredient) => (
                <span
                  className="inline-flex min-h-8 items-center gap-2 rounded-full bg-stone-100 px-3 text-xs font-bold text-stone-600 ring-1 ring-stone-200"
                  key={ingredient}
                >
                  {ingredient}
                  <button
                    className="text-stone-400 transition hover:text-red-600"
                    onClick={() => removeIngredient(ingredient)}
                    type="button"
                  >
                    <span className="sr-only">Remove {ingredient}</span>
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--tomato)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#a94e3a] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSavingCabinet || isLoadingCabinet}
            onClick={saveCabinet}
            type="button"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSavingCabinet ? "Saving..." : "Save cabinet"}
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
              Ingredient ideas
            </p>
            <div className="mt-3 flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
              {ingredientSuggestions
                .filter((ingredient) => !availableIngredients.includes(ingredient))
                .slice(0, 60)
                .map((ingredient) => (
                  <button
                    className="min-h-8 rounded-full bg-white px-3 text-xs font-bold text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:text-stone-950"
                    key={ingredient}
                    onClick={() => addIngredient(ingredient)}
                    type="button"
                  >
                    + {ingredient}
                  </button>
                ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative block">
                <span className="sr-only">Search drinks</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
                />
                <input
                  className="h-12 w-full rounded-lg border border-stone-200 bg-white/82 pl-12 pr-4 text-base text-stone-950 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--tomato)] focus:ring-4 focus:ring-red-100"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search drinks, ingredients, base spirits"
                  type="search"
                  value={query}
                />
              </label>
              <div className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-4 text-sm font-semibold text-stone-600 shadow-sm">
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
                {matchedDrinks.length} drinks
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {sourceFilters.map((filter) => (
                <button
                  className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ring-1 transition ${
                    sourceFilter === filter.value
                      ? "bg-stone-950 text-white ring-stone-950"
                      : "bg-white/72 text-stone-600 ring-stone-200 hover:bg-white"
                  }`}
                  key={filter.value}
                  onClick={() => setSourceFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {matchFilters.map((filter) => (
                <button
                  className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ring-1 transition ${
                    matchFilter === filter.value
                      ? "bg-[var(--tomato)] text-white ring-[var(--tomato)]"
                      : "bg-white/72 text-stone-600 ring-stone-200 hover:bg-white"
                  }`}
                  key={filter.value}
                  onClick={() => setMatchFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          {matchedDrinks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-6 shadow-sm">
              <h2 className="font-serif text-2xl text-stone-950">No drinks found</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Try another source, search term, or add a few more cabinet ingredients.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {matchedDrinks.map((drink) => (
                <DrinkMatchCard drink={drink} key={`${drink.source}-${drink.id}`} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DrinkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white/72 p-4 text-center shadow-sm">
      <p className="font-serif text-3xl leading-none text-stone-950">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </p>
    </div>
  );
}

function DrinkMatchCard({ drink }: { drink: DrinkMatch }) {
  const content = (
    <article className="h-full rounded-lg border border-stone-200 bg-white/78 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClassName(
                drink.matchStatus,
              )}`}
            >
              {statusLabel(drink.matchStatus)}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
              {sourceLabel(drink.source)}
            </span>
          </div>
          <h2 className="mt-3 font-serif text-2xl leading-tight text-stone-950">
            {drink.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
            {drink.description}
          </p>
        </div>
        {drink.source === "catalog" ? (
          <BookOpen aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-400" />
        ) : drink.source === "friends" ? (
          <Users aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-400" />
        ) : (
          <Sparkles aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-400" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {drink.baseSpirit ? <CategoryPill name={drink.baseSpirit} /> : null}
        {drink.glass ? <CategoryPill name={drink.glass} /> : null}
        {drink.flavor.slice(0, 3).map((flavor) => (
          <CategoryPill key={flavor} name={flavor} />
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-stone-50 p-3 ring-1 ring-stone-200">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
            Ingredients
          </p>
          <p className="text-xs font-bold text-stone-500">
            {drink.availableIngredientCount}/{drink.requiredIngredients.length} on hand
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {drink.requiredIngredients.map((ingredient) => {
            const missing = drink.missingIngredients.includes(ingredient);

            return (
              <span
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ring-1 ${
                  missing
                    ? "bg-white text-stone-500 ring-stone-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                }`}
                key={ingredient}
              >
                {!missing ? <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                {ingredient}
              </span>
            );
          })}
        </div>
      </div>

      {drink.missingIngredients.length > 0 ? (
        <p className="mt-3 text-sm font-semibold text-[var(--tomato)]">
          Missing: {drink.missingIngredients.join(", ")}
        </p>
      ) : (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          You have everything for this one.
        </p>
      )}

      {drink.owner ? (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-stone-400">
          By {drink.owner.displayName}
        </p>
      ) : null}

      {drink.method ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
          {drink.method}
        </p>
      ) : null}
    </article>
  );

  if (drink.recipe) {
    return (
      <Link className="block h-full" href={`/recipes/${drink.recipe.id}`}>
        {content}
      </Link>
    );
  }

  return content;
}
