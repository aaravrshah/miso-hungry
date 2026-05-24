import type { Ingredient } from "@/lib/recipes";

const fractionCharacters = "\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e";

const ingredientUnits = [
  "tablespoons",
  "tablespoon",
  "teaspoons",
  "teaspoon",
  "bar spoons",
  "bar spoon",
  "ounces",
  "ounce",
  "pounds",
  "pound",
  "grams",
  "gram",
  "cups",
  "cup",
  "handfuls",
  "handful",
  "pinches",
  "pinch",
  "dashes",
  "dash",
  "splashes",
  "splash",
  "bunches",
  "bunch",
  "cloves",
  "clove",
  "knobs",
  "knob",
  "sticks",
  "stick",
  "packets",
  "packet",
  "packages",
  "package",
  "bottles",
  "bottle",
  "jars",
  "jar",
  "bags",
  "bag",
  "boxes",
  "box",
  "cartons",
  "carton",
  "containers",
  "container",
  "scoops",
  "scoop",
  "wedges",
  "wedge",
  "leaves",
  "leaf",
  "sprigs",
  "sprig",
  "slices",
  "slice",
  "wheels",
  "wheel",
  "twists",
  "twist",
  "peels",
  "peel",
  "drops",
  "drop",
  "parts",
  "part",
  "tbsp",
  "tsp",
  "cans",
  "can",
  "lbs",
  "lb",
  "oz",
  "ml",
  "kg",
  "g",
  "l",
].sort((first, second) => second.length - first.length);

const measureQuantities = [
  "bar spoon",
  "splash",
  "dash",
  "pinch",
  "handful",
  "bunch",
  "clove",
  "knob",
  "stick",
  "packet",
  "scoop",
  "wedge",
  "leaf",
  "sprig",
  "slice",
  "wheel",
  "twist",
  "peel",
  "drop",
  "to taste",
  "as needed",
].sort((first, second) => second.length - first.length);

const brandRules = [
  { brand: "Absolut", aliases: ["absolut"], generic: "vodka" },
  { brand: "Tito's", aliases: ["titos", "tito s", "tito's"], generic: "vodka" },
  { brand: "Smirnoff", aliases: ["smirnoff"], generic: "vodka" },
  { brand: "Grey Goose", aliases: ["grey goose"], generic: "vodka" },
  { brand: "Tanqueray", aliases: ["tanqueray"], generic: "gin" },
  { brand: "Bombay", aliases: ["bombay", "bombay sapphire"], generic: "gin" },
  { brand: "Hendrick's", aliases: ["hendricks", "hendrick s", "hendrick's"], generic: "gin" },
  { brand: "Beefeater", aliases: ["beefeater"], generic: "gin" },
  { brand: "Bacardi", aliases: ["bacardi"], generic: "rum" },
  { brand: "Captain Morgan", aliases: ["captain morgan"], generic: "rum" },
  { brand: "Patron", aliases: ["patron", "patr\u00f3n"], generic: "tequila" },
  { brand: "Espolon", aliases: ["espolon"], generic: "tequila" },
  { brand: "Maker's Mark", aliases: ["makers mark", "maker s mark", "maker's mark"], generic: "bourbon" },
  { brand: "Buffalo Trace", aliases: ["buffalo trace"], generic: "bourbon" },
  { brand: "Jameson", aliases: ["jameson"], generic: "whiskey" },
  { brand: "Kikkoman", aliases: ["kikkoman"], generic: "soy sauce" },
  { brand: "Lee Kum Kee", aliases: ["lee kum kee"], generic: "sauce" },
  { brand: "Everest", aliases: ["everest"], generic: "spice" },
  { brand: "Swad", aliases: ["swad"], generic: "spice" },
  { brand: "Ghirardelli", aliases: ["ghirardelli"], generic: "chocolate" },
  { brand: "Hershey's", aliases: ["hersheys", "hershey s", "hershey's"], generic: "chocolate" },
  { brand: "Philadelphia", aliases: ["philadelphia"], generic: "cream cheese" },
  { brand: "King Arthur", aliases: ["king arthur"], generic: "flour" },
  { brand: "Bob's Red Mill", aliases: ["bobs red mill", "bob s red mill", "bob's red mill"], generic: "flour" },
  { brand: "Morton", aliases: ["morton"], generic: "salt" },
  { brand: "Diamond Crystal", aliases: ["diamond crystal"], generic: "salt" },
];

function cleanWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeBrandText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u2019']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return normalizeIngredientName(value).replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
}

function appendNote(notes: string[], value?: string) {
  const cleaned = value?.trim();

  if (cleaned && !notes.some((note) => note.toLowerCase() === cleaned.toLowerCase())) {
    notes.push(cleaned);
  }
}

function normalizeQuantity(value: string) {
  const cleaned = cleanWhitespace(value.toLowerCase());

  if (cleaned === "a" || cleaned === "an" || cleaned === "one") {
    return "1";
  }

  if (cleaned.startsWith("a ")) {
    return cleaned.slice(2);
  }

  if (cleaned.startsWith("one ")) {
    return `1 ${cleaned.slice(4)}`;
  }

  return cleaned;
}

