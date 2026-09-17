import { redirect } from "next/navigation";

export default async function LegacyRegisterPage({
  searchParams
}: {
  searchParams: Promise<{ flow?: string }>;
}) {
  const params = await searchParams;
  redirect(params.flow === "creator" ? "/auth?flow=creator" : "/auth");
}
