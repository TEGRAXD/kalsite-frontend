"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Skull,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  ClassBadge,
  OperatorPortraitBadge,
  RarityStars,
} from "@/components/OperatorCard";
import { Button } from "@/components/Button";
import { SYSTEM_NAME } from "@/lib/constants";

const DEMO_OPPONENTS = [
  {
    name: "Amiya",
    color: "#38bdf8",
    lives: 3,
    operator: {
      name: "SilverAsh",
      cnName: "银灰",
      operatorClass: "Guard",
      branch: "Lord",
      rarity: 6,
      imageUrl: "/uploads/operators/char_172_svrash.png",
    },
  },
  {
    name: "Texas",
    color: "#f472b6",
    lives: 2,
    operator: {
      name: "Exusiai",
      cnName: "能天使",
      operatorClass: "Sniper",
      branch: "Marksman",
      rarity: 6,
      imageUrl: "/uploads/operators/char_103_angel.png",
    },
  },
];

const DEMO_QUESTIONS = [
  {
    id: "q1",
    question: "Am I a 6★ Operator?",
    answer: "YES" as const,
    votes: "YES (2)",
  },
  {
    id: "q2",
    question: "Am I from Rhodes Island?",
    answer: "YES" as const,
    votes: "YES (2)",
  },
  {
    id: "q3",
    question: "Am I a Guard?",
    answer: "NO" as const,
    votes: "NO (2)",
  },
  {
    id: "q4",
    question: "Am I a Medic?",
    answer: "YES" as const,
    votes: "YES (2)",
  },
];

const DEMO_GUESS_OPTIONS = [
  { id: "silverash", name: "SilverAsh", correct: false },
  { id: "kaltsit", name: "Kal'tsit", correct: true },
  { id: "surtr", name: "Surtr", correct: false },
  { id: "ptilopsis", name: "Ptilopsis", correct: false },
];

const FLOW_STEPS = [
  {
    id: "lobby",
    num: "01",
    label: "LOBBY",
    icon: Users,
    title: "Create a room & pick your color",
    summary:
      "Host sets lives, turn timer, rarity/class pool, and questions per turn. Each player gets a unique color from 10 choices and marks Ready.",
    highlights: [
      "2–10 players per room (public or password)",
      "Host can edit settings anytime before starting",
      "Start Match once everyone is ready (or Force Start)",
    ],
  },
  {
    id: "ask",
    num: "02",
    label: "ASK",
    icon: MessageSquare,
    title: "Ask on your turn, chat freely off-turn",
    summary:
      "Everyone sees your Operator except you. On your turn, your message becomes a question that teammates vote YES, NO, or NOT SURE on.",
    highlights: [
      "Active player has a per-turn question limit (default 1)",
      "Other players can chat, give clues, and quick-react anytime",
      "No voice chat required—works great text-only or with Discord",
    ],
  },
  {
    id: "guess",
    num: "03",
    label: "GUESS",
    icon: Target,
    title: "Lock in your Operator or pass",
    summary:
      "Start typing in the guess box to search Operators by name, Latin name, or CN name. Wrong guesses cost 1 heart.",
    highlights: [
      "Correct guess reveals your card and locks your win",
      "Pass turn if allowed to gather more clues next round",
      "0 hearts = eliminated, but you stay as a clue-giver",
    ],
  },
  {
    id: "end",
    num: "04",
    label: "RESULTS",
    icon: Sparkles,
    title: "Spectators stay isolated, instant rematch",
    summary:
      "Mid-match joiners watch as spectators with a private chat invisible to players. When everyone finishes, all Operators and guesses reveal.",
    highlights: [
      "Spectator chat is hidden server-side from active players",
      "Play Rematch immediately (players only) or return to Lobby",
      "Empty rooms clean up automatically after 10 minutes",
    ],
  },
] as const;

