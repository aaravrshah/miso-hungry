import {
  normalizeDrinkIngredientName,
  formatDrinkIngredientName,
} from "@/lib/services/drinkCabinetService";
import { getRecipeCategoryNames, type Ingredient, type Recipe } from "@/lib/recipes";
import type { UserSummary } from "@/lib/firebase/schema";

export type DrinkSource = "mine" | "friends" | "catalog";
export type DrinkSourceFilter = DrinkSource | "all";
export type DrinkMatchStatus = "canMake" | "missing1" | "missing2" | "missingMany";

export type CatalogDrink = {
  baseSpirit?: string;
  description: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  flavor: string[];
  glass?: string;
  id: string;
  ingredients: Ingredient[];
  method: string;
  tags: string[];
  title: string;
};

export type DrinkCandidate = {
  baseSpirit?: string;
  description: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  flavor: string[];
  glass?: string;
  id: string;
  ingredients: Ingredient[];
  method?: string;
  owner?: UserSummary;
  recipe?: Recipe;
  source: DrinkSource;
  tags: string[];
  title: string;
};

export type DrinkMatch = DrinkCandidate & {
  availableIngredientCount: number;
  matchScore: number;
  matchStatus: DrinkMatchStatus;
  missingIngredients: string[];
  requiredIngredients: string[];
};

function drinkIngredient(item: string, quantity = "", unit = ""): Ingredient {
  return {
    item,
    quantity,
    unit,
  };
}

