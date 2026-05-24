import type {
  AppNotification,
  CollaborationInvite,
  CookLog,
  FriendRequest,
  NotificationPreferences,
  UserProfile,
  UserSummary,
} from "@/lib/firebase/schema";
import type { Category, Recipe } from "@/lib/recipes";

export const demoNotificationPreferences: NotificationPreferences = {
  collaboration: true,
  recipeActivity: true,
  reminders: true,
  social: true,
};

export const demoCurrentUser: UserProfile = {
  accountVisibility: "public",
  bio: "Testing a calmer, faster cookbook UI with local demo data.",
  defaultRecipeVisibility: "friends",
  displayName: "Aarav",
  email: "aarav.demo@miso-hungry.local",
  id: "demo-aarav",
  notificationPreferences: demoNotificationPreferences,
  photoURL:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
  username: "aarav",
};

export const demoUsers: UserProfile[] = [
  demoCurrentUser,
  {
    accountVisibility: "public",
    bio: "Dessert tester, noodle enthusiast, and reliable second opinion.",
    defaultRecipeVisibility: "friends",
    displayName: "Sophie",
    email: "sophie.demo@miso-hungry.local",
    id: "demo-sophie",
    notificationPreferences: demoNotificationPreferences,
    photoURL:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    username: "sophie",
  },
  {
    accountVisibility: "public",
    bio: "Always saving spicy recipes for later.",
    defaultRecipeVisibility: "public",
    displayName: "Michael",
    email: "michael.demo@miso-hungry.local",
    id: "demo-michael",
    notificationPreferences: demoNotificationPreferences,
    photoURL:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
    username: "michael",
  },
  {
    accountVisibility: "public",
    bio: "Cocktails, weeknight dinners, and strong opinions about fries.",
    defaultRecipeVisibility: "friends",
    displayName: "Owen",
    email: "owen.demo@miso-hungry.local",
    id: "demo-owen",
    notificationPreferences: demoNotificationPreferences,
    photoURL:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80",
    username: "owen",
  },
];

export const demoFriends: UserSummary[] = demoUsers
  .filter((user) => user.id !== demoCurrentUser.id && user.id !== "demo-michael")
  .map((user) => ({
    displayName: String(user.displayName),
    email: user.email,
    id: user.id,
    photoURL: user.photoURL,
    username: user.username,
  }));

export const demoCategories: Category[] = [
  {
    accent: "bg-stone-100 text-stone-800 ring-stone-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-all",
    name: "All recipes",
    slug: "all-recipes",
    sortOrder: 0,
  },
  {
    accent: "bg-rose-100 text-rose-800 ring-rose-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-desserts",
    name: "Desserts",
    slug: "desserts",
    sortOrder: 1,
  },
  {
    accent: "bg-orange-100 text-orange-900 ring-orange-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-indian",
    name: "Indian Food",
    slug: "indian-food",
    sortOrder: 2,
  },
  {
    accent: "bg-red-100 text-red-800 ring-red-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-japanese",
    name: "Japanese Food",
    slug: "japanese-food",
    sortOrder: 3,
  },
  {
    accent: "bg-yellow-100 text-yellow-900 ring-yellow-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-pasta",
    name: "Pasta",
    slug: "pasta",
    sortOrder: 4,
  },
  {
    accent: "bg-lime-100 text-lime-900 ring-lime-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-drinks",
    name: "Drinks",
    slug: "drinks",
    sortOrder: 5,
  },
  {
    accent: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-date-night",
    name: "Date Night",
    slug: "date-night",
    sortOrder: 6,
  },
  {
    accent: "bg-sky-100 text-sky-900 ring-sky-200",
    coverImageUrl:
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=900&q=80",
    description: "",
    id: "demo-breakfast",
    name: "Breakfast",
    slug: "breakfast",
    sortOrder: 7,
  },
];

const sophieSummary = demoFriends.find((friend) => friend.id === "demo-sophie");
const owenSummary = demoFriends.find((friend) => friend.id === "demo-owen");

