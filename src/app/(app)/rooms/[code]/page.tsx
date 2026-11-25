import { redirect } from "next/navigation";

export default async function LegacyRoomDetailRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/guess-who-am-i/${encodeURIComponent(code)}`);
}