function consumeDecorations(value: string) {
  const notes: string[] = [];
  let cleaned = cleanWhitespace(value);

  cleaned = cleaned.replace(/\(([^)]*)\)/g, (_, note: string) => {
    appendNote(notes, note);
    return " ";
  });
  cleaned = cleanWhitespace(cleaned);

  const leadingNote = cleaned.match(/^(optional|required)\b[:,]?\s*/i);

  if (leadingNote) {
    appendNote(notes, leadingNote[1].toLowerCase());
    cleaned = cleanWhitespace(cleaned.slice(leadingNote[0].length));
  }

  const garnishPrefix = cleaned.match(/^(?:garnish|optional garnish)\s*:\s*/i);

  if (garnishPrefix) {
    appendNote(notes, "garnish");
    cleaned = cleanWhitespace(cleaned.slice(garnishPrefix[0].length));
  }

  const suffixNotes = [
    { pattern: /\s*,?\s*for garnish\s*$/i, note: "garnish" },
    { pattern: /\s*,?\s*optional\s*$/i, note: "optional" },
    { pattern: /\s*,?\s*to taste\s*$/i, note: "to taste" },
    { pattern: /\s*,?\s*as needed\s*$/i, note: "as needed" },
  ];

  for (const suffix of suffixNotes) {
    if (suffix.pattern.test(cleaned)) {
      appendNote(notes, suffix.note);
      cleaned = cleanWhitespace(cleaned.replace(suffix.pattern, ""));
    }
  }

  return {
    cleaned,
    note: notes.join(", ") || undefined,
  };
}

function detectBrand(value: string) {
  const normalizedValue = normalizeBrandText(value);
  const rule = brandRules.find((brandRule) =>
    brandRule.aliases.some(
      (alias) => normalizedValue === alias || normalizedValue.startsWith(`${alias} `),
    ),
  );

  if (!rule) {
    return undefined;
  }

  const alias = rule.aliases.find(
    (candidate) => normalizedValue === candidate || normalizedValue.startsWith(`${candidate} `),
  );
  const rest = alias ? cleanWhitespace(normalizedValue.slice(alias.length)) : "";
  const genericItem = rest || rule.generic;

  return {
    brand: rule.brand,
    item: genericItem,
    productName: value,
  };
}

export function normalizeIngredientName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/-/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(fresh|freshly squeezed|chilled|optional|required)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatIngredientDisplayName(value: string) {
  return titleCase(value);
}

export function parseIngredientLine(line: string): Ingredient {
  const rawLine = cleanWhitespace(line);
  const { cleaned, note } = consumeDecorations(rawLine);
  let remaining = cleaned;
  let quantity = "";
  let unit = "";

  const topWithMatch = remaining.match(/^top\s+(?:with|off\s+with)\s+(.+)$/i);

  if (topWithMatch) {
    quantity = "top with";
    remaining = topWithMatch[1].trim();
  } else {
    const quantityToken = `(?:\\d+\\s+\\d+\\/\\d+|\\d+(?:\\.\\d+)?|[${fractionCharacters}]|a\\s+few|few|a\\s+couple|couple|to\\s+taste|as\\s+needed|a|an|one|half)`;
    const unitToken = ingredientUnits.map((item) => item.replace(/\s+/g, "\\s+")).join("|");
    const quantityUnitMatch = remaining.match(
      new RegExp(`^(${quantityToken})\\s+(${unitToken})\\b\\s*(?:of\\s+)?(.+)$`, "i"),
    );

    if (quantityUnitMatch) {
      quantity = normalizeQuantity(quantityUnitMatch[1]);
      unit = quantityUnitMatch[2].toLowerCase();
      remaining = quantityUnitMatch[3].trim();
    } else {
      const measureQuantityToken = measureQuantities
        .map((item) => item.replace(/\s+/g, "\\s+"))
        .join("|");
      const measureQuantityMatch = remaining.match(
        new RegExp(`^((?:a|an|one)\\s+)?(${measureQuantityToken})s?\\b\\s*(?:of\\s+)?(.+)$`, "i"),
      );

      if (measureQuantityMatch) {
        quantity = normalizeQuantity(
          `${measureQuantityMatch[1] ?? ""}${measureQuantityMatch[2]}`,
        );
        remaining = measureQuantityMatch[3].trim();
      } else {
        const quantityOnlyMatch = remaining.match(
          new RegExp(`^(${quantityToken})\\s+(?:of\\s+)?(.+)$`, "i"),
        );

        if (quantityOnlyMatch) {
          quantity = normalizeQuantity(quantityOnlyMatch[1]);
          remaining = quantityOnlyMatch[2].trim();
        }
      }
    }
  }

  remaining = remaining.replace(/^of\s+/i, "").trim();
  const brandMatch = detectBrand(remaining);

  return {
    quantity,
    unit,
    item: brandMatch?.item || remaining || cleaned || rawLine,
    brand: brandMatch?.brand,
    productName: brandMatch?.productName,
    note,
  };
}

export function parseIngredients(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredientLine);
}

export function normalizeIngredientNameForMatching(value: string) {
  const parsedIngredient = parseIngredientLine(value);
  return normalizeIngredientName(parsedIngredient.item || parsedIngredient.productName || value);
}
