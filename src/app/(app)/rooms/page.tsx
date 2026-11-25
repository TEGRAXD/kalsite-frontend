import { redirect } from "next/navigation";

export default function LegacyRoomsRedirectPage() {
  redirect("/guess-who-am-i");
}