const FAQS = [
  {
    q: "Can anyone cheat by inspecting network requests?",
    a: "No. Your own Operator is stripped server-side (null) until you guess correctly, run out of lives, or the match ends.",
  },
  {
    q: "Do I need voice chat to play?",
    a: "No. Yes/No voting, room chat, and quick reactions ([WARM], [COLD], [CLOSE!]) are built for text-first play—voice is optional.",
  },
  {
    q: "What happens if someone joins mid-match?",
    a: "They join as a Spectator: player chat is read-only for them, they get a private Spectator Chat hidden from players, and they aren't pulled into rematches.",
  },
  {
    q: "What happens at 0 lives?",
    a: "You are eliminated from guessing and your Operator is revealed to you, so you can keep helping remaining players until the match ends.",
  },
];

export function HowToPlayInteractive() {
  // Mini playable demo state
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState<"playing" | "solved" | "eliminated">(
    "playing",
  );
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Interactive step viewer & FAQ accordion
  const [activeStepId, setActiveStepId] =
    useState<(typeof FLOW_STEPS)[number]["id"]>("lobby");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const revealed = status !== "playing";
  const activeStep =
    FLOW_STEPS.find((s) => s.id === activeStepId) ?? FLOW_STEPS[0];

  function handleAskDemo(qId: string) {
    if (revealed || askedIds.includes(qId)) return;
    setAskedIds((prev) => [...prev, qId]);
  }

  function handleGuessDemo(opt: (typeof DEMO_GUESS_OPTIONS)[number]) {
    if (revealed) return;
    if (opt.correct) {
      setStatus("solved");
      setLastFeedback("Correct! Your hidden Operator was Kal'tsit.");
    } else {
      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);
      if (nextLives === 0) {
        setStatus("eliminated");
        setLastFeedback(
          `Missed (${opt.name}). 0 lives left — your Operator was Kal'tsit.`,
        );
      } else {
        setLastFeedback(
          `Not ${opt.name}! -1 life (${nextLives} remaining). Ask another clue!`,
        );
      }
    }
  }

  function resetDemo() {
    setAskedIds([]);
    setLives(3);
    setStatus("playing");
    setLastFeedback(null);
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-12 space-y-10 sm:space-y-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--primary)]">
            GUIDE // {SYSTEM_NAME}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            HOW TO PLAY
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Everyone sees your Arknights Operator except you. Try the live mini
            turn below.
          </p>
        </div>

        <Link href="/guess-who-am-i" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            PLAY NOW
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* INTERACTIVE MINI-TURN DEMO */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--primary)] font-semibold">
            INTERACTIVE DEMO // TRY A TURN
          </p>
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            RESET DEMO
          </button>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 space-y-5 tactical-grid">
          <div className="grid lg:grid-cols-12 gap-5 items-start">
            {/* LEFT: OPPONENTS + YOUR HIDDEN CARD */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {DEMO_OPPONENTS.map((opp) => (
                  <div
                    key={opp.name}
                    className="border border-[var(--border)] bg-[var(--card)]"
                    style={{
                      borderTopWidth: "3px",
                      borderTopColor: opp.color,
                    }}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)]/70 flex items-center justify-between text-xs bg-[var(--background)]/40">
                      <span
                        className="font-bold"
                        style={{ color: opp.color }}
                      >
                        {opp.name}
                      </span>
                      <span className="flex items-center gap-0.5 text-rose-400">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Heart
                            key={i}
                            className={`h-3 w-3 ${
                              i < opp.lives ? "fill-current" : "opacity-25"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                      <OperatorPortraitBadge
                        operator={opp.operator}
                        size="md"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-bold leading-snug">
                          {opp.operator.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <RarityStars rarity={opp.operator.rarity} />
                          <ClassBadge
                            operatorClass={opp.operator.operatorClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* YOUR PERSONAL CARD */}
              <div
                className={`border bg-[var(--card)] transition-all ${
                  status === "solved"
                    ? "border-emerald-500/60"
                    : status === "eliminated"
                      ? "border-rose-500/50"
                      : "border-[var(--primary)] active-turn-card"
                }`}
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor:
                    status === "eliminated" ? "#f87171" : "var(--primary)",
                }}
              >
                <div className="p-4 flex items-center justify-between gap-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3 min-w-0">
                    {revealed ? (
                      <div className="h-14 w-14 shrink-0 border border-[var(--primary)]/60 overflow-hidden bg-[var(--background)]">
                        <img
                          src="/kaltsit-e1.png"
                          alt="Kal'tsit"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 shrink-0 border border-dashed border-[var(--primary)]/70 bg-[var(--primary)]/10 flex flex-col items-center justify-center">
                        <EyeOff className="h-4 w-4 text-[var(--primary)]" />
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[var(--primary)] mt-0.5">
                          ???
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[var(--primary)]">
                          YOU
                        </span>
                        {status === "playing" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold uppercase tracking-wider">
                            YOUR TURN
                          </span>
                        )}
                        {status === "solved" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 uppercase">
                            <CheckCircle2 className="h-3 w-3" /> SOLVED
                          </span>
                        )}
                        {status === "eliminated" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-rose-500/40 bg-rose-500/10 text-rose-400 uppercase">
                            <Skull className="h-3 w-3" /> OUT
                          </span>
                        )}
                      </div>

                      {revealed ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">Kal&apos;tsit</span>
                          <RarityStars rarity={6} />
                          <ClassBadge operatorClass="Medic" />
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          Ask clues on the right, then guess below!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-rose-400 shrink-0">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`h-4 w-4 ${
                          i < lives ? "fill-current" : "opacity-25"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* QUICK GUESS CHOICES */}
                <div className="p-3.5 bg-[var(--background)]/50 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                    <span>CLICK TO GUESS YOUR OPERATOR</span>
                    {revealed && (
                      <button
                        type="button"
                        onClick={resetDemo}
                        className="text-[var(--primary)] hover:underline font-semibold"
                      >
                        TRY AGAIN
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEMO_GUESS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={revealed}
                        onClick={() => handleGuessDemo(opt)}
                        className={`h-9 px-2 text-xs font-semibold border transition-colors ${
                          revealed && opt.correct
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                  {lastFeedback && (
                    <p
                      className={`text-xs pt-0.5 ${
                        status === "solved"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {lastFeedback}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: INTERACTIVE CLUE CHAT */}
            <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--card)] flex flex-col">
              <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between text-[10px] uppercase tracking-wider">
                <span className="font-bold">DEMO CHAT</span>
                <span className="text-[var(--muted-foreground)]">
                  CLICK A QUESTION
                </span>
              </div>

              <div className="p-3.5 space-y-2 text-xs min-h-[170px] max-h-[220px] overflow-y-auto">
                <p className="text-[var(--muted-foreground)] italic">
                  <span className="text-[var(--primary)] font-semibold not-italic mr-1.5">
                    {SYSTEM_NAME}:
                  </span>
                  Turn 1: Ask a Yes/No question to narrow down your hidden
                  Operator.
                </p>

                {askedIds.map((id) => {
                  const q = DEMO_QUESTIONS.find((item) => item.id === id);
                  if (!q) return null;
                  return (
                    <div key={id} className="space-y-1">
                      <div className="border-l-2 border-amber-400/70 pl-2 py-0.5 bg-amber-500/5">
                        <span className="text-[var(--primary)] font-semibold mr-1.5">
                          YOU:
                        </span>
                        <span className="text-amber-400">{q.question}</span>
                      </div>
                      <div className="pl-2 text-[11px]">
                        <span className="text-[#38bdf8] font-semibold">
                          Amiya
                        </span>{" "}
                        &amp;{" "}
                        <span className="text-[#f472b6] font-semibold">
                          Texas
                        </span>{" "}
                        voted{" "}
                        <strong
                          className={
                            q.answer === "YES"
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {q.votes}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-[var(--border)] bg-[var(--background)]/50 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  TAP TO ASK:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_QUESTIONS.map((q) => {
                    const alreadyAsked = askedIds.includes(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        disabled={alreadyAsked || revealed}
                        onClick={() => handleAskDemo(q.id)}
                        className={`px-2.5 py-1.5 text-[11px] border text-left transition-colors ${
                          alreadyAsked
                            ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)] opacity-60"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] disabled:opacity-45"
                        }`}
                      >
                        {q.question}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE 4-STEP FLOW */}
      <section className="space-y-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--primary)] font-semibold">
          MATCH FLOW // 01–04
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FLOW_STEPS.map((step) => {
            const active = step.id === activeStep.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={`p-3 border text-left transition-colors flex items-center gap-2.5 ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] opacity-75">
                    {step.num}
                  </span>
                  <span className="block text-xs font-bold tracking-wider truncate">
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 grid md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-7 space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold tracking-wide">
              {activeStep.num} — {activeStep.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
              {activeStep.summary}
            </p>
            <ul className="space-y-1.5 pt-1 text-xs text-[var(--foreground)]">
              {activeStep.highlights.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <span className="text-[var(--primary)] font-bold">&gt;</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* MINI VISUAL PREVIEW PER STEP */}
          <div className="md:col-span-5 border border-[var(--border)] bg-[var(--background)] p-4 text-xs space-y-3">
            {activeStep.id === "lobby" && (
              <>
                <div className="flex items-center justify-between text-[10px] uppercase text-[var(--muted-foreground)]">
                  <span>SQUAD ROSTER</span>
                  <span>COLOR PICKER</span>
                </div>
                <div className="space-y-1.5">
                  <div className="border border-[var(--border)] px-2.5 py-1.5 flex justify-between">
                    <span className="font-semibold text-[#34d399]">
                      Doctor (HOST)
                    </span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                  <div className="border border-[var(--border)] px-2.5 py-1.5 flex justify-between">
                    <span className="font-semibold text-[#38bdf8]">
                      Kal&apos;tsit
                    </span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {["#34d399", "#38bdf8", "#f472b6", "#fb923c", "#a78bfa", "#facc15"].map(
                    (hex) => (
                      <span
                        key={hex}
                        className="h-5 w-5 border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                    ),
                  )}
                </div>
              </>
            )}

            {activeStep.id === "ask" && (
              <>
                <div className="border border-[var(--primary)]/50 bg-[var(--primary)]/10 p-2.5 space-y-2">
                  <p className="text-[10px] text-[var(--primary)] uppercase">
                    QUESTION // YOU
                  </p>
                  <p className="font-semibold">&quot;Am I a Sniper?&quot;</p>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                    <span className="py-1 border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]">
                      YES
                    </span>
                    <span className="py-1 border border-[var(--border)] bg-[var(--card)]">
                      NO
                    </span>
                    <span className="py-1 border border-[var(--border)] bg-[var(--card)]">
                      NOT SURE
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px] text-[var(--muted-foreground)]">
                  <span className="px-2 py-0.5 border border-[var(--border)]">
                    [WARM]
                  </span>
                  <span className="px-2 py-0.5 border border-[var(--border)]">
                    [COLD]
                  </span>
                  <span className="px-2 py-0.5 border border-[var(--border)]">
                    [CLOSE!]
                  </span>
                </div>
              </>
            )}

            {activeStep.id === "guess" && (
              <>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">
                    YOUR LIVES
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    <Heart className="h-3.5 w-3.5 opacity-25" />
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 px-2.5 border border-[var(--primary)] bg-[var(--input)] flex items-center text-[11px]">
                    Kal&apos;tsit
                  </div>
                  <span className="h-8 px-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-[10px] flex items-center">
                    GUESS
                  </span>
                </div>
              </>
            )}

            {activeStep.id === "end" && (
              <>
                <div className="border border-amber-500/40 bg-amber-500/5 p-2.5 space-y-1">
                  <p className="text-[10px] font-bold text-amber-400 inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> SPECTATOR CHAT
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Private channel—players never see spectator messages.
                  </p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="flex-1 py-1.5 text-center bg-[var(--primary)] text-[var(--primary-foreground)]">
                    PLAY REMATCH
                  </span>
                  <span className="flex-1 py-1.5 text-center border border-[var(--border)]">
                    BACK TO LOBBY
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* COMPACT FAQ ACCORDION */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)] flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          FAQ
        </h2>

        <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[var(--card)]">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 text-xs font-semibold hover:text-[var(--primary)] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform ${
                      isOpen ? "rotate-180 text-[var(--primary)]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <div className="border border-[var(--primary)]/40 bg-[var(--primary)]/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">
            READY TO PLAY?
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Jump into Guess Who Am I or browse the Operator Index.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <Link href="/guess-who-am-i" className="w-full sm:w-auto">
            <Button size="md" className="w-full sm:w-auto">
              ENTER ROOMS
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/operators" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              OPERATORS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
