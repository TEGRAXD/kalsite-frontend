"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Crown,
  Eye,
  EyeOff,
  LogOut,
  Play,
  Send,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { OPERATOR_CLASSES } from "@/lib/operators-catalog";
import {
  PLAYER_COLORS,
  type FeedItem,
  type RoomDetail,
  type User,
} from "@/lib/types";
import { Button } from "@/components/Button";

export interface RoomSettingsUpdatePayload {
  name: string;
  password: string;
  maxPlayers: number;
  lives: number;
  turnTimerSeconds: number | null;
  allowPass: boolean;
  maxQuestionsPerTurn: number;
  rarities: number[];
  classes: string[];
}

interface LobbyViewProps {
  room: RoomDetail;
  currentUser: User;
  wsConnected: boolean;
  lobbyFeed: FeedItem[];
  starting: boolean;
  onToggleReady: (ready: boolean) => void;
  onSelectColor: (color: string) => void;
  onUpdateSettings: (payload: RoomSettingsUpdatePayload) => Promise<void>;
  onStartGame: (force?: boolean) => void;
  onLeaveRoom: () => void;
  onSendChat: (message: string) => void;
}

export function LobbyView({
  room,
  currentUser,
  wsConnected,
  lobbyFeed,
  starting,
  onToggleReady,
  onSelectColor,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom,
  onSendChat,
}: LobbyViewProps) {
  const [chatText, setChatText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Host inline settings editor state
  const [editingSettings, setEditingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState(room.roomPassword ?? "");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editMaxPlayers, setEditMaxPlayers] = useState(room.settings.maxPlayers);
  const [editLives, setEditLives] = useState(room.settings.lives);
  const [editTurnTimer, setEditTurnTimer] = useState(
    room.settings.turnTimerSeconds ? String(room.settings.turnTimerSeconds) : "",
  );
  const [editMaxQuestions, setEditMaxQuestions] = useState(
    room.settings.maxQuestionsPerTurn,
  );
  const [editAllowPass, setEditAllowPass] = useState(room.settings.allowPass);
  const [editRarities, setEditRarities] = useState<number[]>(
    room.settings.operatorPool.rarities,
  );
  const [editClasses, setEditClasses] = useState<string[]>(
    room.settings.operatorPool.classes,
  );

  function openSettingsEditor() {
    setEditName(room.name);
    setEditNameError(null);
    setEditPassword(room.roomPassword ?? "");
    setShowEditPassword(false);
    setEditMaxPlayers(room.settings.maxPlayers);
    setEditLives(room.settings.lives);
    setEditTurnTimer(
      room.settings.turnTimerSeconds
        ? String(room.settings.turnTimerSeconds)
        : "",
    );
    setEditMaxQuestions(room.settings.maxQuestionsPerTurn);
    setEditAllowPass(room.settings.allowPass);
    setEditRarities([...room.settings.operatorPool.rarities]);
    setEditClasses([...room.settings.operatorPool.classes]);
    setEditingSettings(true);
  }

  function toggleEditRarity(r: number) {
    setEditRarities((prev) =>
      prev.includes(r)
        ? prev.length > 1
          ? prev.filter((x) => x !== r)
          : prev
        : [...prev, r].sort(),
    );
  }

  function toggleEditClass(cls: string) {
    setEditClasses((prev) =>
      prev.includes(cls) ? prev.filter((x) => x !== cls) : [...prev, cls],
    );
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (trimmedName.length === 0) {
      setEditNameError("Room name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setEditNameError("Room name must be at least 2 characters.");
      return;
    }
    setEditNameError(null);
    setSavingSettings(true);
    try {
      await onUpdateSettings({
        name: trimmedName,
        password: editPassword,
        maxPlayers: Math.max(editMaxPlayers, room.members.length),
        lives: editLives,
        turnTimerSeconds: editTurnTimer ? Number(editTurnTimer) : null,
        allowPass: editAllowPass,
        maxQuestionsPerTurn: editMaxQuestions,
        rarities: editRarities,
        classes: editClasses,
      });
      setEditingSettings(false);
    } catch {
      // Toast handled by parent
    } finally {
      setSavingSettings(false);
    }
  }

  const isHost = room.hostUserId === currentUser.id;
  const selfMember = room.members.find((m) => m.userId === currentUser.id);
  const memberColorById = new Map(room.members.map((m) => [m.userId, m.color]));
  const colorOwnerByHex = new Map(
    room.members.map((m) => [m.color.toLowerCase(), m]),
  );
  const nonHostPlayers = room.members.filter(
    (m) => m.userId !== room.hostUserId && m.role !== "spectator",
  );
  const allOthersReady = nonHostPlayers.every((m) => m.isReady);
  const canStart = isHost && room.members.length >= 2 && allOthersReady;

  function copyCode() {
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  function copyPassword() {
    if (typeof navigator !== "undefined" && room.roomPassword) {
      void navigator.clipboard.writeText(room.roomPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 1800);
    }
  }

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatText.trim()) return;
    onSendChat(chatText.trim());
    setChatText("");
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest">
            <span className="text-[var(--primary)]">LOBBY // STAGING</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] ${wsConnected
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                }`}
            >
              {wsConnected ? (
                <>
                  <Wifi className="h-3 w-3" /> LIVE
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" /> RECONNECTING
                </>
              )}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{room.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {room.hasPassword && room.roomPassword && (
            <div className="h-9 px-3 border border-[var(--border)] bg-[var(--background)] flex items-center gap-2 text-xs">
              <span className="text-[var(--muted-foreground)] tracking-[0.15em]">
                PASS:
              </span>
              <strong className="text-[var(--foreground)] tracking-wider">
                {showPassword
                  ? room.roomPassword
                  : "•".repeat(Math.min(12, Math.max(4, room.roomPassword.length)))}
              </strong>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide room password" : "Show room password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={copyPassword}
                aria-label="Copy room password"
                title="Copy password"
                className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {copiedPassword && (
                <span className="text-[10px] text-emerald-400 tracking-normal">
                  COPIED
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={copyCode}
            className="h-9 px-3 border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] flex items-center gap-2 text-xs tracking-[0.2em]"
          >
            <span className="text-[var(--muted-foreground)]">CODE:</span>
            <strong className="text-[var(--primary)]">{room.code}</strong>
            <Copy className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            {copied && (
              <span className="text-[10px] text-emerald-400 tracking-normal">
                COPIED
              </span>
            )}
          </button>

          <Button variant="danger" size="md" onClick={onLeaveRoom}>
            <LogOut className="h-3.5 w-3.5" />
            LEAVE
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* MEMBERS + CONTROLS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
              <span className="font-bold uppercase tracking-wider">
                SQUAD ROSTER ({room.members.length} / {room.maxPlayers})
              </span>
              <span className="text-[var(--muted-foreground)]">
                MIN 2 PLAYERS TO LAUNCH
              </span>
            </div>

            <div className="space-y-2">
              {room.members.map((member) => {
                const memberIsHost = member.userId === room.hostUserId;
                const isSelf = member.userId === currentUser.id;
                return (
                  <div
                    key={member.userId}
                    className={`border px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs ${isSelf
                        ? "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                        : "border-[var(--border)] bg-[var(--background)]/60"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${member.isOnline ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        title={member.isOnline ? "Online" : "Offline"}
                      />
                      <span
                        className="font-semibold truncate"
                        style={{ color: member.color }}
                      >
                        {member.globalName || member.username}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-[var(--primary)]/40 text-[var(--primary)]">
                          YOU
                        </span>
                      )}
                      {memberIsHost && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-amber-500/40 text-amber-400 bg-amber-500/10">
                          <Crown className="h-3 w-3" /> HOST
                        </span>
                      )}
                    </div>

                    <div className="shrink-0">
                      {member.isReady || memberIsHost ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 uppercase tracking-wider">
                          <CheckCircle2 className="h-3.5 w-3.5" /> READY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider">
                          <Circle className="h-3.5 w-3.5" /> WAITING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selfMember && (
              <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  YOUR COLOR
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PLAYER_COLORS.map((c) => {
                    const owner = colorOwnerByHex.get(c.hex.toLowerCase());
                    const isMine = owner?.userId === currentUser.id;
                    const isTakenByOther = Boolean(owner && !isMine);
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={isTakenByOther}
                        onClick={() => {
                          if (!isMine && !isTakenByOther) {
                            onSelectColor(c.hex);
                          }
                        }}
                        title={
                          isMine
                            ? `${c.name} (Selected)`
                            : isTakenByOther
                              ? `${c.name} (Taken by ${owner?.globalName || owner?.username})`
                              : c.name
                        }
                        aria-label={`Select ${c.name}`}
                        className={`h-8 w-8 sm:h-6 sm:w-6 border transition-transform relative inline-flex items-center justify-center ${
                          isMine
                            ? "border-white scale-110 ring-1 ring-[var(--primary)]"
                            : isTakenByOther
                              ? "border-[var(--border)] opacity-35 grayscale-[30%]"
                              : "border-white/20 hover:scale-110"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isMine && (
                          <Check className="h-3.5 w-3.5 text-black stroke-[3]" />
                        )}
                        {isTakenByOther && (
                          <X className="h-3.5 w-3.5 text-black stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {!isHost && selfMember && (
                <Button
                  variant={selfMember.isReady ? "outline" : "primary"}
                  className="w-full sm:w-auto"
                  onClick={() => onToggleReady(!selfMember.isReady)}
                >
                  {selfMember.isReady ? "NOT READY" : "READY"}
                </Button>
              )}

              {isHost ? (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between w-full gap-3">
                  <p className="text-[11px] text-[var(--muted-foreground)] sm:pt-2">
                    {room.members.length < 2
                      ? "Share the room code with at least 1 other player to start."
                      : !allOthersReady
                        ? "Waiting for all players to ready."
                        : "All players ready. Start whenever you're set."}
                  </p>
                  <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={!canStart || starting}
                      onClick={() => onStartGame(false)}
                    >
                      <Play className="h-4 w-4" />
                      {starting ? "DEPLOYING..." : "START MATCH"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={room.members.length < 2 || starting}
                      onClick={() => onStartGame(true)}
                    >
                      FORCE START MATCH
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Waiting for host to launch the operation...
                </p>
              )}
            </div>
          </div>

          {/* RULES SUMMARY & HOST SETTINGS */}
          <div className="border border-[var(--border)] bg-[var(--card)] p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <span className="font-bold uppercase tracking-wider">
                ROOM SETTINGS
              </span>
              {isHost && !editingSettings && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openSettingsEditor}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  EDIT
                </Button>
              )}
              {isHost && editingSettings && (
                <button
                  type="button"
                  onClick={() => setEditingSettings(false)}
                  aria-label="Close settings editor"
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {editingSettings && isHost ? (
              <form onSubmit={handleSaveSettings} noValidate className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      ROOM NAME
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        if (editNameError) setEditNameError(null);
                      }}
                      className={`w-full h-9 px-2.5 bg-[var(--input)] border text-xs focus:outline-none ${
                        editNameError
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--border)] focus:border-[var(--primary)]"
                      }`}
                    />
                    {editNameError && (
                      <p className="text-[11px] text-red-400">
                        {editNameError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      PASSWORD (BLANK = PUBLIC)
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        maxLength={64}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Public room"
                        className="w-full h-9 pl-2.5 pr-9 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        aria-label={
                          showEditPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {showEditPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      MAX PLAYERS ({editMaxPlayers})
                    </label>
                    <input
                      type="range"
                      min={Math.max(2, room.members.length)}
                      max={10}
                      value={Math.max(editMaxPlayers, room.members.length)}
                      onChange={(e) => setEditMaxPlayers(Number(e.target.value))}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      LIVES ({editLives})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      value={editLives}
                      onChange={(e) => setEditLives(Number(e.target.value))}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      TURN TIMER
                    </label>
                    <select
                      value={editTurnTimer}
                      onChange={(e) => setEditTurnTimer(e.target.value)}
                      className="w-full h-9 px-2.5 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Off</option>
                      <option value="30">30s</option>
                      <option value="60">60s</option>
                      <option value="90">90s</option>
                      <option value="120">120s</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      QUESTIONS / TURN
                    </label>
                    <select
                      value={editMaxQuestions}
                      onChange={(e) =>
                        setEditMaxQuestions(Number(e.target.value))
                      }
                      className="w-full h-9 px-2.5 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value={1}>1 / turn</option>
                      <option value={2}>2 / turn</option>
                      <option value={3}>3 / turn</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={editAllowPass}
                    onChange={(e) => setEditAllowPass(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span>Allow pass turn</span>
                </label>

                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    RARITY
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((r) => {
                      const active = editRarities.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleEditRarity(r)}
                          className={`px-2.5 py-1 text-xs border ${
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

                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] pt-1">
                    CLASSES (ALL IF NONE SELECTED)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {OPERATOR_CLASSES.map((cls) => {
                      const active = editClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleEditClass(cls)}
                          className={`px-2 py-0.5 text-[11px] uppercase border ${
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

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSettings(false)}
                  >
                    CANCEL
                  </Button>
                  <Button type="submit" size="sm" disabled={savingSettings}>
                    {savingSettings ? "SAVING..." : "SAVE SETTINGS"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase">
                    LIVES
                  </p>
                  <p className="font-bold mt-0.5">{room.settings.lives} ♥</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase">
                    TURN TIMER
                  </p>
                  <p className="font-bold mt-0.5">
                    {room.settings.turnTimerSeconds
                      ? `${room.settings.turnTimerSeconds}s`
                      : "OFF"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase">
                    RARITIES
                  </p>
                  <p className="font-bold mt-0.5">
                    {room.settings.operatorPool.rarities
                      .map((r) => `${r}★`)
                      .join(" ")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase">
                    PASS TURN
                  </p>
                  <p className="font-bold mt-0.5">
                    {room.settings.allowPass ? "ALLOWED" : "DISABLED"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOBBY CHAT */}
        <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--card)] flex flex-col h-[340px] lg:h-[420px]">
          <div className="px-4 py-3 border-b border-[var(--border)] text-xs font-bold uppercase tracking-wider">
            LOBBY COMMS
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
            {lobbyFeed.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">
                Channel open. Coordinate rules or invite friends while waiting.
              </p>
            ) : (
              lobbyFeed.map((item) => (
                <div key={item.id} className="leading-relaxed">
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        (item.userId && memberColorById.get(item.userId)) ||
                        "var(--primary)",
                    }}
                  >
                    {item.username}:
                  </span>{" "}
                  <span className="text-[var(--foreground)]">{item.text}</span>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={handleChatSubmit}
            className="p-3 border-t border-[var(--border)] flex gap-2"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Send lobby message..."
              maxLength={400}
              className="flex-1 h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)]"
            />
            <Button type="submit" size="md" disabled={!chatText.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
