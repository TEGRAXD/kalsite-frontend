"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LogOut,
  RotateCcw,
  Skull,
  Trophy,
} from "lucide-react";
import {
  formatOperatorName,
  type PersonalizedGameState,
  type RoomDetail,
} from "@/lib/types";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";
import { Button } from "@/components/Button";

interface ResultsViewProps {
  room: RoomDetail;
  gameState: PersonalizedGameState;
  currentUserId: string;
  rematching: boolean;
  returningToLobby: boolean;
  onRematch: () => void;
  onReturnToLobby: () => void;
  onLeave: () => void;
}

export function ResultsView({
  room,
  gameState,
  currentUserId,
  rematching,
  returningToLobby,
  onRematch,
  onReturnToLobby,
  onLeave,
}: ResultsViewProps) {
  const isHost = room.hostUserId === currentUserId;
  const isSpectator = gameState.isSpectator;
  const guessLogs = gameState.feed.filter((f) => f.type === "guess");
  const playerColorById = new Map(
    gameState.players.map((p) => [p.userId, p.color]),
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-10 space-y-5 sm:space-y-6">
      <div className="border border-[var(--primary)]/50 bg-[var(--card)] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--primary)] flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            OPERATION DECLASSIFIED // RESULTS
          </p>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            All Operator cards have been revealed after {gameState.turnNumber}{" "}
            turns.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          {isSpectator ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onLeave}
            >
              <ArrowLeft className="h-4 w-4" />
              BACK TO ROOMS
            </Button>
          ) : (
            <>
              {isHost && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={rematching}
                  onClick={onRematch}
                >
                  <RotateCcw className="h-4 w-4" />
                  {rematching ? "SHUFFLING..." : "PLAY REMATCH"}
                </Button>
              )}
              <Button
                variant={isHost ? "secondary" : "primary"}
                size="lg"
                className="w-full sm:w-auto"
                disabled={returningToLobby}
                onClick={onReturnToLobby}
              >
                <ArrowLeft className="h-4 w-4" />
                {returningToLobby ? "RETURNING..." : "BACK TO LOBBY"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={onLeave}
              >
                <LogOut className="h-4 w-4" />
                EXIT
              </Button>
            </>
          )}
        </div>
      </div>

      {/* REVEALED OPERATOR CARDS */}
      <div className="grid sm:grid-cols-2 gap-4">
        {gameState.players.map((p) => {
          const solved = Boolean(p.guessedAt);
          return (
            <div
              key={p.userId}
              className={`border p-4 space-y-3 ${solved
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-rose-500/40 bg-[var(--card)]"
                }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold" style={{ color: p.color }}>
                  {p.globalName || p.username} {p.isSelf ? "(YOU)" : ""}
                </span>
                {solved ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 uppercase font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> SOLVED (
                    {p.livesRemaining} ♥)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 uppercase font-semibold">
                    <Skull className="h-3.5 w-3.5" /> ELIMINATED
                  </span>
                )}
              </div>

              {p.operator && (
                <div className="border border-[var(--border)] bg-[var(--background)] p-3 flex items-center gap-3">
                  <OperatorPortraitBadge operator={p.operator} size="md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-bold leading-snug break-words">
                      {formatOperatorName(p.operator)}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RarityStars rarity={p.operator.rarity} />
                      <ClassBadge operatorClass={p.operator.operatorClass} />
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {p.operator.branch} · {p.operator.cnName}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* GUESS LOG */}
      <div className="border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          MATCH GUESS LOG ({guessLogs.length})
        </h2>
        {guessLogs.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            No guesses recorded.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {guessLogs.map((log) => (
              <div
                key={log.id}
                className="border-l-2 border-[var(--border)] pl-3 py-1"
              >
                <strong
                  style={{
                    color:
                      (log.userId && playerColorById.get(log.userId)) ||
                      "var(--primary)",
                  }}
                >
                  {log.username}:
                </strong>{" "}
                <span
                  className={
                    log.meta?.correct ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
