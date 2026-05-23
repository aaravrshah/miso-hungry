"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
} from "lucide-react";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Ingredient, Recipe } from "@/lib/recipes";

export type CookingProgress = {
  activeDirectionIndex: number;
  checkedDirections: boolean[];
  checkedIngredients: boolean[];
  recipeId: string;
  timerIsRunning: boolean;
  timerRemainingSeconds: number;
  timerStepIndex?: number;
};

type CookingModeProps = {
  onExit: () => void;
  progress: CookingProgress;
  recipe: Recipe;
  setProgress: Dispatch<SetStateAction<CookingProgress>>;
};

type CookingProgressRecipeShape = {
  directionCount: number;
  ingredientCount: number;
  recipeId: string;
};

export function createCookingProgress(
  recipeId = "",
  ingredientCount = 0,
  directionCount = 0,
): CookingProgress {
  return {
    activeDirectionIndex: 0,
    checkedDirections: Array.from({ length: directionCount }, () => false),
    checkedIngredients: Array.from({ length: ingredientCount }, () => false),
    recipeId,
    timerIsRunning: false,
    timerRemainingSeconds: 0,
  };
}

export function reconcileCookingProgress(
  current: CookingProgress,
  { directionCount, ingredientCount, recipeId }: CookingProgressRecipeShape,
) {
  if (current.recipeId !== recipeId) {
    return createCookingProgress(recipeId, ingredientCount, directionCount);
  }

  const activeDirectionIndex = clampNumber(
    current.activeDirectionIndex,
    0,
    Math.max(directionCount - 1, 0),
  );
  const timerStepIndex =
    typeof current.timerStepIndex === "number" && current.timerStepIndex < directionCount
      ? current.timerStepIndex
      : undefined;

  return {
    ...current,
    activeDirectionIndex,
    checkedDirections: Array.from(
      { length: directionCount },
      (_, index) => current.checkedDirections[index] ?? false,
    ),
    checkedIngredients: Array.from(
      { length: ingredientCount },
      (_, index) => current.checkedIngredients[index] ?? false,
    ),
    timerIsRunning: typeof timerStepIndex === "number" ? current.timerIsRunning : false,
    timerRemainingSeconds:
      typeof timerStepIndex === "number" ? current.timerRemainingSeconds : 0,
    timerStepIndex,
  };
}

