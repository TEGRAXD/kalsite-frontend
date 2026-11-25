import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";
import { resolveAssetUrl } from "@/lib/constants";
import { fetchPublicOperatorBySlug } from "@/lib/operators-catalog";
import { formatOperatorName } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const op = await fetchPublicOperatorBySlug(slug);
  if (!op) {
    return { title: "Operator Not Found" };
  }
  const displayName = formatOperatorName(op);
  return {
    title: `${displayName} (${op.rarity}★ ${op.operatorClass})`,
    description: `${displayName} (${op.cnName}) — ${op.rarity}★ ${op.operatorClass} (${op.branch}) in Kal'site.`,
    alternates: {
      canonical: `/operators/${op.slug}`,
    },
  };
}

export default async function OperatorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const op = await fetchPublicOperatorBySlug(slug);

  if (!op) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-12 space-y-6 sm:space-y-8">
      <Link
        href="/operators"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        BACK TO OPERATOR INDEX
      </Link>

      <article className="relative overflow-hidden border border-[var(--border)] bg-[var(--card)] p-4 sm:p-8 space-y-6">
        <div className="relative flex items-start sm:items-center justify-between gap-4 sm:gap-5 border-b border-[var(--border)] pb-5 sm:pb-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0 pr-16 sm:pr-0">
            <OperatorPortraitBadge operator={op} size="lg" />
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold leading-snug break-words">
                  {formatOperatorName(op)}
                </h1>
                <RarityStars rarity={op.rarity} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                CN:{" "}
                <strong className="text-[var(--foreground)]">
                  {op.cnName}
                </strong>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <ClassBadge operatorClass={op.operatorClass} />
                <span className="text-xs px-2 py-0.5 border border-[var(--border)] bg-[var(--secondary)]">
                  {op.branch}
                </span>
              </div>
            </div>
          </div>

          {op.factionLogoUrl && (
            <div
              className="absolute right-0 top-0 sm:static flex items-center justify-center shrink-0 select-none"
              title={op.faction || undefined}
            >
              <img
                src={resolveAssetUrl(op.factionLogoUrl) ?? ""}
                alt={op.faction || "Faction"}
                className="h-14 w-14 sm:h-28 sm:w-28 object-contain invert dark:invert-0"
              />
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { label: "CLASS", value: op.operatorClass },
            { label: "BRANCH", value: op.branch },
            { label: "RARITY", value: `${op.rarity}★` },
            { label: "CN NAME", value: op.cnName },
          ].map((attr) => (
            <div
              key={attr.label}
              className="border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <dt className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                {attr.label}
              </dt>
              <dd className="text-xs font-semibold mt-1">{attr.value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </div>
  );
}
