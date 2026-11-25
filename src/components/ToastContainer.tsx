"use client";

import { X, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";

export function ToastContainer() {
  const { toasts, dismissToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const toneStyles =
          toast.tone === "error"
            ? "border-red-500/60 bg-[var(--card)] text-red-400"
            : toast.tone === "success"
              ? "border-emerald-500/60 bg-[var(--card)] text-emerald-400"
              : toast.tone === "warning"
                ? "border-amber-500/60 bg-[var(--card)] text-amber-400"
                : "border-[var(--primary)]/60 bg-[var(--card)] text-[var(--primary)]";

        return (
          <div
            key={toast.id}
            className={`border p-3 shadow-xl flex items-start gap-3 ${toneStyles}`}
          >
            <div className="pt-0.5 shrink-0">
              {toast.tone === "error" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : toast.tone === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 break-words">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
