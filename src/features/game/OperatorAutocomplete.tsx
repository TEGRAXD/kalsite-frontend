"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatOperatorName, type Operator } from "@/lib/types";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";

interface OperatorAutocompleteProps {
  selected: Operator | null;
  onSelect: (operator: Operator | null) => void;
  disabled?: boolean;
  resetSignal?: number;
}

export function OperatorAutocomplete({
  selected,
  onSelect,
  disabled,
  resetSignal,
}: OperatorAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Operator[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetSignal !== undefined && resetSignal > 0) {
      setQuery("");
      setResults([]);
      setOpen(false);
      setActiveIndex(0);
    }
  }, [resetSignal]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || selected) {
      setResults([]);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/operators", {
          params: { search: trimmed, limit: 12 },
        });
        if (!cancelled) {
          setResults(res.data?.data ?? []);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  function handleSelect(op: Operator) {
    onSelect(op);
    setQuery(formatOperatorName(op));
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[activeIndex];
      if (picked) handleSelect(picked);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative flex items-center">
        <Search className="h-4 w-4 absolute left-3 text-[var(--muted-foreground)] pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          value={selected ? formatOperatorName(selected) : query}
          onFocus={() => {
            if (query.trim().length > 0 && !selected) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const nextVal = e.target.value;
            if (selected) onSelect(null);
            setQuery(nextVal);
            setOpen(nextVal.trim().length > 0);
          }}
          placeholder="Type an Operator name to guess..."
          className="w-full h-10 pl-9 pr-9 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
        />
        {(selected || query) && !disabled && (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            aria-label="Clear guess input"
            className="absolute right-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && !disabled && !selected && query.trim().length > 0 && results.length > 0 && (
        <ul className="absolute bottom-full mb-1.5 left-0 right-0 max-h-52 sm:max-h-64 overflow-y-auto border border-[var(--border)] bg-[var(--card)] shadow-2xl z-40 divide-y divide-[var(--border)]">
          {results.map((op, idx) => (
            <li key={op.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(op);
                }}
                className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${idx === activeIndex
                  ? "bg-[var(--primary)]/15"
                  : "hover:bg-[var(--secondary)]"
                  }`}
              >
                <OperatorPortraitBadge operator={op} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">
                      {formatOperatorName(op)}
                    </span>
                    <RarityStars rarity={op.rarity} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ClassBadge operatorClass={op.operatorClass} />
                    <span className="text-[10px] text-[var(--muted-foreground)] truncate">
                      {op.branch} · {op.cnName}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
