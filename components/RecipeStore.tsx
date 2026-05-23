"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Category, Recipe } from "@/lib/recipes";
import type { CookLog, CookLogInput, CookedBy } from "@/lib/firebase/schema";
import {
  createCategory as createFirestoreCategory,
  createCookLog,
  createRecipe as createFirestoreRecipe,
  deleteCookLog as deleteFirestoreCookLog,
  deleteRecipe as deleteFirestoreRecipe,
  fetchCategories,
  fetchCookLogs,
  fetchRecipes,
  fetchRecipesByCategory,
  updateCategory as updateFirestoreCategory,
  updateCookLog as updateFirestoreCookLog,
  updateRecipe as updateFirestoreRecipe,
} from "@/lib/services/recipeService";
import { todayString } from "@/lib/services/helpers";
import { useAuth } from "@/components/AuthProvider";

type RecipeCreateInput = Omit<Recipe, "id"> & {
  id?: string;
};

type RecipeStoreValue = {
  categories: Category[];
  error?: string;
  isLoading: boolean;
  cookLogsByRecipe: Record<string, CookLog[]>;
  recipes: Recipe[];
  addCategory: (input: { description: string; name: string }) => Promise<Category>;
  addCookLog: (recipeId: string, input: CookLogInput) => Promise<CookLog | undefined>;
  addRecipe: (recipe: RecipeCreateInput, coverImageFile?: File) => Promise<Recipe>;
  deleteCookLog: (recipeId: string, cookLogId: string) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  getRecipe: (recipeId: string) => Recipe | undefined;
  loadCookLogs: (recipeId: string) => Promise<CookLog[]>;
  loadRecipesByCategory: (categoryId: string) => Promise<Recipe[]>;
  markRecipeMade: (recipeId: string, notes?: string) => Promise<Recipe | undefined>;
  refreshCategories: () => Promise<void>;
  refreshRecipes: () => Promise<void>;
  updateCategory: (
    categoryId: string,
    input: { description: string; name: string },
  ) => Promise<Category>;
  updateCookLog: (
    recipeId: string,
    cookLogId: string,
    input: CookLogInput,
  ) => Promise<CookLog | undefined>;
  updateRecipe: (
    recipeId: string,
    updates: RecipeCreateInput | Recipe,
    coverImageFile?: File,
  ) => Promise<Recipe | undefined>;
};

const RecipeStoreContext = createContext<RecipeStoreValue | undefined>(undefined);

function displayNameToCookedBy(displayName?: string): CookedBy {
  if (displayName === "Sophie") {
    return "Sophie";
  }

  if (displayName === "Aarav") {
    return "Aarav";
  }

  return "Both";
}

