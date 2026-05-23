"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { DrinkCabinet, UserProfile } from "@/lib/firebase/schema";

export function normalizeDrinkIngredientName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b(fresh|freshly squeezed|chilled)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDrinkIngredientName(value: string) {
  const normalized = normalizeDrinkIngredientName(value);

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function parseDrinkIngredientText(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[\n,]/)
    .map(formatDrinkIngredientName)
    .filter(Boolean)
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

export async function fetchDrinkCabinet(userId: string) {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, firebaseCollections.drinkCabinets, userId));

  if (!snapshot.exists()) {
    return {
      id: userId,
      userId,
      displayName: "",
      ingredients: [],
    } satisfies DrinkCabinet;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as DrinkCabinet;
}

export async function saveDrinkCabinet({
  ingredients,
  user,
}: {
  ingredients: string[];
  user: UserProfile;
}) {
  const { db } = getFirebaseServices();
  const cabinet: DrinkCabinet = {
    id: user.id,
    userId: user.id,
    displayName: String(user.displayName || user.email || "Cook"),
    ingredients: parseDrinkIngredientText(ingredients.join("\n")),
  };

  await setDoc(
    doc(db, firebaseCollections.drinkCabinets, user.id),
    {
      ...cabinet,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return cabinet;
}
