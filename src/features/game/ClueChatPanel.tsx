"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Send } from "lucide-react";
import type { PersonalizedGameState, RoomMemberSummary } from "@/lib/types";
import { Button } from "@/components/Button";

interface ClueChatPanelProps {
  gameState: PersonalizedGameState;
  roomMembers: RoomMemberSummary[];
  currentUserId: string;
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

const REACTIONS: Array<{
  id: "warm" | "cold" | "close" | "yes" | "no" | "thinking";
  label: string;
}> = [
  { id: "warm", label: "WARM" },
  { id: "cold", label: "COLD" },
  { id: "close", label: "CLOSE!" },
  { id: "yes", label: "YES" },
  { id: "no", label: "NO" },
  { id: "thinking", label: "HMM" },
];

export function ClueChatPanel({
  gameState,
  roomMembers,
  currentUserId,
  onSendChat,
  onSendSpectatorChat,
  onAskQuestion,
  onAnswerQuestion,
  onSendReaction,
}: ClueChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [spectatorText, setSpectatorText] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);
  const spectatorEndRef = useRef<HTMLDivElement>(null);

  const isSpectator = gameState.isSpectator;
  const isMyTurn = !isSpectator && gameState.currentTurnUserId === currentUserId;
  const maxQ = gameState.settings.maxQuestionsPerTurn;
  const askedQ = gameState.questionsAskedThisTurn;
  const canSend = !isSpectator && (!isMyTurn || askedQ < maxQ);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gameState.feed.length]);

  useEffect(() => {
    if (isSpectator) {
      spectatorEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isSpectator, gameState.spectatorFeed.length]);

  function handlePlayerSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !canSend) return;

    if (isMyTurn) {
      onAskQuestion(text);
    } else {
      onSendChat(text);
    }
    setInputText("");
  }

  function handleSpectatorSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = spectatorText.trim();
    if (!text || !isSpectator) return;
    onSendSpectatorChat(text);
    setSpectatorText("");
  }

  const activeQ = gameState.activeQuestion;
  const myAnswer = activeQ ? activeQ.answers[currentUserId] : undefined;

  const colorByUserId = new Map<string, string>();
  for (const m of roomMembers) {
    colorByUserId.set(m.userId, m.color);
  }
  for (const p of gameState.players) {
    colorByUserId.set(p.userId, p.color);
  }

  return (
    <div className="space-y-4">
      {/* PLAYER CHAT BOX */}
      <div
        className={`border border-[var(--border)] bg-[var(--card)] flex flex-col ${
          isSpectator
            ? "h-[300px] sm:h-[340px]"
            : "h-[calc(100dvh-235px)] min-h-[380px] max-h-[560px] lg:h-[540px]"
        }`}
      >
        <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between text-[10px] uppercase tracking-wider">
          <span className="font-bold">PLAYER CHAT</span>
          {isSpectator && (
            <span className="text-[var(--muted-foreground)]">READ-ONLY</span>
          )}
        </div>

        {/* ACTIVE QUESTION BANNER */}
        {activeQ && (
          <div className="p-3.5 border-b border-[var(--primary)]/50 bg-[var(--primary)]/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[var(--primary)]">
              <span>QUESTION // {activeQ.askerName}</span>
              <span>{Object.keys(activeQ.answers).length} VOTED</span>
            </div>
            <p className="text-xs font-semibold">
              &quot;{activeQ.question}&quot;
            </p>

            {!isSpectator && activeQ.askerUserId !== currentUserId ? (
              <div className="flex items-center gap-2">
                {(["yes", "no", "unsure"] as const).map((ans) => (
                  <button
                    key={ans}
                    type="button"
                    onClick={() => onAnswerQuestion(activeQ.id, ans)}
                    className={`flex-1 h-9 sm:h-7 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      myAnswer?.value === ans
                        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {ans === "unsure" ? "NOT SURE" : ans}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {Object.entries(activeQ.answers).length === 0 ? (
                  <span className="text-[var(--muted-foreground)]">
                    Waiting for teammates to answer...
                  </span>
                ) : (
                  Object.entries(activeQ.answers).map(([uid, entry]) => (
                    <span
                      key={uid}
                      className="px-1.5 py-0.5 border border-[var(--border)] bg-[var(--card)]"
                    >
                      {entry.username}:{" "}
                      <strong
                        className={
                          entry.value === "yes"
                            ? "text-emerald-400"
                            : entry.value === "no"
                              ? "text-rose-400"
                              : "text-amber-400"
                        }
                      >
                        {entry.value.toUpperCase()}
                      </strong>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* PLAYER FEED */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 text-xs">
          {gameState.feed.map((item) => {
            const badge =
              item.type === "clue"
                ? "text-[var(--primary)]"
                : item.type === "question"
                  ? "text-amber-400"
                  : item.type === "answer"
                    ? "text-emerald-400"
                    : item.type === "guess"
                      ? item.meta?.correct
                        ? "text-emerald-400 font-bold"
                        : "text-rose-400 font-bold"
                      : item.type === "system"
                        ? "text-[var(--muted-foreground)] italic"
                        : "text-[var(--foreground)]";

            return (
              <div
                key={item.id}
                className={`leading-relaxed break-words ${
                  item.type === "clue"
                    ? "border-l-2 border-[var(--primary)] pl-2.5 py-0.5 bg-[var(--primary)]/5"
                    : item.type === "question"
                      ? "border-l-2 border-amber-400/70 pl-2.5 py-0.5 bg-amber-500/5"
                      : item.type === "guess"
                        ? "border-l-2 border-amber-400 pl-2.5 py-1 bg-[var(--secondary)]/60"
                        : ""
                }`}
              >
                <span
                  className="font-semibold mr-1.5"
                  style={{
                    color:
                      (item.userId && colorByUserId.get(item.userId)) ||
                      "var(--primary)",
                  }}
                >
                  {item.username}:
                </span>
                <span className={badge}>{item.text}</span>
              </div>
            );
          })}
          <div ref={feedEndRef} />
        </div>

        {/* REACTIONS + COMPOSER (PLAYERS ONLY) */}
        {!isSpectator && (
          <>
            {!isMyTurn && (
              <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--background)]/60 flex items-center flex-wrap gap-1.5">
                <span className="text-[10px] text-[var(--muted-foreground)] mr-0.5">
                  REACT:
                </span>
                {REACTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSendReaction(r.id)}
                    className="px-2.5 py-1 sm:px-2 sm:py-0.5 text-[10px] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    [{r.label}]
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-[var(--border)] space-y-1.5">
              {isMyTurn && (
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  <span className="text-[var(--primary)]">YOUR TURN</span>
                  <span>
                    QUESTIONS: {askedQ} / {maxQ}
                  </span>
                </div>
              )}
              <form onSubmit={handlePlayerSubmit} className="flex gap-2">
                <input
                  type="text"
                  disabled={!canSend}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isMyTurn
                      ? canSend
                        ? "Ask a question about your Operator..."
                        : "Question limit reached — guess or pass"
                      : "Chat or give a clue..."
                  }
                  maxLength={isMyTurn ? 240 : 400}
                  className="flex-1 h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="md"
                  disabled={!canSend || !inputText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* SPECTATOR CHAT BOX (VISIBLE ONLY TO SPECTATORS — HIDDEN SERVER-SIDE FROM PLAYERS) */}
      {isSpectator && (
        <div className="border border-amber-500/40 bg-[var(--card)] flex flex-col h-[260px]">
          <div className="px-3.5 py-2.5 border-b border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-[10px] uppercase tracking-wider">
            <span className="font-bold text-amber-400 inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              SPECTATOR CHAT
            </span>
            <span className="text-[var(--muted-foreground)]">
              HIDDEN FROM PLAYERS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2 text-xs">
            {gameState.spectatorFeed.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">
                Private spectator channel. Players cannot see messages sent
                here.
              </p>
            ) : (
              gameState.spectatorFeed.map((item) => (
                <div key={item.id} className="leading-relaxed break-words">
                  <span
                    className="font-semibold mr-1.5"
                    style={{
                      color:
                        (item.userId && colorByUserId.get(item.userId)) ||
                        "#fbbf24",
                    }}
                  >
                    {item.username}:
                  </span>
                  <span className="text-[var(--foreground)]">{item.text}</span>
                </div>
              ))
            )}
            <div ref={spectatorEndRef} />
          </div>

          <form
            onSubmit={handleSpectatorSubmit}
            className="p-3 border-t border-[var(--border)] flex gap-2"
          >
            <input
              type="text"
              value={spectatorText}
              onChange={(e) => setSpectatorText(e.target.value)}
              placeholder="Chat with other spectators..."
              maxLength={400}
              className="flex-1 h-9 px-3 bg-[var(--input)] border border-[var(--border)] text-xs focus:outline-none focus:border-amber-400"
            />
            <Button
              type="submit"
              size="md"
              disabled={!spectatorText.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
