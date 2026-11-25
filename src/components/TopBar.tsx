"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./Button";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, initialized, fetchUser, logout } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      void fetchUser();
    }
  }, [initialized, fetchUser]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const gamesActive =
    pathname === "/games" ||
    pathname.startsWith("/games/") ||
    pathname.startsWith("/guess-who-am-i");

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto h-full px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-5 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors shrink-0"
          >
            <span className="h-7 w-7 sm:h-8 sm:w-8 border border-[var(--primary)]/60 bg-[var(--card)] overflow-hidden shrink-0">
              <img
                src="/kaltsit-e1.png"
                alt="Kal'site"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-bold tracking-[0.1em] sm:tracking-[0.12em] text-xs sm:text-sm">
              KAL&apos;SITE
            </span>
          </Link>

          <Link
            href="/games"
            className={`px-2.5 sm:px-3 py-1.5 text-xs tracking-wider border transition-colors shrink-0 ${gamesActive
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            GAMES
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2.5 py-1.5 border border-[var(--border)] bg-[var(--card)] text-xs max-w-[140px] truncate">
                {user.globalName || user.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">SIGN IN</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