export const catalogDrinks: CatalogDrink[] = [
  {
    baseSpirit: "Gin",
    description: "Crisp, bright, and almost impossible not to finish quickly.",
    difficulty: "Easy",
    flavor: ["citrus", "refreshing", "botanical"],
    glass: "Highball",
    id: "gin-tonic",
    ingredients: [
      drinkIngredient("Gin", "2", "oz"),
      drinkIngredient("Tonic water", "4", "oz"),
      drinkIngredient("Lime", "1", "wedge"),
    ],
    method: "Build over ice and gently stir.",
    tags: ["classic", "easy", "highball"],
    title: "Gin & Tonic",
  },
  {
    baseSpirit: "Tequila",
    description: "A clean sour with enough salt and citrus to wake everything up.",
    difficulty: "Medium",
    flavor: ["citrus", "tart", "bright"],
    glass: "Rocks",
    id: "margarita",
    ingredients: [
      drinkIngredient("Tequila", "2", "oz"),
      drinkIngredient("Lime juice", "1", "oz"),
      drinkIngredient("Triple sec", "0.75", "oz"),
      drinkIngredient("Agave syrup", "0.25", "oz"),
    ],
    method: "Shake with ice and strain into a salted rocks glass.",
    tags: ["classic", "sour", "party"],
    title: "Margarita",
  },
  {
    baseSpirit: "Whiskey",
    description: "Cozy, aromatic, and the easiest way to make whiskey feel dressed up.",
    difficulty: "Easy",
    flavor: ["spirit-forward", "bittersweet", "orange"],
    glass: "Rocks",
    id: "old-fashioned",
    ingredients: [
      drinkIngredient("Bourbon", "2", "oz"),
      drinkIngredient("Simple syrup", "0.25", "oz"),
      drinkIngredient("Angostura bitters", "2", "dashes"),
      drinkIngredient("Orange peel", "1", ""),
    ],
    method: "Stir with ice, strain over one large cube, and express orange peel.",
    tags: ["classic", "stirred", "spirit-forward"],
    title: "Old Fashioned",
  },
  {
    baseSpirit: "Gin",
    description: "Equal parts bitter, sweet, and botanical.",
    difficulty: "Easy",
    flavor: ["bitter", "herbal", "spirit-forward"],
    glass: "Rocks",
    id: "negroni",
    ingredients: [
      drinkIngredient("Gin", "1", "oz"),
      drinkIngredient("Campari", "1", "oz"),
      drinkIngredient("Sweet vermouth", "1", "oz"),
      drinkIngredient("Orange peel", "1", ""),
    ],
    method: "Stir with ice and serve over a large cube.",
    tags: ["classic", "bitter", "stirred"],
    title: "Negroni",
  },
  {
    baseSpirit: "Vodka",
    description: "Tart, clean, and very fast to make.",
    difficulty: "Easy",
    flavor: ["citrus", "tart", "clean"],
    glass: "Coupe",
    id: "cosmopolitan",
    ingredients: [
      drinkIngredient("Vodka", "1.5", "oz"),
      drinkIngredient("Triple sec", "0.75", "oz"),
      drinkIngredient("Cranberry juice", "0.75", "oz"),
      drinkIngredient("Lime juice", "0.5", "oz"),
    ],
    method: "Shake with ice and strain into a coupe.",
    tags: ["classic", "citrus", "shaken"],
    title: "Cosmopolitan",
  },
  {
    baseSpirit: "Rum",
    description: "Minty, fizzy, limey, and built for hot evenings.",
    difficulty: "Medium",
    flavor: ["mint", "citrus", "refreshing"],
    glass: "Highball",
    id: "mojito",
    ingredients: [
      drinkIngredient("White rum", "2", "oz"),
      drinkIngredient("Lime juice", "1", "oz"),
      drinkIngredient("Simple syrup", "0.75", "oz"),
      drinkIngredient("Mint", "8", "leaves"),
      drinkIngredient("Soda water", "2", "oz"),
    ],
    method: "Gently muddle mint, add the rest, and build over crushed ice.",
    tags: ["mint", "refreshing", "highball"],
    title: "Mojito",
  },
  {
    baseSpirit: "Vodka",
    description: "Spicy, cold, and brunch-adjacent without trying too hard.",
    difficulty: "Easy",
    flavor: ["spicy", "savory", "refreshing"],
    glass: "Copper mug",
    id: "moscow-mule",
    ingredients: [
      drinkIngredient("Vodka", "2", "oz"),
      drinkIngredient("Lime juice", "0.5", "oz"),
      drinkIngredient("Ginger beer", "4", "oz"),
    ],
    method: "Build over ice and stir once.",
    tags: ["easy", "ginger", "highball"],
    title: "Moscow Mule",
  },
  {
    baseSpirit: "Rum",
    description: "A bright, simple rum sour.",
    difficulty: "Easy",
    flavor: ["citrus", "tart", "clean"],
    glass: "Coupe",
    id: "daiquiri",
    ingredients: [
      drinkIngredient("White rum", "2", "oz"),
      drinkIngredient("Lime juice", "1", "oz"),
      drinkIngredient("Simple syrup", "0.75", "oz"),
    ],
    method: "Shake hard with ice and strain into a coupe.",
    tags: ["classic", "sour", "shaken"],
    title: "Daiquiri",
  },
  {
    baseSpirit: "Whiskey",
    description: "Silky, tart, and friendly enough for almost anyone.",
    difficulty: "Medium",
    flavor: ["citrus", "silky", "tart"],
    glass: "Rocks",
    id: "whiskey-sour",
    ingredients: [
      drinkIngredient("Bourbon", "2", "oz"),
      drinkIngredient("Lemon juice", "0.75", "oz"),
      drinkIngredient("Simple syrup", "0.75", "oz"),
      drinkIngredient("Egg white", "1", ""),
    ],
    method: "Dry shake, shake again with ice, and strain.",
    tags: ["classic", "sour", "silky"],
    title: "Whiskey Sour",
  },
  {
    baseSpirit: "Aperol",
    description: "Low effort, sunset-colored, and gently bitter.",
    difficulty: "Easy",
    flavor: ["bitter", "sparkling", "orange"],
    glass: "Wine glass",
    id: "aperol-spritz",
    ingredients: [
      drinkIngredient("Aperol", "3", "oz"),
      drinkIngredient("Prosecco", "3", "oz"),
      drinkIngredient("Soda water", "1", "oz"),
      drinkIngredient("Orange slice", "1", ""),
    ],
    method: "Build over ice and stir gently.",
    tags: ["spritz", "low-abv", "easy"],
    title: "Aperol Spritz",
  },
  {
    baseSpirit: "Nonalcoholic",
    description: "A ginger-lime cooler that still feels like a real drink.",
    difficulty: "Easy",
    flavor: ["ginger", "citrus", "refreshing"],
    glass: "Highball",
    id: "ginger-lime-fizz",
    ingredients: [
      drinkIngredient("Lime juice", "1", "oz"),
      drinkIngredient("Simple syrup", "0.5", "oz"),
      drinkIngredient("Ginger beer", "4", "oz"),
      drinkIngredient("Mint", "4", "leaves"),
    ],
    method: "Build over ice and garnish with mint.",
    tags: ["mocktail", "ginger", "easy"],
    title: "Ginger Lime Fizz",
  },
  {
    baseSpirit: "Nonalcoholic",
    description: "Tart, sparkling, and dinner-party friendly.",
    difficulty: "Easy",
    flavor: ["berry", "tart", "sparkling"],
    glass: "Highball",
    id: "cranberry-rosemary-spritz",
    ingredients: [
      drinkIngredient("Cranberry juice", "3", "oz"),
      drinkIngredient("Lemon juice", "0.5", "oz"),
      drinkIngredient("Soda water", "3", "oz"),
      drinkIngredient("Rosemary", "1", "sprig"),
    ],
    method: "Build over ice and stir lightly.",
    tags: ["mocktail", "spritz", "holiday"],
    title: "Cranberry Rosemary Spritz",
  },
];

const aliasLookup: Record<string, string[]> = {
  bourbon: ["whiskey"],
  "white rum": ["rum"],
  "lime juice": ["lime"],
  "lemon juice": ["lemon"],
  "orange peel": ["orange", "orange slice"],
  "orange slice": ["orange", "orange peel"],
  "simple syrup": ["sugar syrup"],
  "agave syrup": ["agave nectar"],
  "soda water": ["club soda", "sparkling water"],
  "tonic water": ["tonic"],
  "sweet vermouth": ["vermouth"],
  "angostura bitters": ["bitters"],
  "triple sec": ["cointreau", "orange liqueur"],
};

