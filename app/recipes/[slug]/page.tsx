import { RecipeDetailClient } from "@/components/RecipeDetailClient";

type RecipeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;

  return <RecipeDetailClient recipeId={slug} />;
}
