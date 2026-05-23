import { RecipeBrowser } from "@/components/RecipeBrowser";

type RecipesPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const { category } = await searchParams;

  return <RecipeBrowser initialCategory={category} />;
}
