import { redirect } from "next/navigation";

export default async function LegacyLoginPage({
  searchParams
}: {
  searchParams: Promise<{ flow?: string }>;
}) {
  const params = await searchParams;
  redirect(params.flow === "creator" ? "/auth?flow=creator" : "/auth");
}
