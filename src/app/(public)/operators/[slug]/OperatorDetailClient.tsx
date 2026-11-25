"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/Button";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";
import { api, getErrorMessage } from "@/lib/api";
import { OPERATOR_CLASSES, resolveAssetUrl } from "@/lib/constants";
import { formatOperatorName, type Operator } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";

export function OperatorDetailClient({
  initialOperator,
}: {
  initialOperator: Operator;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { pushToast } = useUiStore();

  const isAdmin =
    user?.roleId === "administrator" ||
    user?.roleId === "super-administrator";

  const [op, setOp] = useState<Operator>(initialOperator);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Form state
  const [name, setName] = useState(op.name);
  const [latinName, setLatinName] = useState(op.latinName ?? "");
  const [cnName, setCnName] = useState(op.cnName);
  const [slug, setSlug] = useState(op.slug);
  const [rarity, setRarity] = useState(op.rarity);
  const [operatorClass, setOperatorClass] = useState(op.operatorClass);
  const [branch, setBranch] = useState(op.branch);
  const [faction, setFaction] = useState(op.faction ?? "");
  const [releaseOrder, setReleaseOrder] = useState(
    op.releaseOrder !== null && op.releaseOrder !== undefined
      ? String(op.releaseOrder)
      : "",
  );
  const [isEnabled, setIsEnabled] = useState(op.isEnabled !== false);
  const [sourceImageUrl, setSourceImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openEditor() {
    setName(op.name);
    setLatinName(op.latinName ?? "");
    setCnName(op.cnName);
    setSlug(op.slug);
    setRarity(op.rarity);
    setOperatorClass(op.operatorClass);
    setBranch(op.branch);
    setFaction(op.faction ?? "");
    setReleaseOrder(
      op.releaseOrder !== null && op.releaseOrder !== undefined
        ? String(op.releaseOrder)
        : "",
    );
    setIsEnabled(op.isEnabled !== false);
    setSourceImageUrl("");
    setImageFile(null);
    setFormError(null);
    setEditing(true);
  }

  async function handleQuickStatusChange(nextEnabled: boolean) {
    if (nextEnabled === (op.isEnabled !== false)) return;
    setTogglingStatus(true);
    try {
      const res = await api.patch(`/operators/${encodeURIComponent(op.id)}`, {
        isEnabled: nextEnabled,
      });
      const updated = res.data?.data as Operator;
      if (updated) {
        setOp(updated);
        setIsEnabled(updated.isEnabled !== false);
      }
      pushToast({
        tone: "success",
        title: nextEnabled ? "Operator enabled" : "Operator disabled",
        description: nextEnabled
          ? `${op.name} is now visible to all users and eligible in matches.`
          : `${op.name} is now hidden from normal users and excluded from matches.`,
      });
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to update status",
        description: getErrorMessage(err),
      });
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !cnName.trim() || !branch.trim()) {
      setFormError("Name, CN Name, and Branch are required.");
      return;
    }

    setSaving(true);
    try {
      let res;
      if (imageFile) {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("latinName", latinName.trim());
        formData.append("cnName", cnName.trim());
        if (slug.trim()) formData.append("slug", slug.trim());
        formData.append("rarity", String(rarity));
        formData.append("operatorClass", operatorClass);
        formData.append("branch", branch.trim());
        formData.append("faction", faction.trim());
        formData.append("releaseOrder", releaseOrder.trim());
        formData.append("isEnabled", String(isEnabled));
        formData.append("image", imageFile);

        res = await api.patch(
          `/operators/${encodeURIComponent(op.id)}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      } else {
        res = await api.patch(`/operators/${encodeURIComponent(op.id)}`, {
          name: name.trim(),
          latinName: latinName.trim() || null,
          cnName: cnName.trim(),
          slug: slug.trim() || undefined,
          rarity,
          operatorClass,
          branch: branch.trim(),
          faction: faction.trim() || null,
          releaseOrder: releaseOrder.trim() === "" ? null : Number(releaseOrder),
          isEnabled,
          sourceImageUrl: sourceImageUrl.trim() || undefined,
        });
      }

      const updated = res.data?.data as Operator;
      if (updated) {
        const slugChanged = updated.slug !== op.slug;
        setOp(updated);
        setEditing(false);
        pushToast({
          tone: "success",
          title: "Operator updated",
          description: `${formatOperatorName(updated)} changes saved.`,
        });
        if (slugChanged) {
          router.replace(`/operators/${updated.slug}`);
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to update operator");
      setFormError(msg);
      pushToast({
        tone: "error",
        title: "Update failed",
        description: msg,
      });
    } finally {
      setSaving(false);
    }
  }

  const isDisabled = op.isEnabled === false;

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-12 space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/operators"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO OPERATOR INDEX
        </Link>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Operator visibility status"
              value={isDisabled ? "disabled" : "enabled"}
              disabled={togglingStatus || saving}
              onChange={(e) =>
                void handleQuickStatusChange(e.target.value === "enabled")
              }
              className="h-8 px-2.5 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
            >
              <option value="enabled">Status: Enabled</option>
              <option value="disabled">Status: Disabled</option>
            </select>

            {editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X className="h-3.5 w-3.5" />
                CANCEL
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={openEditor}>
                <Pencil className="h-3.5 w-3.5" />
                EDIT OPERATOR
              </Button>
            )}
          </div>
        )}
      </div>

      <article
        className={`relative overflow-hidden border border-[var(--border)] bg-[var(--card)] p-4 sm:p-8 space-y-6 transition-all ${
          isDisabled ? "border-dashed opacity-70" : ""
        }`}
      >
        <div className="relative flex items-start sm:items-center justify-between gap-4 sm:gap-5 border-b border-[var(--border)] pb-5 sm:pb-6">
          <div
            className={`flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0 pr-16 sm:pr-0 ${
              isDisabled ? "grayscale" : ""
            }`}
          >
            <OperatorPortraitBadge operator={op} size="lg" />
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold leading-snug break-words">
                  {formatOperatorName(op)}
                </h1>
                <RarityStars rarity={op.rarity} />
                {isDisabled && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-zinc-500/50 bg-zinc-500/15 text-zinc-400">
                    DISABLED
                  </span>
                )}
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

      {isAdmin && editing && (
        <form
          onSubmit={handleSave}
          noValidate
          className="border border-[var(--primary)]/50 bg-[var(--card)] p-4 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                EDIT OPERATOR DETAILS
              </h2>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                ID: {op.id}
              </p>
            </div>
          </div>

          {formError && (
            <div className="border border-rose-500/50 bg-rose-500/10 p-3 text-xs text-rose-400">
              {formError}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                NAME *
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                LATIN NAME (OPTIONAL)
              </span>
              <input
                type="text"
                value={latinName}
                onChange={(e) => setLatinName(e.target.value)}
                maxLength={100}
                placeholder="e.g. Toska"
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                CN NAME *
              </span>
              <input
                type="text"
                value={cnName}
                onChange={(e) => setCnName(e.target.value)}
                maxLength={100}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                CLASS *
              </span>
              <select
                value={operatorClass}
                onChange={(e) => setOperatorClass(e.target.value)}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              >
                {OPERATOR_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                BRANCH *
              </span>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                maxLength={60}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                RARITY *
              </span>
              <select
                value={rarity}
                onChange={(e) => setRarity(Number(e.target.value))}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              >
                {[6, 5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r}★
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                FACTION (OPTIONAL)
              </span>
              <input
                type="text"
                value={faction}
                onChange={(e) => setFaction(e.target.value)}
                maxLength={80}
                placeholder="e.g. Rhodes Island"
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                SLUG
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                maxLength={100}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                STATUS
              </span>
              <select
                value={isEnabled ? "enabled" : "disabled"}
                onChange={(e) => setIsEnabled(e.target.value === "enabled")}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="enabled">Enabled (Visible to all)</option>
                <option value="disabled">Disabled (Hidden from users)</option>
              </select>
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                RELEASE ORDER (OPTIONAL)
              </span>
              <input
                type="number"
                value={releaseOrder}
                onChange={(e) => setReleaseOrder(e.target.value)}
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                REPLACE IMAGE URL (OPTIONAL)
              </span>
              <input
                type="text"
                value={sourceImageUrl}
                onChange={(e) => setSourceImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                OR UPLOAD IMAGE FILE
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full h-9 px-2 py-1.5 bg-[var(--input)] border border-[var(--border)] text-xs file:mr-2 file:border-0 file:bg-[var(--secondary)] file:px-2 file:py-0.5 file:text-[10px] file:text-[var(--foreground)]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              CANCEL
            </Button>
            <Button type="submit" size="md" disabled={saving}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
