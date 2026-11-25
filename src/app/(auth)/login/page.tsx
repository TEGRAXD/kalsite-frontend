"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/Button";

function getSafeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/guess-who-am-i";
  }
  return raw;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  discord_not_configured: "Discord OAuth is not configured on the backend yet.",
  access_denied: "Discord sign-in was cancelled.",
  missing_code: "Discord did not return an authorization code. Please try again.",
  invalid_oauth_state: "Your sign-in session expired. Please try again.",
  token_exchange_failed:
    "Discord token exchange failed. Check DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_REDIRECT_URI.",
  discord_profile_failed: "Unable to load your Discord profile. Please try again.",
  oauth_network_error: "Network error communicating with Discord. Please try again.",
};

const IS_DEV = process.env.NODE_ENV !== "production";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const { user, loading, fetchUser, devLogin } = useAuthStore();

  const [codename, setCodename] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      router.replace(nextPath);
    }
  }, [user, router, nextPath]);

  async function handleDevSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (codename.trim().length < 2) {
      setFormError("Enter a name of at least 2 characters.");
      return;
    }
    try {
      await devLogin(codename.trim());
      router.push(nextPath);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to sign in");
    }
  }

  return (
    <div className="w-full max-w-sm border border-[var(--border)] bg-[var(--card)] p-6 space-y-5 shadow-xl">
      <div className="space-y-1.5 border-b border-[var(--border)] pb-4">
        <h1 className="text-lg font-bold tracking-wider">SIGN IN</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Sign in to join or create rooms.
        </p>
      </div>

      {(errorParam || formError) && (
        <div className="border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {formError ||
              (errorParam && AUTH_ERROR_MESSAGES[errorParam]) ||
              `Auth error: ${errorParam}`}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <a
          href={`${API_URL}/auth/discord?next=${encodeURIComponent(nextPath)}`}
          className="w-full h-11 px-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border transition-colors bg-[#5865F2] text-white border-[#5865F2] hover:opacity-90"
        >
          CONTINUE WITH DISCORD
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {IS_DEV && (
        <form
          onSubmit={handleDevSubmit}
          className="pt-4 border-t border-[var(--border)] space-y-3"
        >
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Dev Login
          </p>
          <input
            type="text"
            value={codename}
            onChange={(e) => setCodename(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? "SIGNING IN..." : "CONTINUE"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="border border-[var(--border)] bg-[var(--card)] p-6 text-xs text-[var(--muted-foreground)]">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