export function RecipeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cookLogsByRecipe, setCookLogsByRecipe] = useState<Record<string, CookLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const updateRecipeInState = useCallback((savedRecipe: Recipe) => {
    setRecipes((currentRecipes) =>
      currentRecipes.map((recipe) => (recipe.id === savedRecipe.id ? savedRecipe : recipe)),
    );
  }, []);

  const refreshRecipes = useCallback(async () => {
    if (!profile) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      setRecipes(await fetchRecipes());
    } catch (recipeError) {
      setError(recipeError instanceof Error ? recipeError.message : "Unable to load recipes.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const refreshCategories = useCallback(async () => {
    if (!profile) {
      return;
    }

    setError(undefined);

    try {
      setCategories(await fetchCategories());
    } catch (categoryError) {
      setError(
        categoryError instanceof Error ? categoryError.message : "Unable to load categories.",
      );
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      window.queueMicrotask(() => {
        setRecipes([]);
        setCategories([]);
        setCookLogsByRecipe({});
        setIsLoading(false);
      });
      return;
    }

    let active = true;

    async function loadCookbookData() {
      setIsLoading(true);
      setError(undefined);

      try {
        const [nextCategories, nextRecipes] = await Promise.all([
          fetchCategories(),
          fetchRecipes(),
        ]);

        if (active) {
          setCategories(nextCategories);
          setRecipes(nextRecipes);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load cookbook.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    window.queueMicrotask(() => {
      loadCookbookData();
    });

    return () => {
      active = false;
    };
  }, [profile]);

  const addRecipe = useCallback(
    async (recipe: RecipeCreateInput, coverImageFile?: File) => {
      if (!profile) {
        throw new Error("You must be signed in to add a recipe.");
      }

      setError(undefined);
      const savedRecipe = await createFirestoreRecipe({
        coverImageFile,
        recipe: recipe as Recipe,
        user: profile,
      });
      setRecipes((currentRecipes) => [savedRecipe, ...currentRecipes]);
      return savedRecipe;
    },
    [profile],
  );

  const updateRecipe = useCallback(
    async (recipeId: string, updates: RecipeCreateInput | Recipe, coverImageFile?: File) => {
      if (!profile) {
        throw new Error("You must be signed in to edit a recipe.");
      }

      setError(undefined);
      const savedRecipe = await updateFirestoreRecipe({
        coverImageFile,
        recipe: updates as Recipe,
        recipeId,
        user: profile,
      });

      setRecipes((currentRecipes) =>
        currentRecipes.map((recipe) => (recipe.id === recipeId ? savedRecipe : recipe)),
      );

      return savedRecipe;
    },
    [profile],
  );

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setError(undefined);
    await deleteFirestoreRecipe(recipeId);
    setRecipes((currentRecipes) =>
      currentRecipes.filter((recipe) => recipe.id !== recipeId),
    );
    setCookLogsByRecipe((currentLogs) => {
      const remainingLogs = { ...currentLogs };
      delete remainingLogs[recipeId];
      return remainingLogs;
    });
  }, []);

  const getRecipe = useCallback(
    (recipeId: string) => recipes.find((recipe) => recipe.id === recipeId),
    [recipes],
  );

  const loadRecipesByCategory = useCallback(async (categoryId: string) => {
    setError(undefined);
    return fetchRecipesByCategory(categoryId);
  }, []);

  const loadCookLogs = useCallback(async (recipeId: string) => {
    setError(undefined);
    const cookLogs = await fetchCookLogs(recipeId);
    setCookLogsByRecipe((currentLogs) => ({
      ...currentLogs,
      [recipeId]: cookLogs,
    }));
    return cookLogs;
  }, []);

  const addCookLog = useCallback(
    async (recipeId: string, input: CookLogInput) => {
      if (!profile) {
        throw new Error("You must be signed in to log a cook.");
      }

      const recipe = recipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      setError(undefined);
      const result = await createCookLog({ input, recipe, user: profile });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);
      return result.cookLog;
    },
    [profile, recipes, updateRecipeInState],
  );

  const updateCookLog = useCallback(
    async (recipeId: string, cookLogId: string, input: CookLogInput) => {
      if (!profile) {
        throw new Error("You must be signed in to edit a cook log.");
      }

      setError(undefined);
      const result = await updateFirestoreCookLog({
        cookLogId,
        input,
        recipeId,
        user: profile,
      });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);
      return result.cookLog;
    },
    [profile, updateRecipeInState],
  );

  const deleteCookLog = useCallback(
    async (recipeId: string, cookLogId: string) => {
      if (!profile) {
        throw new Error("You must be signed in to delete a cook log.");
      }

      setError(undefined);
      const result = await deleteFirestoreCookLog({ cookLogId, recipeId, user: profile });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);
    },
    [profile, updateRecipeInState],
  );

  const markRecipeMade = useCallback(
    async (recipeId: string, notes?: string) => {
      if (!profile) {
        throw new Error("You must be signed in to log a cook.");
      }

      const recipe = recipes.find((item) => item.id === recipeId);

      if (!recipe) {
        return undefined;
      }

      const result = await createCookLog({
        input: {
          cookedBy: displayNameToCookedBy(profile.displayName),
          dateMade: todayString(),
          notes,
        },
        recipe,
        user: profile,
      });
      setCookLogsByRecipe((currentLogs) => ({
        ...currentLogs,
        [recipeId]: result.cookLogs,
      }));
      updateRecipeInState(result.recipe);

      return result.recipe;
    },
    [profile, recipes, updateRecipeInState],
  );

  const addCategory = useCallback(
    async (input: { description: string; name: string }) => {
      if (!profile) {
        throw new Error("You must be signed in to add a category.");
      }

      setError(undefined);
      const savedCategory = await createFirestoreCategory({
        description: input.description,
        name: input.name,
        user: profile,
      });
      setCategories((currentCategories) => [...currentCategories, savedCategory]);
      return savedCategory;
    },
    [profile],
  );

  const updateCategory = useCallback(
    async (categoryId: string, input: { description: string; name: string }) => {
      if (!profile) {
        throw new Error("You must be signed in to edit a category.");
      }

      setError(undefined);
      const savedCategory = await updateFirestoreCategory({
        categoryId,
        description: input.description,
        name: input.name,
        user: profile,
      });
      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? savedCategory : category,
        ),
      );
      return savedCategory;
    },
    [profile],
  );

  const value = useMemo(
    () => ({
      categories,
      cookLogsByRecipe,
      error,
      isLoading,
      recipes,
      addCategory,
      addCookLog,
      addRecipe,
      deleteCookLog,
      deleteRecipe,
      getRecipe,
      loadCookLogs,
      loadRecipesByCategory,
      markRecipeMade,
      refreshCategories,
      refreshRecipes,
      updateCategory,
      updateCookLog,
      updateRecipe,
    }),
    [
      addCategory,
      addCookLog,
      addRecipe,
      categories,
      cookLogsByRecipe,
      deleteCookLog,
      deleteRecipe,
      error,
      getRecipe,
      isLoading,
      loadCookLogs,
      loadRecipesByCategory,
      markRecipeMade,
      recipes,
      refreshCategories,
      refreshRecipes,
      updateCategory,
      updateCookLog,
      updateRecipe,
    ],
  );

  return (
    <RecipeStoreContext.Provider value={value}>{children}</RecipeStoreContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeStoreContext);

  if (!context) {
    throw new Error("useRecipes must be used inside RecipeProvider");
  }

  return context;
}
