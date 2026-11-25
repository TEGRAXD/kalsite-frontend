import type { Metadata } from "next";
import {
  fetchIsServerAdmin,
  fetchPublicOperators,
} from "@/lib/operators-catalog";
import { OperatorCatalogClient } from "./OperatorCatalogClient";
import { OperatorSyncButton } from "./OperatorSyncButton";

export const metadata: Metadata = {
  title: "Operator Index",
  description:
    "Browse the searchable Arknights Operator pool available in Kal'site matches, including classes, rarities, and branches.",
  alternates: {
    canonical: "/operators",
  },
};

export default async function OperatorsPage() {
  const isAdmin = await fetchIsServerAdmin();
  const operators = await fetchPublicOperators({ includeDisabled: isAdmin });

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

        <OperatorSyncButton />
      </header>

      <OperatorCatalogClient operators={operators} />
    </div>
  );
}
