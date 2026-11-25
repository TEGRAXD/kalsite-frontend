import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  EyeOff,
  Lock,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Games",
  description: "Play Arknights web games on Kal'site.",
  alternates: {
    canonical: "/games",
  },
};

export default function GamesPage() {
  return (
    <div className="flex-1 flex flex-col tactical-grid">
      <div className="max-w-6xl mx-auto w-full px-4 py-12 space-y-8">
        <header className="border-b border-[var(--border)] pb-5 space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">GAMES</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Choose a game to play.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* GUESS WHO AM I */}
          <article className="border border-[var(--primary)]/60 bg-[var(--card)] flex flex-col justify-between shadow-xl">
            <div className="p-5 space-y-4">
              {/* MINI VISUAL HEADER */}
              <div className="border border-[var(--border)] bg-[var(--background)] p-3.5 flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 border border-dashed border-[var(--primary)]/50 bg-[var(--primary)]/5 flex flex-col items-center justify-center">
                  <EyeOff className="h-4 w-4 text-[var(--primary)]" />
                  <span className="block text-[9px] font-bold tracking-[0.2em] text-[var(--primary)] mt-0.5">
                    ???
                  </span>
                </div>
                <h2 className="text-base font-bold tracking-wider truncate">
                  GUESS WHO AM I
                </h2>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Everyone sees your Operator except you. Ask yes/no questions,
                read clues in chat, and guess who you are before your lives run
                out.
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--border)] bg-[var(--background)]">
                  <Users className="h-3 w-3 text-[var(--primary)]" />
                  2–10 PLAYERS
                </span>
                <span className="px-2 py-0.5 border border-[var(--border)] bg-[var(--background)]">
                  TEXT CHAT
                </span>
                <span className="px-2 py-0.5 border border-[var(--border)] bg-[var(--background)]">
                  ROOMS
                </span>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-3">
              <Link
                href="/guess-who-am-i"
                className="w-full h-10 px-4 inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-xs uppercase tracking-[0.18em] border border-[var(--primary)] hover:opacity-90 transition-opacity"
              >
                PLAY NOW
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <Link
                  href="/how-to-play"
                  className="inline-flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  HOW TO PLAY
                </Link>
                <Link
                  href="/operators"
                  className="inline-flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                >
                  <Database className="h-3 w-3" />
                  OPERATORS
                </Link>
              </div>
            </div>
          </article>

          {/* SINGLE UPCOMING CARD */}
          <article className="border border-dashed border-[var(--border)] bg-[var(--card)]/60 p-5 flex flex-col justify-between gap-6 opacity-75">
            <div className="space-y-4">
              <div className="border border-dashed border-[var(--border)] bg-[var(--background)]/60 py-10 px-4 text-center space-y-2">
                <Lock className="h-5 w-5 mx-auto text-[var(--muted-foreground)]" />
                <p className="text-xs font-bold tracking-[0.2em] text-[var(--muted-foreground)]">
                  MORE GAMES
                </p>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                More Arknights browser games will be added here later.
              </p>
            </div>

            <div className="h-10 px-4 border border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--muted-foreground)] text-xs uppercase tracking-[0.18em] flex items-center justify-center select-none">
              COMING SOON
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
