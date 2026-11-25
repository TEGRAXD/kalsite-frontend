"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  ExternalLink,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  Gamepad2,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { RoleSummary, RoomSummary, User } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { Button } from "@/components/Button";

interface AdminOverviewData {
  counts: {
    users: number;
    operators: number;
    roles: number;
    activeRooms: number;
  };
  rooms: RoomSummary[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, initialized, fetchUser } = useAuthStore();
  const { pushToast } = useUiStore();

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [rolesList, setRolesList] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [closingRoomId, setClosingRoomId] = useState<string | null>(null);

  const isSuperAdmin = user?.roleId === "super-administrator";

  useEffect(() => {
    if (!initialized) void fetchUser();
  }, [initialized, fetchUser]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login?next=/admin");
    }
  }, [initialized, user, router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/users"),
      ]);
      setOverview(overviewRes.data?.data ?? null);
      setUsersList(usersRes.data?.data?.users ?? []);
      setRolesList(usersRes.data?.data?.roles ?? []);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to load dashboard",
        description: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (!initialized || !isSuperAdmin) return;
    void loadDashboard();
  }, [initialized, isSuperAdmin, loadDashboard]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter((u) => {
      return (
        u.username.toLowerCase().includes(q) ||
        (u.globalName?.toLowerCase().includes(q) ?? false) ||
        u.discordId.toLowerCase().includes(q) ||
        u.roleId.toLowerCase().includes(q)
      );
    });
  }, [usersList, search]);

  async function handleRoleChange(targetUser: User, nextRoleId: string) {
    if (nextRoleId === targetUser.roleId) return;
    setUpdatingUserId(targetUser.id);
    try {
      const res = await api.patch(`/users/${targetUser.id}/role`, {
        roleId: nextRoleId,
      });
      const updated = res.data?.data as User;
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, ...updated } : u)),
      );
      pushToast({
        tone: "success",
        title: "Role updated",
        description: `${targetUser.globalName || targetUser.username} is now ${updated.role?.name || nextRoleId}.`,
      });
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Role update failed",
        description: getErrorMessage(err),
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleCloseRoom(room: RoomSummary) {
    setClosingRoomId(room.id);
    try {
      await api.delete(`/admin/rooms/${room.id}`);
      setOverview((prev) => {
        if (!prev) return prev;
        const nextRooms = prev.rooms.filter((r) => r.id !== room.id);
        return {
          ...prev,
          counts: { ...prev.counts, activeRooms: nextRooms.length },
          rooms: nextRooms,
        };
      });
      pushToast({
        tone: "info",
        title: "Room closed",
        description: `Room ${room.code} (${room.name}) was closed.`,
      });
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to close room",
        description: getErrorMessage(err),
      });
    } finally {
      setClosingRoomId(null);
    }
  }

  if (!initialized || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-rose-500/40 bg-[var(--card)] p-6 space-y-4 text-center">
          <div className="mx-auto h-11 w-11 border border-rose-500/40 bg-rose-500/10 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-bold uppercase tracking-wider">
              ACCESS RESTRICTED
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Super Administrator permissions are required to view this
              dashboard.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              RETURN HOME
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-10 space-y-6">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--primary)] flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            SUPER ADMINISTRATOR
          </p>
          <h1 className="text-2xl font-bold tracking-wider">ADMIN DASHBOARD</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Manage user roles, active rooms, and operator data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => void loadDashboard()}
            disabled={loading}
            title="Refresh dashboard"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            REFRESH
          </Button>
        </div>
      </header>

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              TOTAL USERS
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {overview?.counts.users ?? "—"}
            </p>
          </div>
          <Users className="h-5 w-5 text-[var(--primary)]" />
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              ACTIVE ROOMS
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {overview?.counts.activeRooms ?? "—"}
            </p>
          </div>
          <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              ENABLED OPERATORS
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {overview?.counts.operators ?? "—"}
            </p>
          </div>
          <Database className="h-5 w-5 text-[var(--primary)]" />
        </div>
      </section>

      {/* USERS & ROLES */}
      <section className="border border-[var(--border)] bg-[var(--card)]">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider">
              USERS &amp; ROLES ({filteredUsers.length})
            </h2>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              Assign roles across Kal&apos;site accounts.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or Discord ID..."
              className="w-full h-9 pl-8 pr-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {loading && usersList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            No matching users found.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredUsers.map((u) => {
              const isSelf = u.id === user.id;
              return (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.globalName || u.username}
                        className="h-9 w-9 border border-[var(--border)] object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 border border-[var(--border)] bg-[var(--background)] flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0">
                        {(u.globalName || u.username).slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold truncate">
                          {u.globalName || u.username}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          @{u.username}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 text-[10px] border border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--primary)]">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--muted-foreground)] truncate mt-0.5">
                        ID: {u.discordId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <select
                      aria-label={`Role for ${u.username}`}
                      value={u.roleId}
                      disabled={isSelf || updatingUserId === u.id}
                      onChange={(e) => void handleRoleChange(u, e.target.value)}
                      className="h-9 px-2.5 w-full sm:w-48 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                    >
                      {rolesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ACTIVE ROOMS */}
      <section className="border border-[var(--border)] bg-[var(--card)]">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider">
              ACTIVE ROOMS ({overview?.rooms.length ?? 0})
            </h2>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              Monitor live rooms or force-close stuck lobbies.
            </p>
          </div>
          <Link
            href="/guess-who-am-i"
            className="text-[11px] text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            ROOMS PAGE
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {!overview || overview.rooms.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            No active rooms right now.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {overview.rooms.map((room) => (
              <div
                key={room.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--primary)]">
                      {room.code}
                    </span>
                    <span className="text-xs font-semibold truncate">
                      {room.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] uppercase border border-[var(--border)] text-[var(--muted-foreground)]">
                      {room.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Host: {room.hostName} · {room.playerCount}/{room.maxPlayers}{" "}
                    players
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/guess-who-am-i/${room.code}`}>
                    <Button variant="outline" size="sm">
                      OPEN
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={closingRoomId === room.id}
                    onClick={() => void handleCloseRoom(room)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {closingRoomId === room.id ? "CLOSING..." : "CLOSE"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
