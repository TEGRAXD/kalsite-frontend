import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchIsServerAdmin,
  fetchPublicOperatorBySlug,
} from "@/lib/operators-catalog";
import { formatOperatorName } from "@/lib/types";
import { OperatorDetailClient } from "./OperatorDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const isAdmin = await fetchIsServerAdmin();
  const op = await fetchPublicOperatorBySlug(slug, {
    includeDisabled: isAdmin,
  });
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
  const isAdmin = await fetchIsServerAdmin();
  const op = await fetchPublicOperatorBySlug(slug, {
    includeDisabled: isAdmin,
  });

  if (!op) {
    notFound();
  }

  return <OperatorDetailClient initialOperator={op} />;
}
