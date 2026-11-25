"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  EyeOff,
  Heart,
  LayoutGrid,
  LogOut,
  MessageSquare,
  SkipForward,
  Skull,
} from "lucide-react";
import { resolveAssetUrl } from "@/lib/constants";
import {
  formatOperatorName,
  type Operator,
  type PersonalizedGamePlayer,
  type PersonalizedGameState,
  type RoomMemberSummary,
} from "@/lib/types";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";
import { Button } from "@/components/Button";
import { OperatorAutocomplete } from "./OperatorAutocomplete";
import { ClueChatPanel } from "./ClueChatPanel";

interface GameTableProps {
  roomName: string;
  roomMembers: RoomMemberSummary[];
  gameState: PersonalizedGameState;
  currentUserId: string;
  onGuess: (operatorId: string) => void;
  onPass: () => void;
  onLeave: () => void;
  onSendChat: (message: string) => void;
  onSendSpectatorChat: (message: string) => void;
  onAskQuestion: (question: string) => void;
  onAnswerQuestion: (
    questionId: string,
    answer: "yes" | "no" | "unsure",
  ) => void;
  onSendReaction: (
    reaction: "warm" | "cold" | "close" | "yes" | "no" | "thinking" | "applause",
  ) => void;
}

function OpponentCard({
  player,
  maxLives,
}: {
  player: PersonalizedGamePlayer;
  maxLives: number;
}) {
  const solved = Boolean(player.guessedAt);
  const eliminated = Boolean(player.eliminatedAt);

  return (
    <div
      className={`relative overflow-hidden border bg-[var(--card)] transition-all duration-300 ${player.isTurn
        ? "border-[var(--primary)] active-turn-card"
        : solved
          ? "border-emerald-500/45"
          : eliminated
            ? "border-rose-500/35 opacity-75"
            : "border-[var(--border)]"
        }`}
      style={{
        borderTopWidth: "3px",
        borderTopColor: player.isTurn ? "var(--primary)" : player.color,
      }}
    >
      {/* PLAYER HEADER */}
      <div className="px-4 py-2.5 border-b border-[var(--border)]/70 flex items-center justify-between gap-2 text-xs bg-[var(--background)]/40">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-bold truncate"
            style={{ color: player.color }}
          >
            {player.globalName || player.username}
          </span>
          {player.isTurn && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold uppercase tracking-wider shrink-0">
              TURN
            </span>
          )}
          {solved && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              SOLVED
            </span>
          )}
          {eliminated && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-rose-500/40 bg-rose-500/10 text-rose-400 uppercase tracking-wider shrink-0">
              <Skull className="h-3 w-3" />
              OUT
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-0.5 text-rose-400 shrink-0"
          aria-label={`${player.livesRemaining} lives remaining`}
        >
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart
              key={i}
              className={`h-3.5 w-3.5 ${i < player.livesRemaining ? "fill-current" : "opacity-25"
                }`}
            />
          ))}
        </div>
      </div>

      {/* OPERATOR CONTENT */}
      <div className="relative p-4">
        {player.operator ? (
          <>
            {player.operator.factionLogoUrl && (
              <img
                src={resolveAssetUrl(player.operator.factionLogoUrl) ?? ""}
                alt=""
                aria-hidden="true"
                className="absolute right-3 bottom-2 h-16 w-16 object-contain opacity-15 invert dark:invert-0 select-none pointer-events-none"
              />
            )}

            <div className="relative flex items-start gap-3.5 min-w-0">
              <OperatorPortraitBadge operator={player.operator} size="lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-bold leading-snug break-words">
                  {formatOperatorName(player.operator)}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <RarityStars rarity={player.operator.rarity} />
                  <ClassBadge operatorClass={player.operator.operatorClass} />
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    {player.operator.branch}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] break-words">
                  {player.operator.cnName}
                  {player.operator.faction ? ` · ${player.operator.faction}` : ""}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full py-3 flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
            <EyeOff className="h-4 w-4 text-[var(--primary)]" />
            <span className="tracking-[0.25em] font-bold text-[var(--primary)]">
              [ ??? ]
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GameTable({
  roomName,
  roomMembers,
  gameState,
  currentUserId,
  onGuess,
  onPass,
  onLeave,
  onSendChat,
  onSendSpectatorChat,
  onAskQuestion,
  onAnswerQuestion,
  onSendReaction,
}: GameTableProps) {
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null,
  );
  const [guessResetCount, setGuessResetCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"table" | "chat">("table");
  const [seenFeedCount, setSeenFeedCount] = useState(
    gameState.feed.length + gameState.spectatorFeed.length,
  );

  const totalFeedCount = gameState.feed.length + gameState.spectatorFeed.length;
  const unreadChatCount =
    mobileTab === "chat" ? 0 : Math.max(0, totalFeedCount - seenFeedCount);

  useEffect(() => {
    if (mobileTab === "chat") {
      setSeenFeedCount(totalFeedCount);
    }
  }, [mobileTab, totalFeedCount]);

  const selfPlayer = gameState.players.find((p) => p.isSelf);
  const otherPlayers = gameState.isSpectator
    ? gameState.players
    : gameState.players.filter((p) => !p.isSelf);
  const activePlayer = gameState.players.find(
    (p) => p.userId === gameState.currentTurnUserId,
  );
  const isMyTurn =
    !gameState.isSpectator && gameState.currentTurnUserId === currentUserId;
  const maxLives = gameState.settings.lives;

  useEffect(() => {
    if (!gameState.turnDeadlineAt) {
      setSecondsLeft(null);
      return;
    }

    const update = () => {
      const diff = Math.max(
        0,
        Math.ceil(
          (new Date(gameState.turnDeadlineAt!).getTime() - Date.now()) / 1000,
        ),
      );
      setSecondsLeft(diff);
    };

    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [gameState.turnDeadlineAt]);

  function handleLockGuess() {
    if (!selectedOperator || !isMyTurn) return;
    onGuess(selectedOperator.id);
    setSelectedOperator(null);
    setGuessResetCount((c) => c + 1);
  }

  const selfSolved = Boolean(selfPlayer?.guessedAt);
  const selfEliminated = Boolean(selfPlayer?.eliminatedAt);

  const hasPendingQuestion = Boolean(
    gameState.activeQuestion &&
    !gameState.isSpectator &&
    gameState.activeQuestion.askerUserId !== currentUserId &&
    !gameState.activeQuestion.answers[currentUserId],
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* STATUS BAR */}
      <div className="border border-[var(--border)] bg-[var(--card)] px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <span className="font-bold tracking-wider truncate max-w-[140px] sm:max-w-none">
            {roomName}
          </span>
          <span className="text-[var(--muted-foreground)]">
            CODE:{" "}
            <strong className="text-[var(--primary)]">
              {gameState.roomCode}
            </strong>
          </span>
          <span className="text-[var(--muted-foreground)]">
            T<strong className="text-[var(--foreground)]">#{gameState.turnNumber}</strong>
          </span>
          {gameState.isSpectator && (
            <span className="px-2 py-0.5 border border-amber-500/50 bg-amber-500/10 text-amber-400 font-semibold uppercase tracking-wider">
              SPECTATING
            </span>
          )}
          {activePlayer && (
            <span className="px-2 py-0.5 border border-[var(--primary)]/60 bg-[var(--primary)]/10 text-[var(--primary)] font-semibold uppercase tracking-wider truncate max-w-[180px] sm:max-w-none">
              TURN: {activePlayer.globalName || activePlayer.username}
              {activePlayer.isSelf ? " (YOU)" : ""}
            </span>
          )}
          {secondsLeft !== null && (
            <span
              className={`inline-flex items-center gap-1 tabular-nums font-bold ${secondsLeft <= 10 ? "text-rose-400" : "text-[var(--primary)]"
                }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {secondsLeft}s
            </span>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onLeave}>
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">LEAVE</span>
        </Button>
      </div>

      {/* MOBILE TABLE / CHAT SWITCHER */}
      <div className="lg:hidden grid grid-cols-2 border border-[var(--border)] bg-[var(--card)]">
        <button
          type="button"
          onClick={() => setMobileTab("table")}
          className={`h-10 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === "table"
            ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
            : "border-transparent text-[var(--muted-foreground)]"
            }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          TABLE
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`h-10 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${mobileTab === "chat"
            ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
            : "border-transparent text-[var(--muted-foreground)]"
            }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          CHAT
          {(unreadChatCount > 0 || hasPendingQuestion) && (
            <span className="px-1.5 py-0.5 text-[10px] leading-none bg-[var(--primary)] text-[var(--primary-foreground)] font-bold">
              {hasPendingQuestion ? "!" : unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* MOBILE QUICK QUESTION ALERT WHEN ON TABLE TAB */}
      {mobileTab === "table" && hasPendingQuestion && gameState.activeQuestion && (
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className="lg:hidden w-full text-left border border-[var(--primary)]/60 bg-[var(--primary)]/10 px-3.5 py-2.5 text-xs flex items-center justify-between gap-2"
        >
          <span className="truncate">
            <strong className="text-[var(--primary)]">
              {gameState.activeQuestion.askerName}:
            </strong>{" "}
            &quot;{gameState.activeQuestion.question}&quot;
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold text-[var(--primary)]">
            VOTE →
          </span>
        </button>
      )}

      {/* MAIN GRID: TABLE + CHAT PANEL */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div
          className={`lg:col-span-8 space-y-5 ${mobileTab === "table" ? "block" : "hidden lg:block"
            }`}
        >
          {/* OTHER PLAYERS (OR ALL PLAYERS FOR SPECTATORS) */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>
                {gameState.isSpectator
                  ? `PLAYERS (${otherPlayers.length})`
                  : `OTHER PLAYERS (${otherPlayers.length})`}
              </span>
              {!gameState.isSpectator && (
                <span>YOU CAN SEE THEIR OPERATORS</span>
              )}
            </div>

            <div
              className={`grid gap-3.5 ${otherPlayers.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"
                }`}
            >
              {otherPlayers.map((player) => (
                <OpponentCard
                  key={player.userId}
                  player={player}
                  maxLives={maxLives}
                />
              ))}
            </div>
          </section>

          {/* YOUR PERSONAL CARD + GUESS STATION (ALWAYS ANCHORED AT BOTTOM) */}
          {!gameState.isSpectator && selfPlayer && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <span>YOUR CARD</span>
                <span>
                  {isMyTurn
                    ? "YOUR TURN — ASK A QUESTION, GUESS, OR PASS"
                    : selfSolved
                      ? "SOLVED — HELP OTHERS WITH CLUES"
                      : selfEliminated
                        ? "ELIMINATED — HELP OTHERS WITH CLUES"
                        : `WAITING FOR ${activePlayer?.globalName || activePlayer?.username || "TURN"}`}
                </span>
              </div>

              <div
                className={`border bg-[var(--card)] transition-all duration-300 ${isMyTurn
                  ? "border-[var(--primary)] active-turn-card"
                  : selfSolved
                    ? "border-emerald-500/50"
                    : selfEliminated
                      ? "border-rose-500/40"
                      : "border-[var(--border)]"
                  }`}
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: isMyTurn
                    ? "var(--primary)"
                    : selfPlayer.color,
                }}
              >
                {/* SELF IDENTITY ROW */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {selfPlayer.operatorHidden || !selfPlayer.operator ? (
                      <div className="h-16 w-16 shrink-0 border border-dashed border-[var(--primary)]/70 bg-[var(--primary)]/10 flex flex-col items-center justify-center">
                        <EyeOff className="h-5 w-5 text-[var(--primary)]" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--primary)] mt-1">
                          ???
                        </span>
                      </div>
                    ) : (
                      <OperatorPortraitBadge
                        operator={selfPlayer.operator}
                        size="lg"
                      />
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-bold truncate"
                          style={{ color: selfPlayer.color }}
                        >
                          {selfPlayer.globalName || selfPlayer.username}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 border border-[var(--primary)]/50 bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-wider">
                          YOU
                        </span>
                        {isMyTurn && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold uppercase tracking-wider">
                            YOUR TURN
                          </span>
                        )}
                        {selfSolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                            <CheckCircle2 className="h-3 w-3" />
                            SOLVED
                          </span>
                        )}
                        {selfEliminated && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-rose-500/40 bg-rose-500/10 text-rose-400 uppercase tracking-wider">
                            <Skull className="h-3 w-3" />
                            ELIMINATED
                          </span>
                        )}
                      </div>

                      {selfPlayer.operatorHidden || !selfPlayer.operator ? (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Your Operator is hidden. Deduce who you are from chat
                          clues.
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">
                            {formatOperatorName(selfPlayer.operator)}
                          </span>
                          <RarityStars rarity={selfPlayer.operator.rarity} />
                          <ClassBadge
                            operatorClass={selfPlayer.operator.operatorClass}
                          />
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            {selfPlayer.operator.branch}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LIVES */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                    <div
                      className="flex items-center gap-1 text-rose-400"
                      aria-label={`${selfPlayer.livesRemaining} lives remaining`}
                    >
                      {Array.from({ length: maxLives }).map((_, i) => (
                        <Heart
                          key={i}
                          className={`h-4 w-4 ${i < selfPlayer.livesRemaining
                            ? "fill-current"
                            : "opacity-25"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] tabular-nums">
                      {selfPlayer.livesRemaining} / {maxLives} LIVES
                    </span>
                  </div>
                </div>

                {/* GUESS CONTROLS */}
                <div className="p-3.5 sm:p-4 bg-[var(--background)]/40 flex flex-col sm:flex-row gap-2">
                  <OperatorAutocomplete
                    selected={selectedOperator}
                    onSelect={setSelectedOperator}
                    disabled={!isMyTurn}
                    resetSignal={guessResetCount}
                  />
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="md"
                      className="flex-1 sm:flex-none h-10 sm:h-9"
                      disabled={!isMyTurn || !selectedOperator}
                      onClick={handleLockGuess}
                    >
                      GUESS
                    </Button>
                    {gameState.settings.allowPass && (
                      <Button
                        variant="outline"
                        size="md"
                        className="flex-1 sm:flex-none h-10 sm:h-9"
                        disabled={!isMyTurn}
                        onClick={onPass}
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                        PASS
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* CHAT SIDE PANEL */}
        <div
          className={`lg:col-span-4 ${mobileTab === "chat" ? "block" : "hidden lg:block"
            }`}
        >
          <ClueChatPanel
            gameState={gameState}
            roomMembers={roomMembers}
            currentUserId={currentUserId}
            onSendChat={onSendChat}
            onSendSpectatorChat={onSendSpectatorChat}
            onAskQuestion={onAskQuestion}
            onAnswerQuestion={onAnswerQuestion}
            onSendReaction={onSendReaction}
          />
        </div>
      </div>
    </div>
  );
}
