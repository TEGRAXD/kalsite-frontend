"use client";

import { useState } from "react";
import { resolveAssetUrl } from "@/lib/constants";
import type { PublicOperatorCard } from "@/lib/types";

const CLASS_COLORS: Record<string, string> = {
  Vanguard: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  Guard: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  Defender: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  Sniper: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  Caster: "text-violet-400 border-violet-500/40 bg-violet-500/10",
  Medic: "text-teal-400 border-teal-500/40 bg-teal-500/10",
  Supporter: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
  Specialist: "text-orange-400 border-orange-500/40 bg-orange-500/10",
};

const RARITY_ACCENT: Record<number, string> = {
  6: "text-orange-500",
  5: "text-yellow-300",
  4: "text-violet-400",
  3: "text-sky-400",
  2: "text-lime-400",
  1: "text-zinc-400",
};

export function OperatorPortraitBadge({
  operator,
  size = "md",
}: {
  operator: Pick<PublicOperatorCard, "name" | "operatorClass" | "rarity"> & {
    imageUrl?: string | null;
  };
  size?: "sm" | "md" | "lg";
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = operator.name
    .split(/[\s'"]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

  const colorClass =
    CLASS_COLORS[operator.operatorClass] ||
    "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";

  const dims =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "lg"
        ? "h-16 w-16 text-xl"
        : "h-11 w-11 text-sm";

  const resolvedUrl = resolveAssetUrl(operator.imageUrl);
  const hasValidImage =
    Boolean(resolvedUrl) &&
    (/^\/uploads\//i.test(resolvedUrl || "") ||
      /^https?:\/\//i.test(resolvedUrl || "")) &&
    !imgFailed;

  if (hasValidImage) {
    return (
      <div
        className={`shrink-0 border overflow-hidden bg-[var(--background)] ${colorClass} ${dims}`}
      >
        <img
          src={resolvedUrl!}
          alt={operator.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 border flex flex-col items-center justify-center font-bold tracking-wider select-none ${colorClass} ${dims}`}
    >
      <span>{initials}</span>
      {size !== "sm" && (
        <span className="text-[8px] uppercase opacity-80 leading-none mt-0.5">
          {operator.operatorClass.slice(0, 3)}
        </span>
      )}
    </div>
  );
}

export function RarityStars({ rarity }: { rarity: number }) {
  const color = RARITY_ACCENT[rarity] || "text-[var(--muted-foreground)]";
  return (
    <span
      className={`text-[11px] tracking-widest ${color}`}
      aria-label={`${rarity} star`}
    >
      {"★".repeat(Math.max(1, Math.min(6, rarity)))}
    </span>
  );
}

export function ClassBadge({ operatorClass }: { operatorClass: string }) {
  const color =
    CLASS_COLORS[operatorClass] ||
    "text-[var(--foreground)] border-[var(--border)] bg-[var(--secondary)]";
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider border ${color}`}
    >
      {operatorClass}
    </span>
  );
}