export const demoRecipes: Recipe[] = [
  {
    aaravRating: 4.5,
    category: "Desserts",
    categoryId: "demo-desserts",
    categoryIds: ["demo-desserts", "demo-indian", "demo-date-night"],
    categories: ["Desserts", "Indian Food", "Date Night"],
    collaboratorIds: sophieSummary ? [sophieSummary.id] : [],
    collaborators: sophieSummary ? [sophieSummary] : [],
    cookTime: "35 min",
    coverImageUrl:
      "https://images.unsplash.com/photo-1605197183305-6c9b7f60f5bd?auto=format&fit=crop&w=900&q=80",
    createdBy: "demo-aarav",
    createdByDisplayName: "Aarav",
    dateAdded: "2026-03-18",
    description: "Cardamom-scented milk powder dumplings in a warm rose syrup.",
    difficulty: "Medium",
    directions: [
      {
        instruction:
          "Mix milk powder, flour, ghee, and milk into a soft dough. Rest for 10 minutes.",
        timerMinutes: 10,
      },
      {
        instruction:
          "Roll into smooth balls, then fry gently until deep golden and evenly cooked.",
      },
      {
        instruction:
          "Simmer sugar, water, cardamom, and rose water into a syrup. Soak the warm jamun.",
        timerMinutes: 30,
      },
    ],
    id: "demo-gulab-jamun",
    ingredients: [
      {
        item: "milk powder",
        quantity: "1",
        unit: "cup",
      },
      {
        item: "all-purpose flour",
        quantity: "3",
        unit: "tbsp",
      },
      {
        item: "ghee",
        quantity: "1",
        unit: "tbsp",
      },
      {
        item: "cardamom pods",
        quantity: "4",
        unit: "",
      },
      {
        item: "rose water",
        note: "optional",
        quantity: "1",
        unit: "tsp",
      },
    ],
    lastMadeDate: "2026-04-04",
    notes: "Sophie likes them slightly smaller so the syrup gets all the way through.",
    prepTime: "25 min",
    ratingCount: 2,
    ratingTotal: 9,
    servings: 6,
    sophieRating: 4.5,
    tags: ["celebration", "sweet", "fried"],
    timesMade: 4,
    title: "Gulab Jamun",
    visibility: "friends",
  },
  {
    aaravRating: 5,
    category: "Pasta",
    categoryId: "demo-pasta",
    categoryIds: ["demo-pasta", "demo-japanese"],
    categories: ["Pasta", "Japanese Food"],
    cookTime: "20 min",
    coverImageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    createdBy: "demo-aarav",
    createdByDisplayName: "Aarav",
    dateAdded: "2026-02-10",
    description: "A glossy pantry pasta with miso, butter, black pepper, and scallions.",
    difficulty: "Easy",
    directions: [
      {
        instruction: "Boil pasta until just shy of al dente. Save a mug of pasta water.",
      },
      {
        instruction:
          "Whisk miso, butter, and pasta water into a sauce, then toss with noodles.",
      },
      {
        instruction: "Finish with scallions, sesame seeds, and a little lemon if needed.",
      },
    ],
    id: "demo-miso-butter-pasta",
    ingredients: [
      {
        item: "spaghetti",
        quantity: "8",
        unit: "oz",
      },
      {
        brand: "Miso Master",
        item: "white miso",
        quantity: "2",
        unit: "tbsp",
      },
      {
        item: "unsalted butter",
        quantity: "3",
        unit: "tbsp",
      },
      {
        item: "scallions",
        quantity: "2",
        unit: "",
      },
    ],
    lastMadeDate: "2026-04-30",
    notes: "Works with udon too.",
    prepTime: "10 min",
    ratingCount: 1,
    ratingTotal: 5,
    servings: 2,
    sophieRating: 4.5,
    tags: ["weeknight", "noodles", "comfort"],
    timesMade: 6,
    title: "Miso Butter Pasta",
    visibility: "private",
  },
  {
    category: "Drinks",
    categoryId: "demo-drinks",
    categoryIds: ["demo-drinks", "demo-indian"],
    categories: ["Drinks", "Indian Food"],
    cookTime: "",
    coverImageUrl:
      "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80",
    createdBy: "demo-aarav",
    createdByDisplayName: "Aarav",
    dateAdded: "2026-05-06",
    description: "Cold mango, yogurt, cardamom, and a little salt.",
    difficulty: "Easy",
    directions: [
      {
        instruction: "Blend mango, yogurt, milk, cardamom, salt, and ice until smooth.",
      },
      {
        instruction: "Taste for sweetness and chill until serving.",
        timerMinutes: 15,
      },
    ],
    id: "demo-mango-lassi",
    ingredients: [
      {
        item: "mango pulp",
        productName: "Kesar mango pulp",
        quantity: "1",
        unit: "cup",
      },
      {
        item: "plain yogurt",
        quantity: "1",
        unit: "cup",
      },
      {
        item: "cardamom",
        quantity: "1",
        unit: "pinch",
      },
    ],
    lastMadeDate: "2026-05-19",
    prepTime: "5 min",
    ratingCount: 2,
    ratingTotal: 9.5,
    servings: 2,
    tags: ["drink", "mango", "cooling"],
    timesMade: 3,
    title: "Mango Lassi",
    visibility: "friends",
  },
  {
    aaravRating: 4,
    category: "Breakfast",
    categoryId: "demo-breakfast",
    categoryIds: ["demo-breakfast"],
    categories: ["Breakfast"],
    cookTime: "15 min",
    coverImageUrl:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
    createdBy: "demo-sophie",
    createdByDisplayName: "Sophie",
    dateAdded: "2026-03-01",
    description: "Soft pancakes with crisp edges and a quick blueberry pan sauce.",
    difficulty: "Easy",
    directions: [
      {
        instruction: "Whisk dry ingredients, then stir in buttermilk and egg.",
      },
      {
        instruction: "Cook on a buttered skillet until bubbles set, then flip.",
      },
      {
        instruction: "Simmer blueberries with maple syrup until glossy.",
        timerMinutes: 6,
      },
    ],
    id: "demo-blueberry-pancakes",
    ingredients: [
      {
        item: "all-purpose flour",
        quantity: "1",
        unit: "cup",
      },
      {
        item: "buttermilk",
        quantity: "1",
        unit: "cup",
      },
      {
        item: "blueberries",
        quantity: "1",
        unit: "handful",
      },
    ],
    lastMadeDate: "2026-04-12",
    prepTime: "10 min",
    ratingCount: 3,
    ratingTotal: 13,
    servings: 3,
    tags: ["breakfast", "sweet"],
    timesMade: 5,
    title: "Blueberry Pancakes",
    visibility: "friends",
  },
  {
    category: "Drinks",
    categoryId: "demo-drinks",
    categoryIds: ["demo-drinks", "demo-date-night"],
    categories: ["Drinks", "Date Night"],
    cookTime: "",
    coverImageUrl:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80",
    createdBy: "demo-owen",
    createdByDisplayName: "Owen",
    dateAdded: "2026-05-01",
    description: "A spicy margarita with jalapeno, lime, agave, and a Tajin rim.",
    difficulty: "Easy",
    directions: [
      {
        instruction: "Shake tequila, lime, agave, orange liqueur, and jalapeno with ice.",
      },
      {
        instruction: "Strain into a Tajin-rimmed glass over fresh ice.",
      },
      {
        instruction: "Top with an optional splash of lemon lime soda.",
      },
    ],
    id: "demo-spicy-margarita",
    ingredients: [
      {
        brand: "Espolon",
        item: "blanco tequila",
        quantity: "2",
        unit: "oz",
      },
      {
        item: "lime juice",
        quantity: "1",
        unit: "oz",
      },
      {
        item: "agave",
        quantity: "0.5",
        unit: "oz",
      },
      {
        item: "lemon lime soda",
        note: "optional",
        quantity: "splash",
        unit: "",
      },
    ],
    lastMadeDate: "2026-05-18",
    prepTime: "8 min",
    ratingCount: 2,
    ratingTotal: 8.5,
    servings: 1,
    tags: ["cocktail", "spicy", "citrus"],
    timesMade: 2,
    title: "Spicy Margarita",
    visibility: "public",
  },
  {
    category: "Japanese Food",
    categoryId: "demo-japanese",
    categoryIds: ["demo-japanese", "demo-date-night"],
    categories: ["Japanese Food", "Date Night"],
    cookTime: "45 min",
    coverImageUrl:
      "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?auto=format&fit=crop&w=900&q=80",
    createdBy: "demo-michael",
    createdByDisplayName: "Michael",
    dateAdded: "2026-02-24",
    description: "Crisp chicken cutlets with curry sauce and rice.",
    difficulty: "Medium",
    directions: [
      {
        instruction: "Bread chicken cutlets and fry until deeply golden.",
      },
      {
        instruction: "Simmer onions, carrots, curry roux, and stock until thick.",
        timerMinutes: 20,
      },
      {
        instruction: "Slice cutlets and serve over rice with curry sauce.",
      },
    ],
    id: "demo-chicken-katsu-curry",
    ingredients: [
      {
        item: "chicken thighs",
        quantity: "1",
        unit: "lb",
      },
      {
        brand: "S&B",
        item: "Japanese curry roux",
        quantity: "2",
        unit: "blocks",
      },
      {
        item: "panko",
        quantity: "1",
        unit: "cup",
      },
    ],
    lastMadeDate: "2026-03-20",
    prepTime: "25 min",
    ratingCount: 5,
    ratingTotal: 22,
    servings: 4,
    tags: ["public", "crispy", "rice"],
    timesMade: 8,
    title: "Chicken Katsu Curry",
    visibility: "public",
  },
];

