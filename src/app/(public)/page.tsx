import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: {
    absolute: "KAL'SITE",
  },
  description: "Arknights hub for games, records, and tools.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <section className="relative flex-1 flex items-center justify-center tactical-grid overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_60%)]"
        />

        <div className="relative max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <div className="h-20 w-20 border border-[var(--primary)]/60 bg-[var(--card)] p-1">
            <img
              src="/kaltsit-e1.png"
              alt="Kal'tsit"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[0.1em]">
              KAL&apos;<span className="text-[var(--primary)]">SITE</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Arknights hub for games, records, and tools.
            </p>
          </div>

          <Link
            href="/games"
            className="inline-flex items-center gap-2 h-11 px-7 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-xs uppercase tracking-[0.18em] border border-[var(--primary)] hover:opacity-90 transition-opacity"
          >
            GAMES
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-5 px-4 text-[11px] text-[var(--muted-foreground)] text-center">
        Unofficial Arknights fan site. Characters belong to Hypergryph / Yostar
        / Gryphline.
      </footer>
    </div>
  );
}
