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
  {
    baseSpirit: "Gin",
    description: "Cold, clean, and all about the gin.",
    difficulty: "Medium",
    flavor: ["spirit-forward", "dry", "botanical"],
    glass: "Coupe",
    id: "martini",
    ingredients: [
      drinkIngredient("Gin", "2.5", "oz"),
      drinkIngredient("Dry vermouth", "0.5", "oz"),
      drinkIngredient("Orange bitters", "1", "dash"),
      drinkIngredient("Lemon peel", "1", ""),
    ],
    method: "Stir with ice until very cold and strain into a chilled coupe.",
    tags: ["classic", "stirred", "dry"],
    title: "Martini",
  },
  {
    baseSpirit: "Whiskey",
    description: "Rich, stirred, and quietly fancy.",
    difficulty: "Easy",
    flavor: ["spirit-forward", "sweet", "aromatic"],
    glass: "Coupe",
    id: "manhattan",
    ingredients: [
      drinkIngredient("Rye whiskey", "2", "oz"),
      drinkIngredient("Sweet vermouth", "1", "oz"),
      drinkIngredient("Angostura bitters", "2", "dashes"),
      drinkIngredient("Cherry", "1", ""),
    ],
    method: "Stir with ice and strain into a coupe. Garnish with a cherry.",
    tags: ["classic", "stirred", "whiskey"],
    title: "Manhattan",
  },
  {
    baseSpirit: "Whiskey",
    description: "A whiskey Negroni: bitter, plush, and excellent before dinner.",
    difficulty: "Easy",
    flavor: ["bitter", "spirit-forward", "orange"],
    glass: "Rocks",
    id: "boulevardier",
    ingredients: [
      drinkIngredient("Bourbon", "1.25", "oz"),
      drinkIngredient("Campari", "1", "oz"),
      drinkIngredient("Sweet vermouth", "1", "oz"),
      drinkIngredient("Orange peel", "1", ""),
    ],
    method: "Stir with ice and serve over a large cube.",
    tags: ["bitter", "classic", "stirred"],
    title: "Boulevardier",
  },
  {
    baseSpirit: "Tequila",
    description: "Grapefruit, lime, salt, and bubbles in a glass.",
    difficulty: "Easy",
    flavor: ["citrus", "sparkling", "salty"],
    glass: "Highball",
    id: "paloma",
    ingredients: [
      drinkIngredient("Tequila", "2", "oz"),
      drinkIngredient("Grapefruit soda", "4", "oz"),
      drinkIngredient("Lime juice", "0.5", "oz"),
      drinkIngredient("Salt", "1", "pinch"),
    ],
    method: "Build over ice and stir gently.",
    tags: ["highball", "refreshing", "tequila"],
    title: "Paloma",
  },
  {
    baseSpirit: "Rum",
    description: "Dark rum and ginger beer, stormy in the best way.",
    difficulty: "Easy",
    flavor: ["ginger", "spiced", "refreshing"],
    glass: "Highball",
    id: "dark-stormy",
    ingredients: [
      drinkIngredient("Dark rum", "2", "oz"),
      drinkIngredient("Ginger beer", "4", "oz"),
      drinkIngredient("Lime juice", "0.5", "oz"),
    ],
    method: "Build over ice with ginger beer, then float the rum.",
    tags: ["highball", "ginger", "easy"],
    title: "Dark & Stormy",
  },
  {
    baseSpirit: "Gin",
    description: "A fizzy gin lemonade that feels tailor-made for porch weather.",
    difficulty: "Easy",
    flavor: ["citrus", "sparkling", "refreshing"],
    glass: "Collins",
    id: "tom-collins",
    ingredients: [
      drinkIngredient("Gin", "2", "oz"),
      drinkIngredient("Lemon juice", "1", "oz"),
      drinkIngredient("Simple syrup", "0.75", "oz"),
      drinkIngredient("Soda water", "3", "oz"),
    ],
    method: "Shake gin, lemon, and syrup. Strain over ice and top with soda.",
    tags: ["collins", "classic", "refreshing"],
    title: "Tom Collins",
  },
  {
    baseSpirit: "Gin",
    description: "Gin, lemon, and bubbles with a little celebration built in.",
    difficulty: "Medium",
    flavor: ["citrus", "sparkling", "bright"],
    glass: "Flute",
    id: "french-75",
    ingredients: [
      drinkIngredient("Gin", "1", "oz"),
      drinkIngredient("Lemon juice", "0.5", "oz"),
      drinkIngredient("Simple syrup", "0.5", "oz"),
      drinkIngredient("Champagne", "3", "oz"),
    ],
    method: "Shake gin, lemon, and syrup. Strain into a flute and top with Champagne.",
    tags: ["sparkling", "classic", "party"],
    title: "French 75",
  },
  {
    baseSpirit: "Vodka",
    description: "Coffee, vodka, and a glossy foam top.",
    difficulty: "Medium",
    flavor: ["coffee", "rich", "bittersweet"],
    glass: "Coupe",
    id: "espresso-martini",
    ingredients: [
      drinkIngredient("Vodka", "1.5", "oz"),
      drinkIngredient("Coffee liqueur", "0.75", "oz"),
      drinkIngredient("Espresso", "1", "oz"),
      drinkIngredient("Simple syrup", "0.25", "oz"),
    ],
    method: "Shake hard with ice and fine strain into a coupe.",
    tags: ["coffee", "shaken", "after-dinner"],
    title: "Espresso Martini",
  },
  {
    baseSpirit: "Rum",
    description: "A nutty, citrusy tiki classic with real depth.",
    difficulty: "Hard",
    flavor: ["tropical", "nutty", "citrus"],
    glass: "Rocks",
    id: "mai-tai",
    ingredients: [
      drinkIngredient("Aged rum", "2", "oz"),
      drinkIngredient("Lime juice", "0.75", "oz"),
      drinkIngredient("Orange liqueur", "0.5", "oz"),
      drinkIngredient("Orgeat", "0.5", "oz"),
      drinkIngredient("Mint", "1", "sprig"),
    ],
    method: "Shake with crushed ice and garnish with mint.",
    tags: ["tiki", "rum", "citrus"],
    title: "Mai Tai",
  },
  {
    baseSpirit: "Whiskey",
    description: "Equal-parts modern classic: tart, bitter, and bright orange.",
    difficulty: "Easy",
    flavor: ["bitter", "citrus", "balanced"],
    glass: "Coupe",
    id: "paper-plane",
    ingredients: [
      drinkIngredient("Bourbon", "0.75", "oz"),
      drinkIngredient("Aperol", "0.75", "oz"),
      drinkIngredient("Amaro Nonino", "0.75", "oz"),
      drinkIngredient("Lemon juice", "0.75", "oz"),
    ],
    method: "Shake with ice and strain into a coupe.",
    tags: ["modern", "equal-parts", "shaken"],
    title: "Paper Plane",
  },
  {
    baseSpirit: "Whiskey",
    description: "Smoky, gingery, honeyed, and very cozy.",
    difficulty: "Medium",
    flavor: ["smoky", "ginger", "honey"],
    glass: "Rocks",
    id: "penicillin",
    ingredients: [
      drinkIngredient("Blended scotch", "2", "oz"),
      drinkIngredient("Lemon juice", "0.75", "oz"),
      drinkIngredient("Honey syrup", "0.75", "oz"),
      drinkIngredient("Ginger", "3", "slices"),
    ],
    method: "Shake with ice and strain over a large cube.",
    tags: ["modern", "scotch", "ginger"],
    title: "Penicillin",
  },
  {
    baseSpirit: "Gin",
    description: "Lemon, honey, and gin in a soft sunny sour.",
    difficulty: "Easy",
    flavor: ["citrus", "honey", "botanical"],
    glass: "Coupe",
    id: "bees-knees",
    ingredients: [
      drinkIngredient("Gin", "2", "oz"),
      drinkIngredient("Lemon juice", "0.75", "oz"),
      drinkIngredient("Honey syrup", "0.75", "oz"),
    ],
    method: "Shake with ice and strain into a coupe.",
    tags: ["classic", "sour", "honey"],
    title: "Bee's Knees",
  },
  {
    baseSpirit: "Pisco",
    description: "A frothy South American sour with a clean grape spirit base.",
    difficulty: "Medium",
    flavor: ["citrus", "silky", "bright"],
    glass: "Coupe",
    id: "pisco-sour",
    ingredients: [
      drinkIngredient("Pisco", "2", "oz"),
      drinkIngredient("Lime juice", "1", "oz"),
      drinkIngredient("Simple syrup", "0.75", "oz"),
      drinkIngredient("Egg white", "1", ""),
      drinkIngredient("Angostura bitters", "2", "dashes"),
    ],
    method: "Dry shake, shake with ice, and garnish with bitters.",
    tags: ["sour", "silky", "classic"],
    title: "Pisco Sour",
  },
  {
    baseSpirit: "Gin",
    description: "Equal-parts herbal, tart, sweet, and electric green.",
    difficulty: "Easy",
    flavor: ["herbal", "citrus", "complex"],
    glass: "Coupe",
    id: "last-word",
    ingredients: [
      drinkIngredient("Gin", "0.75", "oz"),
      drinkIngredient("Green Chartreuse", "0.75", "oz"),
      drinkIngredient("Maraschino liqueur", "0.75", "oz"),
      drinkIngredient("Lime juice", "0.75", "oz"),
    ],
    method: "Shake with ice and strain into a coupe.",
    tags: ["classic", "equal-parts", "herbal"],
    title: "Last Word",
  },
  {
    baseSpirit: "Brandy",
    description: "A crisp brandy sour with orange liqueur and a sugar rim.",
    difficulty: "Medium",
    flavor: ["citrus", "tart", "elegant"],
    glass: "Coupe",
    id: "sidecar",
    ingredients: [
      drinkIngredient("Cognac", "2", "oz"),
      drinkIngredient("Orange liqueur", "0.75", "oz"),
      drinkIngredient("Lemon juice", "0.75", "oz"),
    ],
    method: "Shake with ice and strain into a sugar-rimmed coupe.",
    tags: ["classic", "sour", "brandy"],
    title: "Sidecar",
  },
  {
    baseSpirit: "Whiskey",
    description: "Rye, absinthe, bitters, and a little New Orleans attitude.",
    difficulty: "Medium",
    flavor: ["spirit-forward", "anise", "aromatic"],
    glass: "Rocks",
    id: "sazerac",
    ingredients: [
      drinkIngredient("Rye whiskey", "2", "oz"),
      drinkIngredient("Simple syrup", "0.25", "oz"),
      drinkIngredient("Peychaud's bitters", "3", "dashes"),
      drinkIngredient("Absinthe", "1", "rinse"),
      drinkIngredient("Lemon peel", "1", ""),
    ],
    method: "Stir, strain into an absinthe-rinsed glass, and express lemon peel.",
    tags: ["classic", "stirred", "new-orleans"],
    title: "Sazerac",
  },
  {
    baseSpirit: "Campari",
    description: "Bitter, bubbly, low-ABV, and perfect before dinner.",
    difficulty: "Easy",
    flavor: ["bitter", "sparkling", "orange"],
    glass: "Highball",
    id: "americano",
    ingredients: [
      drinkIngredient("Campari", "1.5", "oz"),
      drinkIngredient("Sweet vermouth", "1.5", "oz"),
      drinkIngredient("Soda water", "3", "oz"),
      drinkIngredient("Orange slice", "1", ""),
    ],
    method: "Build over ice and stir gently.",
    tags: ["low-abv", "bitter", "classic"],
    title: "Americano",
  },
  {
    baseSpirit: "Rum",
    description: "Rum, cola, lime, and no stress.",
    difficulty: "Easy",
    flavor: ["cola", "citrus", "refreshing"],
    glass: "Highball",
    id: "cuba-libre",
    ingredients: [
      drinkIngredient("Rum", "2", "oz"),
      drinkIngredient("Cola", "4", "oz"),
      drinkIngredient("Lime", "1", "wedge"),
    ],
    method: "Build over ice and squeeze in lime.",
    tags: ["easy", "highball", "rum"],
    title: "Cuba Libre",
  },
  {
    baseSpirit: "Tequila",
    description: "Tequila, lime, mineral water, and a long cold glass.",
    difficulty: "Easy",
    flavor: ["citrus", "mineral", "refreshing"],
    glass: "Highball",
    id: "ranch-water",
    ingredients: [
      drinkIngredient("Tequila", "2", "oz"),
      drinkIngredient("Lime juice", "0.75", "oz"),
      drinkIngredient("Sparkling water", "4", "oz"),
    ],
    method: "Build over ice and stir lightly.",
    tags: ["easy", "tequila", "highball"],
    title: "Ranch Water",
  },
  {
    baseSpirit: "Cachaça",
    description: "Lime muddled with sugar and grassy Brazilian spirit.",
    difficulty: "Easy",
    flavor: ["citrus", "bright", "grassy"],
    glass: "Rocks",
    id: "caipirinha",
    ingredients: [
      drinkIngredient("Cachaça", "2", "oz"),
      drinkIngredient("Lime", "1", ""),
      drinkIngredient("Sugar", "2", "tsp"),
    ],
    method: "Muddle lime and sugar, add cachaça and ice, then stir.",
    tags: ["classic", "citrus", "cachaca"],
    title: "Caipirinha",
  },
];

