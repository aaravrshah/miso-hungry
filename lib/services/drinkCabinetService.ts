"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { DrinkCabinet, UserProfile } from "@/lib/firebase/schema";
import {
  formatIngredientDisplayName,
  normalizeIngredientName,
  normalizeIngredientNameForMatching,
} from "@/lib/ingredientRecognition";

export function normalizeDrinkIngredientName(value: string) {
  return normalizeIngredientNameForMatching(value);
}

export function formatDrinkIngredientName(value: string) {
  return formatIngredientDisplayName(normalizeDrinkIngredientName(value));
}

export function parseDrinkIngredientText(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[\n,]/)
    .map(formatDrinkIngredientName)
    .filter(Boolean)
    .filter((ingredient) => {
      const normalized = normalizeIngredientName(ingredient);

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
