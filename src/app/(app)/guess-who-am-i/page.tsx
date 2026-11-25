import type { Metadata } from "next";
import { RoomBrowser } from "@/features/rooms/RoomBrowser";

export const metadata: Metadata = {
  title: "Guess Who Am I",
};

export default function GuessWhoAmIPage() {
  return <RoomBrowser />;
}
