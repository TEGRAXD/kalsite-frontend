"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { OPERATOR_CLASSES } from "@/lib/constants";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { Button } from "@/components/Button";

export function CreateRoomForm() {
  const router = useRouter();
  const { user, initialized, fetchUser } = useAuthStore();
  const { pushToast } = useUiStore();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [lives, setLives] = useState(3);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<string>("");
  const [allowPass, setAllowPass] = useState(true);
  const [maxQuestionsPerTurn, setMaxQuestionsPerTurn] = useState(1);
  const [rarities, setRarities] = useState<number[]>([4, 5, 6]);
  const [classes, setClasses] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialized) void fetchUser();
  }, [initialized, fetchUser]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login?next=/guess-who-am-i/new");
    }
  }, [initialized, user, router]);

  function toggleRarity(r: number) {
    setRarities((prev) =>
      prev.includes(r)
        ? prev.length > 1
          ? prev.filter((x) => x !== r)
          : prev
        : [...prev, r].sort(),
    );
  }

  function toggleClass(cls: string) {
    setClasses((prev) =>
      prev.includes(cls) ? prev.filter((x) => x !== cls) : [...prev, cls],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setNameError("Room name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setNameError("Room name must be at least 2 characters.");
      return;
    }
    setNameError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/rooms", {
        name: trimmedName,
        password: password.trim() || undefined,
        maxPlayers,
        lives,
        turnTimerSeconds: turnTimerSeconds ? Number(turnTimerSeconds) : null,
        allowPass,
        maxQuestionsPerTurn,
        rarities,
        classes,
      });
      const created = res.data?.data as { code: string };
      pushToast({
        tone: "success",
        title: "Room deployed",
        description: `Lobby ${created.code} is ready.`,
      });
      router.push(`/guess-who-am-i/${created.code}`);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to create room",
        description: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-10 space-y-5 sm:space-y-6">
      <Link
        href="/guess-who-am-i"
        className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to rooms
      </Link>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="border border-[var(--border)] bg-[var(--card)] p-4 sm:p-8 space-y-6"
      >
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="text-xl font-bold tracking-wider">CREATE ROOM</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              ROOM NAME
            </label>
            <input
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="Enter room name..."
              className={`w-full h-10 px-3 bg-[var(--input)] border text-xs focus:outline-none ${
                nameError
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--border)] focus:border-[var(--primary)]"
              }`}
            />
            {nameError && (
              <p className="text-[11px] text-red-400">{nameError}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              OPTIONAL PASSWORD (LEAVE BLANK FOR PUBLIC)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                maxLength={64}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Optional secret passcode..."
                className="w-full h-10 pl-3 pr-10 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              PLAYER LIMIT ({maxPlayers})
            </label>
            <input
              type="range"
              min={2}
              max={10}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              LIVES PER PLAYER ({lives})
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={lives}
              onChange={(e) => setLives(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              TURN TIMER
            </label>
            <select
              value={turnTimerSeconds}
              onChange={(e) => setTurnTimerSeconds(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">Disabled (No timer)</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
              <option value="120">120 seconds</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              QUESTIONS PER TURN
            </label>
            <select
              value={maxQuestionsPerTurn}
              onChange={(e) => setMaxQuestionsPerTurn(Number(e.target.value))}
              className="w-full h-10 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
            >
              <option value={1}>1 question / turn</option>
              <option value={2}>2 questions / turn</option>
              <option value={3}>3 questions / turn</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-xs pt-1">
          <input
            type="checkbox"
            checked={allowPass}
            onChange={(e) => setAllowPass(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <span>Allow players to pass their turn without guessing</span>
        </label>

        {/* OPERATOR POOL */}
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Rarity
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((r) => {
              const active = rarities.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRarity(r)}
                  className={`px-3 py-1.5 text-xs border ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {r}★
                </button>
              );
            })}
          </div>

          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] pt-2">
            Classes (all if none selected)
          </p>
          <div className="flex flex-wrap gap-2">
            {OPERATOR_CLASSES.map((cls) => {
              const active = classes.includes(cls);
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleClass(cls)}
                  className={`px-2.5 py-1 text-[11px] uppercase border ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-[var(--border)]">
          <Link href="/guess-who-am-i" className="w-full sm:w-auto">
            <Button type="button" variant="ghost" className="w-full sm:w-auto">
              CANCEL
            </Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "CREATING..." : "CREATE ROOM"}
          </Button>
        </div>
      </form>
    </div>
  );
}
