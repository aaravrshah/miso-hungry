import { ProfileClient } from "@/components/ProfileClient";

type ProfilePageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  return <ProfileClient userId={userId} />;
}
