"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";
import { api } from "@/lib/api";
import { OPERATOR_CLASSES } from "@/lib/constants";
import { formatOperatorName, type Operator } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

type SortMode = "newest" | "oldest" | "name";

export function OperatorCatalogClient({
  operators,
}: {
  operators: Operator[];
}) {
  const { user } = useAuthStore();
  const isAdmin =
    user?.roleId === "administrator" ||
    user?.roleId === "super-administrator";

  const [items, setItems] = useState<Operator[]>(operators);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedRarity, setSelectedRarity] = useState<number | "ALL">("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    setItems(operators);
  }, [operators]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    api
      .get("/operators", { params: { includeDisabled: true } })
      .then((res) => {
        if (!cancelled && Array.isArray(res.data?.data)) {
          setItems(res.data.data as Operator[]);
        }
      })
      .catch(() => {
        // Keep initial SSR items
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const visibleItems = useMemo(
    () => (isAdmin ? items : items.filter((op) => op.isEnabled !== false)),
    [items, isAdmin],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = visibleItems.filter((op) => {
      if (selectedClass !== "ALL" && op.operatorClass !== selectedClass) {
        return false;
      }
      if (selectedRarity !== "ALL" && op.rarity !== selectedRarity) {
        return false;
      }
      if (!q) return true;
      return (
        op.name.toLowerCase().includes(q) ||
        (op.latinName?.toLowerCase().includes(q) ?? false) ||
        op.cnName.toLowerCase().includes(q) ||
        op.slug.toLowerCase().includes(q) ||
        op.branch.toLowerCase().includes(q) ||
        (op.faction?.toLowerCase().includes(q) ?? false) ||
        op.operatorClass.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortMode === "name") {
        return (a.latinName || a.name).localeCompare(b.latinName || b.name);
      }
      const orderA = a.releaseOrder ?? null;
      const orderB = b.releaseOrder ?? null;
      if (orderA !== orderB) {
        if (orderA === null) return 1;
        if (orderB === null) return -1;
        return sortMode === "newest" ? orderB - orderA : orderA - orderB;
      }
      if (a.rarity !== b.rarity) return b.rarity - a.rarity;
      return a.name.localeCompare(b.name);
    });
  }, [visibleItems, search, selectedClass, selectedRarity, sortMode]);

  return (
    <div className="space-y-6">
      <div className="border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, CN name, class, branch, or faction..."
            className="w-full h-10 pl-9 pr-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedClass("ALL")}
            className={`px-2.5 py-1 text-[11px] uppercase border ${selectedClass === "ALL"
              ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            ALL CLASSES
          </button>
          {OPERATOR_CLASSES.map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => setSelectedClass(cls)}
              className={`px-2.5 py-1 text-[11px] uppercase border ${selectedClass === cls
                ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase text-[var(--muted-foreground)] mr-1">
              RARITY:
            </span>
            {(["ALL", 6, 5, 4, 3, 2, 1] as const).map((r) => (
              <button
                key={String(r)}
                type="button"
                onClick={() => setSelectedRarity(r)}
                className={`px-2 py-0.5 text-[11px] border ${selectedRarity === r
                  ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
              >
                {r === "ALL" ? "ALL" : `${r}★`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-[var(--muted-foreground)]">
                SORT:
              </span>
              {(
                [
                  { id: "newest", label: "NEWEST" },
                  { id: "oldest", label: "OLDEST" },
                  { id: "name", label: "A–Z" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortMode(opt.id)}
                  className={`px-2 py-0.5 text-[11px] border ${sortMode === opt.id
                    ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              SHOWING {filtered.length} / {visibleItems.length}
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--card)] p-10 text-center text-xs text-[var(--muted-foreground)]">
          NO OPERATORS MATCH CURRENT FILTERS.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((op) => {
            const isDisabled = op.isEnabled === false;
            return (
              <Link
                key={op.slug}
                href={`/operators/${op.slug}`}
                className={`border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--primary)] transition-all flex items-start gap-3 ${
                  isDisabled
                    ? "opacity-45 grayscale hover:opacity-75 border-dashed"
                    : ""
                }`}
              >
                <OperatorPortraitBadge operator={op} size="md" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-bold leading-snug break-words">
                      {formatOperatorName(op)}
                    </h2>
                    <span className="shrink-0">
                      <RarityStars rarity={op.rarity} />
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                    {op.cnName}
                    {op.faction ? ` · ${op.faction}` : ""}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <ClassBadge operatorClass={op.operatorClass} />
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {op.branch}
                    </span>
                    {isDisabled && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-zinc-500/50 bg-zinc-500/15 text-zinc-400">
                        DISABLED
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
