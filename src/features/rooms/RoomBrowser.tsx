"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Database,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { wsClient } from "@/lib/ws";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useUiStore } from "@/stores/useUiStore";
import { Button } from "@/components/Button";

export function RoomBrowser() {
  const router = useRouter();
  const { user, initialized, fetchUser } = useAuthStore();
  const { rooms, loadingList, filters, setFilters, fetchRooms } =
    useRoomStore();
  const {
    passwordModalRoomCode,
    openPasswordModal,
    closePasswordModal,
    pushToast,
  } = useUiStore();

  const [directCode, setDirectCode] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) void fetchUser();
  }, [initialized, fetchUser]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login?next=/guess-who-am-i");
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (!user) return;
    void fetchRooms();
  }, [user, filters.status, filters.page, fetchRooms]);

  useEffect(() => {
    if (!user) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void fetchRooms({ silent: true });
      }, 150);
    };

    const offListUpdated = wsClient.on("rooms:list-updated", scheduleRefresh);
    const offStatus = wsClient.onStatus((connected) => {
      if (connected) scheduleRefresh();
    });

    wsClient.connectRoomList();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      offListUpdated();
      offStatus();
      wsClient.disconnectRoomList();
    };
  }, [user, fetchRooms]);

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetchRooms();
  }

  async function joinRoom(code: string, password?: string) {
    if (!user) {
      pushToast({
        tone: "warning",
        title: "Sign in required",
        description: "Authenticate first to join a game room.",
      });
      router.push("/login?next=/guess-who-am-i");
      return;
    }

    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    setJoining(normalized);
    try {
      await api.post(`/rooms/${encodeURIComponent(normalized)}/join`, {
        password: password || undefined,
      });
      closePasswordModal();
      setModalPassword("");
      router.push(`/guess-who-am-i/${normalized}`);
    } catch (err) {
      const msg = getErrorMessage(err, "Unable to join room");
      if (msg.toLowerCase().includes("password required")) {
        openPasswordModal(normalized);
      } else {
        pushToast({ tone: "error", title: "Join failed", description: msg });
      }
    } finally {
      setJoining(null);
    }
  }

  if (!initialized || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-10 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Games
        </Link>

        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <Link
            href="/how-to-play"
            className="inline-flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            How to Play
          </Link>
          <Link
            href="/operators"
            className="inline-flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
          >
            <Database className="h-3.5 w-3.5" />
            Operators
          </Link>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-wider">GUESS WHO AM I</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Join a room or create your own.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void joinRoom(directCode);
            }}
            className="flex items-center gap-1.5 flex-1 sm:flex-none"
          >
            <input
              type="text"
              value={directCode}
              onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={10}
              className="h-9 flex-1 sm:w-32 sm:flex-none px-2.5 bg-[var(--input)] border border-[var(--border)] text-xs uppercase tracking-widest focus:outline-none focus:border-[var(--primary)]"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!directCode.trim() || joining !== null}
            >
              JOIN
            </Button>
          </form>

          <Link href="/guess-who-am-i/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              CREATE ROOM
            </Button>
          </Link>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center gap-2"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search room name or code..."
              className="w-full h-9 pl-9 pr-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <Button type="submit" variant="outline" size="md">
            FILTER
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "waiting", "playing", "finished"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilters({ status: st, page: 1 })}
              className={`px-2.5 h-8 text-[11px] uppercase tracking-wider border ${
                filters.status === st
                  ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {st}
            </button>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void fetchRooms()}
            disabled={loadingList}
            title="Refresh room list"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingList ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* ROOM LIST */}
      {loadingList && rooms.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--card)] p-12 text-center text-xs text-[var(--muted-foreground)]">
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            No rooms yet.
          </p>
          <Link href="/guess-who-am-i/new">
            <Button>
              <Plus className="h-4 w-4" />
              CREATE ROOM
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const statusColor =
              room.status === "waiting"
                ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                : room.status === "playing"
                  ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                  : "text-[var(--muted-foreground)] border-[var(--border)] bg-[var(--secondary)]";

            return (
              <div
                key={room.id}
                className="border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between gap-4 hover:border-[var(--primary)]/70 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-[0.2em] text-[var(--muted-foreground)]">
                        CODE //{" "}
                        <span className="text-[var(--primary)] font-bold">
                          {room.code}
                        </span>
                      </p>
                      <h2 className="text-sm font-bold truncate mt-0.5">
                        {room.name}
                      </h2>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider border ${statusColor}`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span className="tabular-nums">
                        {room.playerCount} / {room.maxPlayers} PLAYERS
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {room.hasPassword ? (
                        <>
                          <Lock className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-amber-400">PASSWORD</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                          <span>PUBLIC</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-2.5 flex items-center justify-between">
                    <span>HOST: {room.hostName}</span>
                    <span>
                      {room.settings.lives} LIVES ·{" "}
                      {room.settings.turnTimerSeconds
                        ? `${room.settings.turnTimerSeconds}S`
                        : "NO TIMER"}
                    </span>
                  </div>
                </div>

                <Button
                  variant={room.status === "waiting" ? "primary" : "outline"}
                  size="md"
                  className="w-full"
                  disabled={joining === room.code}
                  onClick={() => {
                    if (room.hasPassword) {
                      openPasswordModal(room.code);
                    } else {
                      void joinRoom(room.code);
                    }
                  }}
                >
                  {joining === room.code
                    ? "CONNECTING..."
                    : room.status === "playing"
                      ? "SPECTATE / REJOIN"
                      : "JOIN ROOM"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* PASSWORD MODAL */}
      {passwordModalRoomCode && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Lock className="h-4 w-4 text-amber-400" />
                ROOM {passwordModalRoomCode}
              </div>
              <button
                type="button"
                onClick={() => {
                  closePasswordModal();
                  setModalPassword("");
                }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void joinRoom(passwordModalRoomCode, modalPassword);
              }}
              className="space-y-3"
            >
              <label className="block text-xs text-[var(--muted-foreground)]">
                Enter room password to gain access:
              </label>
              <div className="relative">
                <input
                  type={showModalPassword ? "text" : "password"}
                  autoFocus
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  placeholder="Password..."
                  className="w-full h-10 pl-3 pr-10 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword((prev) => !prev)}
                  aria-label={showModalPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showModalPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    closePasswordModal();
                    setModalPassword("");
                  }}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={!modalPassword || joining !== null}
                >
                  UNLOCK &amp; JOIN
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
