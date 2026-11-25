"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { OPERATOR_CLASSES } from "@/lib/constants";
import type { Operator } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { Button } from "@/components/Button";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";

interface SyncSummary {
  source: string;
  totalFetched: number;
  inserted: number;
  updated: number;
  imagesDownloaded: number;
  imagesSkipped: number;
  imagesFailed: number;
  durationMs: number;
}

export function OperatorSyncManager() {
  const router = useRouter();
  const { user, initialized, fetchUser } = useAuthStore();
  const { pushToast } = useUiStore();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [forceRedownloadImages, setForceRedownloadImages] = useState(false);
  const [lastSync, setLastSync] = useState<SyncSummary | null>(null);

  // Collapsible manual input form (optional fallback)
  const [showManualForm, setShowManualForm] = useState(false);
  const [name, setName] = useState("");
  const [cnName, setCnName] = useState("");
  const [slug, setSlug] = useState("");
  const [rarity, setRarity] = useState(6);
  const [operatorClass, setOperatorClass] = useState<string>("Guard");
  const [branch, setBranch] = useState("Lord");
  const [sourceImageUrl, setSourceImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!initialized) void fetchUser();
  }, [initialized, fetchUser]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
    }
  }, [initialized, user, router]);

  async function loadOperators() {
    setLoadingList(true);
    try {
      const res = await api.get("/operators");
      setOperators((res.data?.data as Operator[]) ?? []);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to load operators",
        description: getErrorMessage(err),
      });
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (user) {
      void loadOperators();
    }
  }, [user]);

  async function handleGitHubSync() {
    setSyncing(true);
    try {
      const res = await api.post("/operators/sync", {
        forceRedownloadImages,
      });
      const summary = res.data?.data as SyncSummary;
      setLastSync(summary);
      pushToast({
        tone: "success",
        title: "Operator database refreshed",
        description: `${summary.totalFetched} ops synced (${summary.inserted} new, ${summary.imagesDownloaded} avatars downloaded).`,
      });
      await loadOperators();
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Sync failed",
        description: getErrorMessage(err),
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingManual(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("cnName", cnName.trim());
      if (slug.trim()) formData.append("slug", slug.trim());
      formData.append("rarity", String(rarity));
      formData.append("operatorClass", operatorClass);
      formData.append("branch", branch.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (sourceImageUrl.trim()) {
        formData.append("sourceImageUrl", sourceImageUrl.trim());
      }

      await api.post("/operators", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      pushToast({
        tone: "success",
        title: "Operator added",
        description: `${name.trim()} has been added to the database.`,
      });
      setName("");
      setCnName("");
      setSlug("");
      setSourceImageUrl("");
      setImageFile(null);
      await loadOperators();
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to add operator",
        description: getErrorMessage(err),
      });
    } finally {
      setSubmittingManual(false);
    }
  }

  async function handleDelete(op: Operator) {
    try {
      await api.delete(`/operators/${encodeURIComponent(op.id)}`);
      pushToast({
        tone: "info",
        title: "Operator removed",
        description: `${op.name} was removed/disabled from the pool.`,
      });
      await loadOperators();
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to remove operator",
        description: getErrorMessage(err),
      });
    }
  }

  const filtered = operators.filter((op) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      op.name.toLowerCase().includes(q) ||
      op.cnName.toLowerCase().includes(q) ||
      op.slug.toLowerCase().includes(q) ||
      op.branch.toLowerCase().includes(q) ||
      op.operatorClass.toLowerCase().includes(q)
    );
  });

  if (!initialized || !user) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 py-12 text-xs text-[var(--muted-foreground)]">
        VERIFYING SESSION...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-10 space-y-6">
      <Link
        href="/operators"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        BACK TO OPERATOR INDEX
      </Link>

      {/* GITHUB SYNC PANEL */}
      <section className="border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--primary)] flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              OPERATOR SYNC MODULE
            </p>
            <h1 className="text-xl font-bold tracking-wider">
              UPDATE OPERATORS &amp; LOCAL ASSETS
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Pulls latest{" "}
              <code className="text-[var(--foreground)]">
                character_table.json
              </code>{" "}
              from <code className="text-[var(--foreground)]">fexli/ArknightsResource</code>, downloads operator avatars directly onto our server (
              <code className="text-[var(--foreground)]">/uploads/operators/</code>
              ), and refreshes PostgreSQL.
            </p>
          </div>

          <Button
            size="lg"
            disabled={syncing}
            onClick={handleGitHubSync}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "SYNCING ASSETS..." : "SYNC FROM GITHUB"}
          </Button>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <input
            type="checkbox"
            checked={forceRedownloadImages}
            onChange={(e) => setForceRedownloadImages(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            Re-download all existing avatar PNGs (leave unchecked to only
            download new/missing avatars)
          </span>
        </label>

        {lastSync && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[
              { label: "TOTAL SYNCED", value: String(lastSync.totalFetched) },
              { label: "NEW OPS", value: `+${lastSync.inserted}` },
              { label: "UPDATED", value: String(lastSync.updated) },
              {
                label: "IMAGES SAVED",
                value: `${lastSync.imagesDownloaded} new / ${lastSync.imagesSkipped} cached`,
              },
              {
                label: "DURATION",
                value: `${(lastSync.durationMs / 1000).toFixed(1)}s`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  {stat.label}
                </p>
                <p className="text-xs font-bold text-[var(--primary)] mt-1">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* OPTIONAL MANUAL ADD FORM */}
      <section className="border border-[var(--border)] bg-[var(--card)]">
        <button
          type="button"
          onClick={() => setShowManualForm((v) => !v)}
          className="w-full px-6 py-4 flex items-center justify-between text-xs uppercase tracking-wider hover:bg-[var(--secondary)]/50 transition-colors"
        >
          <span className="font-bold flex items-center gap-2">
            <Plus className="h-4 w-4 text-[var(--primary)]" />
            MANUAL OPERATOR INPUT (OPTIONAL)
          </span>
          {showManualForm ? (
            <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          )}
        </button>

        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="p-6 border-t border-[var(--border)] space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  NAME (EN) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amiya"
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  CN NAME *
                </label>
                <input
                  type="text"
                  required
                  value={cnName}
                  onChange={(e) => setCnName(e.target.value)}
                  placeholder="e.g. 阿米娅"
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  SLUG (OPTIONAL — AUTO-GENERATED)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. amiya"
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  RARITY *
                </label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                >
                  {[6, 5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r}★
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  CLASS *
                </label>
                <select
                  value={operatorClass}
                  onChange={(e) => setOperatorClass(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                >
                  {OPERATOR_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  BRANCH *
                </label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Core Caster"
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  UPLOAD AVATAR IMAGE (SAVED LOCALLY)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full h-10 px-3 py-2 bg-[var(--input)] border border-[var(--border)] text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-[var(--muted-foreground)]">
                  OR DOWNLOAD IMAGE FROM URL
                </label>
                <input
                  type="url"
                  value={sourceImageUrl}
                  onChange={(e) => setSourceImageUrl(e.target.value)}
                  placeholder="https://... (downloaded to our server)"
                  className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submittingManual}>
                <Download className="h-3.5 w-3.5" />
                {submittingManual ? "SAVING..." : "SAVE OPERATOR"}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* DATABASE OVERVIEW */}
      <section className="border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            DATABASE POOL ({operators.length} OPERATORS)
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter table..."
            className="h-9 w-full sm:w-64 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {loadingList ? (
          <p className="text-xs text-[var(--muted-foreground)] py-4">
            LOADING OPERATORS...
          </p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)]">
            {filtered.slice(0, 100).map((op) => (
              <div
                key={op.id}
                className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[var(--secondary)]/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <OperatorPortraitBadge operator={op} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold truncate">{op.name}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {op.cnName}
                      </span>
                      <RarityStars rarity={op.rarity} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <ClassBadge operatorClass={op.operatorClass} />
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {op.branch} · {op.slug}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(op)}
                  title="Remove/disable operator"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                </Button>
              </div>
            ))}
            {filtered.length > 100 && (
              <p className="px-3 py-2 text-[11px] text-[var(--muted-foreground)] text-center">
                Showing first 100 of {filtered.length} matching operators. Use
                search to narrow down.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
