import { redirect } from "next/navigation";

export default function LegacyNewRoomRedirectPage() {
  redirect("/guess-who-am-i/new");
}
