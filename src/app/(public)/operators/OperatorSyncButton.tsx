"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export function OperatorSyncButton() {
  const { user } = useAuthStore();
  const isAdmin =
    user?.roleId === "administrator" ||
    user?.roleId === "super-administrator";

  if (!isAdmin) return null;

  return (
    <Link
      href="/operators/manage"
      className="inline-flex items-center gap-2 h-9 px-4 border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-xs uppercase tracking-wider shrink-0 transition-colors"
    >
      <RefreshCw className="h-3.5 w-3.5 text-[var(--primary)]" />
      SYNC / UPDATE OPS
    </Link>
  );
}
