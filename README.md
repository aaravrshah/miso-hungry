# Miso Hungry

A warm personal recipe tracking app for saving, cooking, sharing, and rating recipes with friends.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## UI preview screenshots

The app has a Firebase-free demo route at `http://localhost:3000/demo` for UI
iteration. Playwright can capture that route across mobile, tablet, and desktop
without signing in or touching real data.

One-time browser install:

```bash
npx playwright install chromium
```

Capture screenshots:

```bash
npm run screenshots:demo
```

Screenshots are written to `artifacts/demo-screenshots/` and are ignored by git.

## Firebase setup

Create `.env.local` from `.env.example` and fill in the `NEXT_PUBLIC_FIREBASE_*`
values from your Firebase web app settings. Enable Email/Password auth, Google
auth, Cloud Firestore, and Firebase Storage in the Firebase console.

Firestore collections used by the app:

- `users/{userId}`: display name, email, username, profile photo, and profile metadata.
- `recipes/{recipeId}`: recipe fields, ratings, category id/name, and cover image URL/path.
- `categories/{categoryId}`: default and custom cookbook shelves.
- `cookLogs/{cookLogId}`: one entry each time a signed-in user marks a recipe made.
- `groceryLists/{listId}`: persisted grocery items for recipe planning and shopping.

Firebase Storage paths used by the app:

- `profile-images/{userId}/{fileName}`: user profile photos.
- `recipe-images/{recipeId}/{fileName}`: recipe cover photos.
- `category-images/{categoryId}/{fileName}`: category cover photos.