export function CookingMode({
  onExit,
  progress,
  recipe,
  setProgress,
}: CookingModeProps) {
  const activeDirection = recipe.directions[progress.activeDirectionIndex];
  const checkedIngredientCount = progress.checkedIngredients.filter(Boolean).length;
  const checkedDirectionCount = progress.checkedDirections.filter(Boolean).length;
  const timerDirection =
    typeof progress.timerStepIndex === "number"
      ? recipe.directions[progress.timerStepIndex]
      : undefined;

  useEffect(() => {
    if (!progress.timerIsRunning) {
      return;
    }

    const timerId = window.setInterval(() => {
      setProgress((current) => {
        if (!current.timerIsRunning) {
          return current;
        }

        if (current.timerRemainingSeconds <= 1) {
          return {
            ...current,
            timerIsRunning: false,
            timerRemainingSeconds: 0,
          };
        }

        return {
          ...current,
          timerRemainingSeconds: current.timerRemainingSeconds - 1,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [progress.timerIsRunning, setProgress]);

  function toggleIngredient(index: number) {
    setProgress((current) => ({
      ...current,
      checkedIngredients: toggleBooleanAt(
        current.checkedIngredients,
        index,
        recipe.ingredients.length,
      ),
    }));
  }

  function toggleDirection(index: number) {
    setProgress((current) => ({
      ...current,
      activeDirectionIndex: index,
      checkedDirections: toggleBooleanAt(
        current.checkedDirections,
        index,
        recipe.directions.length,
      ),
    }));
  }

  function setActiveDirection(index: number) {
    setProgress((current) => ({
      ...current,
      activeDirectionIndex: clampNumber(index, 0, Math.max(recipe.directions.length - 1, 0)),
    }));
  }

  function moveActiveDirection(offset: number) {
    setProgress((current) => ({
      ...current,
      activeDirectionIndex: clampNumber(
        current.activeDirectionIndex + offset,
        0,
        Math.max(recipe.directions.length - 1, 0),
      ),
    }));
  }

  function startTimer(stepIndex: number, timerMinutes: number) {
    setProgress((current) => ({
      ...current,
      activeDirectionIndex: stepIndex,
      timerIsRunning: true,
      timerRemainingSeconds: Math.max(1, Math.round(timerMinutes * 60)),
      timerStepIndex: stepIndex,
    }));
  }

  function toggleTimerRunning() {
    setProgress((current) => {
      if (typeof current.timerStepIndex !== "number" || current.timerRemainingSeconds <= 0) {
        return current;
      }

      return {
        ...current,
        timerIsRunning: !current.timerIsRunning,
      };
    });
  }

  function clearTimer() {
    setProgress((current) => ({
      ...current,
      timerIsRunning: false,
      timerRemainingSeconds: 0,
      timerStepIndex: undefined,
    }));
  }

  return (
    <article className="space-y-5">
      <header className="rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--tomato)]">
              Cooking Mode
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
              {recipe.title}
            </h1>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
            onClick={onExit}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Exit Cooking Mode
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <CookingStat
            label="Ingredients"
            value={`${checkedIngredientCount}/${recipe.ingredients.length}`}
          />
          <CookingStat
            label="Steps"
            value={`${checkedDirectionCount}/${recipe.directions.length}`}
          />
          <CookingStat
            label="Current step"
            value={
              recipe.directions.length
                ? `${progress.activeDirectionIndex + 1}/${recipe.directions.length}`
                : "None"
            }
          />
        </div>
      </header>

      {timerDirection ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                Timer for step {(progress.timerStepIndex ?? 0) + 1}
              </p>
              <p className="mt-1 font-mono text-4xl font-bold text-stone-950">
                {formatTimerSeconds(progress.timerRemainingSeconds)}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-900">
                {progress.timerRemainingSeconds === 0
                  ? "Timer done"
                  : progress.timerIsRunning
                    ? "Running"
                    : "Paused"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white sm:flex-none"
                disabled={progress.timerRemainingSeconds === 0}
                onClick={toggleTimerRunning}
                type="button"
              >
                {progress.timerIsRunning ? (
                  <Pause aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Play aria-hidden="true" className="h-4 w-4" />
                )}
                {progress.timerIsRunning ? "Pause" : "Resume"}
              </button>
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 text-sm font-bold text-amber-900 sm:flex-none"
                onClick={clearTimer}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[20rem_1fr] xl:grid-cols-[24rem_1fr]">
        <aside className="rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm">
          <h2 className="font-serif text-3xl text-stone-950">Ingredients</h2>
          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.item}-${index}`}>
                <button
                  className={`flex w-full items-start gap-3 rounded-lg p-3 text-left text-base leading-6 ring-1 transition ${
                    progress.checkedIngredients[index]
                      ? "bg-lime-50 text-lime-950 ring-lime-200"
                      : "bg-stone-50 text-stone-700 ring-stone-200 hover:bg-stone-100"
                  }`}
                  onClick={() => toggleIngredient(index)}
                  type="button"
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${
                      progress.checkedIngredients[index]
                        ? "border-lime-600 bg-lime-600 text-white"
                        : "border-stone-300 bg-white text-transparent"
                    }`}
                  >
                    <Check aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 pt-1">
                    <span className="block font-bold text-stone-950">
                      {ingredientTitle(ingredient)}
                    </span>
                    {ingredientDetail(ingredient) ? (
                      <span className="mt-1 block text-sm text-stone-500">
                        {ingredientDetail(ingredient)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm sm:p-5">
          <h2 className="font-serif text-3xl text-stone-950">Directions</h2>

          <div className="mt-4 md:hidden">
            {activeDirection ? (
              <MobileDirectionStep
                checked={progress.checkedDirections[progress.activeDirectionIndex] ?? false}
                directionIndex={progress.activeDirectionIndex}
                directionCount={recipe.directions.length}
                instruction={activeDirection.instruction}
                onBack={() => moveActiveDirection(-1)}
                onNext={() => moveActiveDirection(1)}
                onStartTimer={
                  activeDirection.timerMinutes
                    ? () =>
                        startTimer(
                          progress.activeDirectionIndex,
                          activeDirection.timerMinutes ?? 0,
                        )
                    : undefined
                }
                onToggleDone={() => toggleDirection(progress.activeDirectionIndex)}
                section={activeDirection.section}
                timerMinutes={activeDirection.timerMinutes}
              />
            ) : (
              <p className="rounded-lg bg-stone-50 p-4 text-base leading-7 text-stone-600 ring-1 ring-stone-200">
                No directions yet.
              </p>
            )}
          </div>

          <ol className="mt-4 hidden space-y-3 md:block">
            {recipe.directions.map((direction, index) => {
              const checked = progress.checkedDirections[index] ?? false;
              const active = progress.activeDirectionIndex === index;

              return (
                <li
                  className={`rounded-lg p-4 ring-1 transition ${
                    active
                      ? "bg-amber-50 ring-amber-200"
                      : checked
                        ? "bg-lime-50 ring-lime-200"
                        : "bg-stone-50 ring-stone-200"
                  }`}
                  key={`${index}-${direction.instruction}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      aria-label={checked ? `Uncheck step ${index + 1}` : `Check step ${index + 1}`}
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${
                        checked
                          ? "border-lime-600 bg-lime-600 text-white"
                          : "border-stone-300 bg-white text-transparent"
                      }`}
                      onClick={() => toggleDirection(index)}
                      type="button"
                    >
                      <Check aria-hidden="true" className="h-5 w-5" />
                    </button>

                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setActiveDirection(index)}
                      type="button"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--tomato)]">
                        Step {index + 1}
                        {direction.section ? ` - ${direction.section}` : ""}
                      </span>
                      <span
                        className={`mt-2 block text-lg leading-8 text-stone-800 ${
                          checked ? "line-through decoration-lime-700/50" : ""
                        }`}
                      >
                        {direction.instruction}
                      </span>
                    </button>

                    {direction.timerMinutes ? (
                      <button
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 text-sm font-bold text-amber-900 shadow-sm"
                        onClick={() => startTimer(index, direction.timerMinutes ?? 0)}
                        type="button"
                      >
                        <Timer aria-hidden="true" className="h-4 w-4" />
                        Start Timer
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </section>
    </article>
  );
}

function MobileDirectionStep({
  checked,
  directionCount,
  directionIndex,
  instruction,
  onBack,
  onNext,
  onStartTimer,
  onToggleDone,
  section,
  timerMinutes,
}: {
  checked: boolean;
  directionCount: number;
  directionIndex: number;
  instruction: string;
  onBack: () => void;
  onNext: () => void;
  onStartTimer?: () => void;
  onToggleDone: () => void;
  section?: string;
  timerMinutes?: number;
}) {
  return (
    <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--tomato)]">
        Step {directionIndex + 1} of {directionCount}
      </p>
      {section ? (
        <p className="mt-3 text-base font-bold text-amber-900">{section}</p>
      ) : null}
      <p
        className={`mt-3 text-xl leading-9 text-stone-950 ${
          checked ? "line-through decoration-lime-700/50" : ""
        }`}
      >
        {instruction}
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-base font-bold text-white"
          onClick={onToggleDone}
          type="button"
        >
          <Check aria-hidden="true" className="h-5 w-5" />
          {checked ? "Step done" : "Mark step done"}
        </button>
        {timerMinutes ? (
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 text-base font-bold text-amber-900"
            onClick={onStartTimer}
            type="button"
          >
            <Timer aria-hidden="true" className="h-5 w-5" />
            Start Timer
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-base font-bold text-stone-700 disabled:opacity-40"
          disabled={directionIndex === 0}
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          Back
        </button>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-base font-bold text-stone-700 disabled:opacity-40"
          disabled={directionIndex >= directionCount - 1}
          onClick={onNext}
          type="button"
        >
          Next
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function CookingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3 ring-1 ring-stone-200">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-stone-950">{value}</p>
    </div>
  );
}

function ingredientTitle(ingredient: Ingredient) {
  return [
    ingredient.quantity,
    ingredient.unit,
    ingredient.item || ingredient.productName || "Ingredient",
  ]
    .filter(Boolean)
    .join(" ");
}

function ingredientDetail(ingredient: Ingredient) {
  return [ingredient.productName, ingredient.brand, ingredient.note]
    .filter(Boolean)
    .join(", ");
}

function toggleBooleanAt(values: boolean[], index: number, length: number) {
  return Array.from({ length }, (_, currentIndex) =>
    currentIndex === index ? !(values[currentIndex] ?? false) : (values[currentIndex] ?? false),
  );
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTimerSeconds(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
