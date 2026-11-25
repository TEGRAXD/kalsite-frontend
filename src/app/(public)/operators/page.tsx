import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { fetchPublicOperators } from "@/lib/operators-catalog";
import { OperatorCatalogClient } from "./OperatorCatalogClient";

export const metadata: Metadata = {
  title: "Operator Index",
  description:
    "Browse the searchable Arknights Operator pool available in Kal'site matches, including classes, rarities, and branches.",
  alternates: {
    canonical: "/operators",
  },
};

export default async function OperatorsPage() {
  const operators = await fetchPublicOperators();

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-12 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">
            RHODES ISLAND ARCHIVE
          </p>
          <h1 className="text-3xl font-bold tracking-tight">OPERATOR INDEX</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl">
            Browse all playable Arknights Operators.
          </p>
        </div>

        <Link
          href="/operators/manage"
          className="inline-flex items-center gap-2 h-9 px-4 border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-xs uppercase tracking-wider shrink-0 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[var(--primary)]" />
          SYNC / UPDATE OPS
        </Link>
      </header>

      <OperatorCatalogClient operators={operators} />
    </div>
  );
}