const aliasLookup: Record<string, string[]> = {
  bourbon: ["whiskey"],
  "rye whiskey": ["whiskey", "rye"],
  "dark rum": ["rum"],
  "aged rum": ["rum"],
  "white rum": ["rum"],
  "dry vermouth": ["vermouth"],
  "lime juice": ["lime"],
  "lemon juice": ["lemon"],
  "lemon peel": ["lemon"],
  "orange peel": ["orange", "orange slice"],
  "orange slice": ["orange", "orange peel"],
  "simple syrup": ["sugar syrup"],
  "honey syrup": ["honey"],
  "agave syrup": ["agave nectar"],
  "soda water": ["club soda", "sparkling water"],
  "club soda": ["soda water", "sparkling water"],
  "sparkling water": ["soda water", "club soda", "mineral water"],
  "tonic water": ["tonic"],
  "sweet vermouth": ["vermouth"],
  "angostura bitters": ["bitters"],
  "peychaud's bitters": ["bitters"],
  "orange bitters": ["bitters"],
  "triple sec": ["cointreau", "orange liqueur"],
  "orange liqueur": ["triple sec", "cointreau"],
  "lemon lime soda": ["sprite", "7up", "7 up", "sierra mist", "starry"],
  cola: ["coke", "coca cola", "pepsi"],
  prosecco: ["sparkling wine"],
  champagne: ["sparkling wine"],
  "ginger beer": ["ginger ale"],
  "grapefruit soda": ["grapefruit", "squirt", "jarritos grapefruit"],
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
