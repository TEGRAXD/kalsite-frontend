import type { Metadata } from "next";
import { HowToPlayInteractive } from "./HowToPlayInteractive";

export const metadata: Metadata = {
  title: "How to Play",
  description:
    "Interactive guide and playable mini-turn demo for Guess Who Am I on Kal'site.",
  alternates: {
    canonical: "/how-to-play",
  },
};

export default function HowToPlayPage() {
  return <HowToPlayInteractive />;
}