export const demoCookLogsByRecipe: Record<string, CookLog[]> = {
  "demo-gulab-jamun": [
    {
      aaravRating: 4.5,
      changesNextTime: "Fry one shade darker.",
      cookedBy: "Both",
      createdBy: "demo-aarav",
      createdByDisplayName: "Aarav",
      dateMade: "2026-04-04",
      id: "demo-log-gulab-1",
      notes: "Perfect after dinner. Syrup needed a little extra cardamom.",
      recipeId: "demo-gulab-jamun",
      sophieRating: 4.5,
    },
  ],
  "demo-miso-butter-pasta": [
    {
      cookedBy: "Aarav",
      createdBy: "demo-aarav",
      createdByDisplayName: "Aarav",
      dateMade: "2026-04-30",
      id: "demo-log-pasta-1",
      notes: "Added more black pepper than usual.",
      rating: 5,
      recipeId: "demo-miso-butter-pasta",
    },
  ],
};

export const demoFriendRequests: {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
} = {
  incoming: [
    {
      createdAt: "2026-05-20",
      fromUser: {
        displayName: "Michael",
        email: "michael.demo@miso-hungry.local",
        id: "demo-michael",
        photoURL:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
        username: "michael",
      },
      fromUserId: "demo-michael",
      id: "demo-friend-request-michael",
      status: "pending",
      toUser: {
        displayName: "Aarav",
        email: demoCurrentUser.email,
        id: demoCurrentUser.id,
        photoURL: demoCurrentUser.photoURL,
        username: demoCurrentUser.username,
      },
      toUserId: demoCurrentUser.id,
    },
  ],
  outgoing: [],
};