export function isDrinkRecipe(recipe: Recipe) {
  const categoryNames = getRecipeCategoryNames(recipe).map((category) =>
    category.toLowerCase(),
  );
  const tags = (recipe.tags ?? []).map((tag) => tag.toLowerCase());
  const searchableText = [
    recipe.title,
    recipe.description,
    recipe.cuisine,
    ...categoryNames,
    ...tags,
  ]
    .join(" ")
    .toLowerCase();

  return /drink|cocktail|mocktail|beverage|bar|spritz|sour|margarita|martini/.test(
    searchableText,
  );
}

export function drinkCandidateFromRecipe({
  owner,
  recipe,
  source,
}: {
  owner?: UserSummary;
  recipe: Recipe;
  source: Exclude<DrinkSource, "catalog">;
}): DrinkCandidate {
  return {
    description: recipe.description || recipe.notes || "Saved drink recipe.",
    difficulty: recipe.difficulty,
    flavor: recipe.tags ?? [],
    id: recipe.id,
    ingredients: recipe.ingredients,
    method: recipe.directions.map((direction) => direction.instruction).join(" "),
    owner,
    recipe,
    source,
    tags: recipe.tags ?? [],
    title: recipe.title,
  };
}

export function drinkCandidateFromCatalog(drink: CatalogDrink): DrinkCandidate {
  return {
    ...drink,
    source: "catalog",
  };
}

function ingredientAliases(value: string) {
  const normalized = normalizeDrinkIngredientName(value);
  const aliases = aliasLookup[normalized] ?? [];
  const juiceFruit = normalized.endsWith(" juice")
    ? [normalized.replace(/\s+juice$/, "")]
    : [];
  const singular = normalized.endsWith("s") ? [normalized.slice(0, -1)] : [];

  return new Set([normalized, ...aliases, ...juiceFruit, ...singular]);
}

function ingredientAvailable(requiredIngredient: string, availableIngredients: Set<string>) {
  const possibleNames = ingredientAliases(requiredIngredient);

  for (const possibleName of possibleNames) {
    if (availableIngredients.has(possibleName)) {
      return true;
    }
  }

  return false;
}

export function requiredDrinkIngredients(ingredients: Ingredient[]) {
  const seen = new Set<string>();

  return ingredients
    .map((ingredient) => formatDrinkIngredientName(ingredient.item || ingredient.productName || ""))
    .filter(Boolean)
    .filter((ingredient) => {
      const normalized = normalizeDrinkIngredientName(ingredient);

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

function matchStatusFromMissingCount(missingCount: number): DrinkMatchStatus {
  if (missingCount === 0) {
    return "canMake";
  }

  if (missingCount === 1) {
    return "missing1";
  }

  if (missingCount === 2) {
    return "missing2";
  }

  return "missingMany";
}

export function drinkMatchesQuery(candidate: DrinkCandidate, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    candidate.title,
    candidate.description,
    candidate.baseSpirit,
    candidate.glass,
    candidate.method,
    candidate.owner?.displayName,
    candidate.source,
    ...candidate.tags,
    ...candidate.flavor,
    ...candidate.ingredients.map((ingredient) => ingredient.item),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function matchDrinkCandidate({
  availableIngredients,
  candidate,
}: {
  availableIngredients: string[];
  candidate: DrinkCandidate;
}): DrinkMatch {
  const availableIngredientSet = new Set(
    availableIngredients.map(normalizeDrinkIngredientName).filter(Boolean),
  );
  const requiredIngredients = requiredDrinkIngredients(candidate.ingredients);
  const missingIngredients = requiredIngredients.filter(
    (ingredient) => !ingredientAvailable(ingredient, availableIngredientSet),
  );
  const availableIngredientCount = requiredIngredients.length - missingIngredients.length;
  const matchScore =
    availableIngredientCount * 20 -
    missingIngredients.length * 8 +
    (candidate.source === "mine" ? 10 : candidate.source === "friends" ? 5 : 0);

  return {
    ...candidate,
    availableIngredientCount,
    matchScore,
    matchStatus: matchStatusFromMissingCount(missingIngredients.length),
    missingIngredients,
    requiredIngredients,
  };
}

export function sortDrinkMatches(matches: DrinkMatch[]) {
  return [...matches].sort((first, second) => {
    const statusOrder: Record<DrinkMatchStatus, number> = {
      canMake: 0,
      missing1: 1,
      missing2: 2,
      missingMany: 3,
    };
    const statusSort = statusOrder[first.matchStatus] - statusOrder[second.matchStatus];

    if (statusSort !== 0) {
      return statusSort;
    }

    return second.matchScore - first.matchScore || first.title.localeCompare(second.title);
  });
}

export function collectDrinkIngredientSuggestions(candidates: DrinkCandidate[]) {
  const seen = new Set<string>();

  return candidates
    .flatMap((candidate) => requiredDrinkIngredients(candidate.ingredients))
    .filter((ingredient) => {
      const normalized = normalizeDrinkIngredientName(ingredient);

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .sort((first, second) => first.localeCompare(second));
}
