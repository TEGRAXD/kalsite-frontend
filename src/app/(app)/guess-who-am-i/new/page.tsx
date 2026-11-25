import type { Metadata } from "next";
import { CreateRoomForm } from "@/features/rooms/CreateRoomForm";

export const metadata: Metadata = {
  title: "Create Room — Guess Who Am I",
};

export default function NewGuessWhoAmIRoomPage() {
  return <CreateRoomForm />;
}