export const demoCollaborationInvites: {
  incoming: CollaborationInvite[];
  outgoing: CollaborationInvite[];
} = {
  incoming: [
    {
      createdAt: "2026-05-22",
      fromUser: {
        displayName: "Sophie",
        email: "sophie.demo@miso-hungry.local",
        id: "demo-sophie",
        photoURL:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
        username: "sophie",
      },
      fromUserId: "demo-sophie",
      id: "demo-collab-invite-pancakes",
      recipeId: "demo-blueberry-pancakes",
      recipeTitle: "Blueberry Pancakes",
      status: "pending",
      toUser: {
        displayName: "Aarav",
        email: demoCurrentUser.email,
        id: demoCurrentUser.id,
        photoURL: demoCurrentUser.photoURL,
        username: demoCurrentUser.username,
      },
      toUserId: demoCurrentUser.id,
    },
  ],
  outgoing: [],
};

export const demoNotifications: AppNotification[] = [
  {
    actor: sophieSummary,
    actorId: sophieSummary?.id,
    bin: "collaboration",
    body: "Sophie invited you to edit Blueberry Pancakes.",
    createdAt: "2026-05-22T10:00:00.000Z",
    emoji: "🤝",
    href: "/friends",
    id: "demo-notification-collab",
    isRead: false,
    recipeId: "demo-blueberry-pancakes",
    recipientId: demoCurrentUser.id,
    title: "Recipe collaborator invite",
    type: "collaborator_invite_received",
  },
  {
    actor: owenSummary,
    actorId: owenSummary?.id,
    bin: "recipeActivity",
    body: "Owen rated your Mango Lassi 4.5 stars.",
    createdAt: "2026-05-21T18:00:00.000Z",
    emoji: "⭐",
    href: "/recipes/demo-mango-lassi",
    id: "demo-notification-rating",
    isRead: false,
    recipeId: "demo-mango-lassi",
    recipientId: demoCurrentUser.id,
    title: "New rating",
    type: "recipe_rated",
  },
  {
    bin: "reminders",
    body: "Pick one dinner idea before grocery shopping.",
    createdAt: "2026-05-20T12:00:00.000Z",
    emoji: "🛒",
    href: "/grocery-list",
    id: "demo-notification-grocery",
    isRead: true,
    recipientId: demoCurrentUser.id,
    title: "Grocery reminder",
    type: "grocery_list_reminder",
  },
];
