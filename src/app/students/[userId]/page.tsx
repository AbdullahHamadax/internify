import PublicStudentProfilePage from "@/components/shared/PublicStudentProfilePage";

export default async function StudentPublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <PublicStudentProfilePage userId={userId} />;
}
