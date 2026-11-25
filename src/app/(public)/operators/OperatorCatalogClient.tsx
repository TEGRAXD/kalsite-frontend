"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
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
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedRarity, setSelectedRarity] = useState<string>("ALL");
  const [selectedGender, setSelectedGender] = useState<string>("ALL");
  const [selectedRace, setSelectedRace] = useState<string>("ALL");
  const [selectedFaction, setSelectedFaction] = useState<string>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Dynamic filter options derived from available operators
  const branchOptions = useMemo(() => {
    const set = new Set<string>();
    for (const op of visibleItems) {
      if (selectedClass !== "ALL" && op.operatorClass !== selectedClass) {
        continue;
      }
      if (op.branch) set.add(op.branch);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleItems, selectedClass]);

  const genderOptions = useMemo(() => {
    const set = new Set<string>();
    for (const op of visibleItems) {
      if (op.gender) set.add(op.gender);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleItems]);

  const raceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const op of visibleItems) {
      if (op.race) set.add(op.race);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleItems]);

  const factionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const op of visibleItems) {
      if (op.faction) set.add(op.faction);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleItems]);

  // Reset branch if changing class invalidates the currently selected branch
  useEffect(() => {
    if (selectedBranch !== "ALL" && !branchOptions.includes(selectedBranch)) {
      setSelectedBranch("ALL");
    }
  }, [branchOptions, selectedBranch]);

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (selectedClass !== "ALL") {
      chips.push({
        key: "class",
        label: `Class: ${selectedClass}`,
        clear: () => setSelectedClass("ALL"),
      });
    }
    if (selectedBranch !== "ALL") {
      chips.push({
        key: "branch",
        label: `Subclass: ${selectedBranch}`,
        clear: () => setSelectedBranch("ALL"),
      });
    }
    if (selectedRarity !== "ALL") {
      chips.push({
        key: "rarity",
        label: `${selectedRarity}★`,
        clear: () => setSelectedRarity("ALL"),
      });
    }
    if (selectedGender !== "ALL") {
      chips.push({
        key: "gender",
        label: `Gender: ${selectedGender}`,
        clear: () => setSelectedGender("ALL"),
      });
    }
    if (selectedRace !== "ALL") {
      chips.push({
        key: "race",
        label: `Race: ${selectedRace}`,
        clear: () => setSelectedRace("ALL"),
      });
    }
    if (selectedFaction !== "ALL") {
      chips.push({
        key: "faction",
        label: `Faction: ${selectedFaction}`,
        clear: () => setSelectedFaction("ALL"),
      });
    }
    return chips;
  }, [
    selectedClass,
    selectedBranch,
    selectedRarity,
    selectedGender,
    selectedRace,
    selectedFaction,
  ]);

  function resetFilters() {
    setSelectedClass("ALL");
    setSelectedBranch("ALL");
    setSelectedRarity("ALL");
    setSelectedGender("ALL");
    setSelectedRace("ALL");
    setSelectedFaction("ALL");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rarityNum =
      selectedRarity === "ALL" ? null : Number.parseInt(selectedRarity, 10);

    const list = visibleItems.filter((op) => {
      if (selectedClass !== "ALL" && op.operatorClass !== selectedClass) {
        return false;
      }
      if (selectedBranch !== "ALL" && op.branch !== selectedBranch) {
        return false;
      }
      if (rarityNum !== null && op.rarity !== rarityNum) {
        return false;
      }
      if (selectedGender !== "ALL" && op.gender !== selectedGender) {
        return false;
      }
      if (selectedRace !== "ALL" && op.race !== selectedRace) {
        return false;
      }
      if (selectedFaction !== "ALL" && op.faction !== selectedFaction) {
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
        (op.gender?.toLowerCase().includes(q) ?? false) ||
        (op.race?.toLowerCase().includes(q) ?? false) ||
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
  }, [
    visibleItems,
    search,
    selectedClass,
    selectedBranch,
    selectedRarity,
    selectedGender,
    selectedRace,
    selectedFaction,
    sortMode,
  ]);

  return (
    <div className="space-y-4">
      {/* COMPACT TOOLBAR + COLLAPSIBLE FILTERS */}
      <div className="border border-[var(--border)] bg-[var(--card)] p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, CN, class, subclass, race, faction..."
              className="w-full h-9 pl-8 pr-8 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={`h-9 px-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider border transition-colors ${
                filtersOpen || activeFilters.length > 0
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] hover:border-[var(--primary)]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                FILTERS
                {activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  filtersOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <select
              aria-label="Sort operators"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 px-2.5 bg-[var(--input)] border border-[var(--border)] text-[11px] uppercase focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name">Sort: A–Z</option>
            </select>

            <span className="hidden md:inline text-[11px] text-[var(--muted-foreground)] tabular-nums pl-1">
              {filtered.length} / {visibleItems.length}
            </span>
          </div>
        </div>

        {/* EXPANDABLE FILTER DROPDOWNS */}
        {filtersOpen && (
          <div className="pt-2.5 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <select
              aria-label="Filter by class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-8 px-2 bg-[var(--input)] border border-[var(--border)] text-[11px] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Classes</option>
              {OPERATOR_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by subclass"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-8 px-2 bg-[var(--input)] border border-[var(--border)] text-[11px] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Subclasses</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by rarity"
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="h-8 px-2 bg-[var(--input)] border border-[var(--border)] text-[11px] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Rarities</option>
              {[6, 5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={String(r)}>
                  {r}★
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by gender"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="h-8 px-2 bg-[var(--input)] border border-[var(--border)] text-[11px] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Genders</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by race"
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              className="h-8 px-2 bg-[var(--input)] border border-[var(--border)] text-[11px] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Races</option>
              {raceOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by faction"
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="h-8 px-2 bg-[var(--input)] border border-[var(--border)] text-[11px] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Factions</option>
              {factionOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ACTIVE FILTER CHIPS + MOBILE COUNT */}
        {(activeFilters.length > 0 || filtersOpen) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] hover:bg-[var(--primary)]/20"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] px-1"
                >
                  Clear all
                </button>
              )}
            </div>
            <span className="md:hidden text-[10px] text-[var(--muted-foreground)] tabular-nums">
              SHOWING {filtered.length} / {visibleItems.length}
            </span>
          </div>
        )}
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
