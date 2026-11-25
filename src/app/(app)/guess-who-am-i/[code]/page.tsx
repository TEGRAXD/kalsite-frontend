"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { wsClient } from "@/lib/ws";
import type {
  FeedItem,
  GuessResultEvent,
  PersonalizedGameState,
  RoomDetail,
} from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useGameStore } from "@/stores/useGameStore";
import { useUiStore } from "@/stores/useUiStore";
import { LobbyView } from "@/features/lobby/LobbyView";
import { GameTable } from "@/features/game/GameTable";
import { ResultsView } from "@/features/game/ResultsView";
import { Button } from "@/components/Button";

export default function GuessWhoAmIRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = (params.code || "").toUpperCase();

  const { user, initialized, fetchUser } = useAuthStore();
  const {
    currentRoom,
    lobbyFeed,
    wsConnected,
    setCurrentRoom,
    setLobbyFeed,
    appendLobbyFeed,
    setWsConnected,
    resetRoom,
  } = useRoomStore();
  const { gameState, setGameState, setLastGuessResult, resetGame } =
    useGameStore();
  const { pushToast } = useUiStore();

  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [starting, setStarting] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [returningToLobby, setReturningToLobby] = useState(false);

  useEffect(() => {
    if (!initialized) void fetchUser();
  }, [initialized, fetchUser]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/guess-who-am-i/${roomCode}`)}`,
      );
    }
  }, [initialized, user, roomCode, router]);

  useEffect(() => {
    if (!user || !roomCode) return;

    let active = true;

    async function bootstrapRoom(password?: string) {
      setLoading(true);
      try {
        const res = await api.get(`/rooms/${encodeURIComponent(roomCode)}`);
        const payload = res.data?.data as {
          room: RoomDetail;
          gameState: PersonalizedGameState | null;
          lobbyFeed: FeedItem[];
        };

        if (!active) return;

        const isMember = payload.room.members.some(
          (m) => m.userId === user!.id,
        );

        if (!isMember) {
          if (payload.room.hasPassword && !password) {
            setCurrentRoom(payload.room);
            setNeedsPassword(true);
            setLoading(false);
            return;
          }

          await api.post(`/rooms/${encodeURIComponent(roomCode)}/join`, {
            password,
          });
          const refreshed = await api.get(
            `/rooms/${encodeURIComponent(roomCode)}`,
          );
          const refreshedData = refreshed.data?.data as {
            room: RoomDetail;
            gameState: PersonalizedGameState | null;
            lobbyFeed: FeedItem[];
          };
          if (!active) return;
          setCurrentRoom(refreshedData.room);
          setGameState(refreshedData.gameState);
          setLobbyFeed(refreshedData.lobbyFeed ?? []);
        } else {
          setCurrentRoom(payload.room);
          setGameState(payload.gameState);
          setLobbyFeed(payload.lobbyFeed ?? []);
        }

        setNeedsPassword(false);
        wsClient.connect(roomCode);
      } catch (err) {
        pushToast({
          tone: "error",
          title: "Room unavailable",
          description: getErrorMessage(err),
        });
        router.replace("/guess-who-am-i");
      } finally {
        if (active) setLoading(false);
      }
    }

    const offStatus = wsClient.onStatus((connected) => {
      setWsConnected(connected);
    });
    const offRoomUpdated = wsClient.on("room:updated", (room: RoomDetail) => {
      setCurrentRoom(room);
    });
    const offLobbyChat = wsClient.on("room:chat", (item: FeedItem) => {
      appendLobbyFeed(item);
    });
    const offGameStarted = wsClient.on(
      "game:started",
      (state: PersonalizedGameState) => {
        setGameState(state);
        pushToast({
          tone: "info",
          title: "Operation started",
          description: "Operators assigned. Deduce your hidden card!",
        });
      },
    );
    const offGameState = wsClient.on(
      "game:state",
      (state: PersonalizedGameState) => {
        setGameState(state);
      },
    );
    const offGuessResult = wsClient.on(
      "game:guess-result",
      (result: GuessResultEvent) => {
        setLastGuessResult(result);
        pushToast({
          tone: result.correct ? "success" : "warning",
          title: result.correct
            ? `${result.username} guessed correctly!`
            : `${result.username} missed (${result.guessedOperatorName})`,
          description: result.correct
            ? `Identity confirmed: ${result.guessedOperatorName}`
            : result.eliminated
              ? "0 lives left — Eliminated!"
              : `${result.livesRemaining} lives remaining.`,
        });
      },
    );
    const offGameEnded = wsClient.on(
      "game:ended",
      (state: PersonalizedGameState) => {
        setGameState(state);
        pushToast({
          tone: "success",
          title: "Match concluded",
          description: "All Operator cards are now revealed.",
        });
      },
    );
    const offReturnedToLobby = wsClient.on(
      "room:returned-to-lobby",
      (payload: { room: RoomDetail }) => {
        if (payload?.room) {
          setCurrentRoom(payload.room);
        }
        setGameState(null);
      },
    );
    const offSpectatorExit = wsClient.on(
      "room:spectator-exit",
      (payload: { reason?: string }) => {
        pushToast({
          tone: "info",
          title: "Returned to rooms",
          description:
            payload?.reason || "Match ended and players returned to lobby.",
        });
        wsClient.disconnect();
        router.replace("/guess-who-am-i");
      },
    );
    const offWsError = wsClient.on(
      "ws:error",
      (err: { message?: string }) => {
        if (err?.message) {
          pushToast({
            tone: "error",
            title: "Action rejected",
            description: err.message,
          });
        }
      },
    );

    void bootstrapRoom();

    return () => {
      active = false;
      offStatus();
      offRoomUpdated();
      offLobbyChat();
      offGameStarted();
      offGameState();
      offGuessResult();
      offGameEnded();
      offReturnedToLobby();
      offSpectatorExit();
      offWsError();
      wsClient.disconnect();
      resetRoom();
      resetGame();
    };
  }, [
    user,
    roomCode,
    router,
    setCurrentRoom,
    setLobbyFeed,
    appendLobbyFeed,
    setWsConnected,
    setGameState,
    setLastGuessResult,
    resetRoom,
    resetGame,
    pushToast,
  ]);

  async function handleUnlockWithPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/rooms/${encodeURIComponent(roomCode)}/join`, {
        password: passwordInput,
      });
      const res = await api.get(`/rooms/${encodeURIComponent(roomCode)}`);
      const payload = res.data?.data as {
        room: RoomDetail;
        gameState: PersonalizedGameState | null;
        lobbyFeed: FeedItem[];
      };
      setCurrentRoom(payload.room);
      setGameState(payload.gameState);
      setLobbyFeed(payload.lobbyFeed ?? []);
      setNeedsPassword(false);
      wsClient.connect(roomCode);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Access denied",
        description: getErrorMessage(err),
      });
    }
  }

  async function handleUpdateSettings(payload: {
    name: string;
    password: string;
    maxPlayers: number;
    lives: number;
    turnTimerSeconds: number | null;
    allowPass: boolean;
    maxQuestionsPerTurn: number;
    rarities: number[];
    classes: string[];
  }) {
    if (!currentRoom) return;
    try {
      const res = await api.patch(
        `/rooms/${currentRoom.id}/settings`,
        payload,
      );
      const updated = res.data?.data as RoomDetail;
      setCurrentRoom(updated);
      pushToast({
        tone: "success",
        title: "Settings updated",
      });
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Failed to update settings",
        description: getErrorMessage(err),
      });
      throw err;
    }
  }

  async function handleStartGame(force = false) {
    if (!currentRoom) return;
    setStarting(true);
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/start`, { force });
      const data = res.data?.data as {
        room: RoomDetail;
        gameState: PersonalizedGameState | null;
      };
      setCurrentRoom(data.room);
      if (data.gameState) setGameState(data.gameState);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Cannot start match",
        description: getErrorMessage(err),
      });
    } finally {
      setStarting(false);
    }
  }

  async function handleRematch() {
    if (!currentRoom) return;
    setRematching(true);
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/rematch`);
      const data = res.data?.data as {
        room: RoomDetail;
        gameState: PersonalizedGameState | null;
      };
      setCurrentRoom(data.room);
      if (data.gameState) setGameState(data.gameState);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Rematch failed",
        description: getErrorMessage(err),
      });
    } finally {
      setRematching(false);
    }
  }

  async function handleReturnToLobby() {
    if (!currentRoom) return;
    setReturningToLobby(true);
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/lobby`);
      const data = res.data?.data as { room: RoomDetail };
      setCurrentRoom(data.room);
      setGameState(null);
    } catch (err) {
      pushToast({
        tone: "error",
        title: "Cannot return to lobby",
        description: getErrorMessage(err),
      });
    } finally {
      setReturningToLobby(false);
    }
  }

  async function handleLeaveRoom() {
    if (!currentRoom) {
      router.push("/guess-who-am-i");
      return;
    }
    try {
      await api.post(`/rooms/${currentRoom.id}/leave`);
    } catch {
      // Navigate away regardless
    }
    wsClient.disconnect();
    router.push("/guess-who-am-i");
  }

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-[var(--muted-foreground)]">
        SYNCHRONIZING ROOM {roomCode}...
      </div>
    );
  }

  if (needsPassword && currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <form
          onSubmit={handleUnlockWithPassword}
          className="w-full max-w-sm border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Lock className="h-4 w-4" />
            PROTECTED ROOM // {currentRoom.code}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Enter the room password to join <strong>{currentRoom.name}</strong>.
          </p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Room password..."
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/guess-who-am-i")}
            >
              BACK
            </Button>
            <Button type="submit" disabled={!passwordInput}>
              JOIN ROOM
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (!currentRoom) return null;

  if (gameState && gameState.status === "ended") {
    return (
      <ResultsView
        room={currentRoom}
        gameState={gameState}
        currentUserId={user.id}
        rematching={rematching}
        returningToLobby={returningToLobby}
        onRematch={handleRematch}
        onReturnToLobby={handleReturnToLobby}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (gameState && gameState.status === "active") {
    return (
      <GameTable
        roomName={currentRoom.name}
        roomMembers={currentRoom.members}
        gameState={gameState}
        currentUserId={user.id}
        onGuess={(operatorId) =>
          wsClient.send("game:guess", {
            operatorId,
            clientActionId: crypto.randomUUID(),
          })
        }
        onPass={() =>
          wsClient.send("game:pass", {
            clientActionId: crypto.randomUUID(),
          })
        }
        onLeave={handleLeaveRoom}
        onSendChat={(message) => wsClient.send("room:chat", { message })}
        onSendSpectatorChat={(message) =>
          wsClient.send("room:spectator-chat", { message })
        }
        onAskQuestion={(question) => wsClient.send("game:ask", { question })}
        onAnswerQuestion={(questionId, answer) =>
          wsClient.send("game:answer", { questionId, answer })
        }
        onSendReaction={(reaction) =>
          wsClient.send("game:reaction", { reaction })
        }
      />
    );
  }

  return (
    <LobbyView
      room={currentRoom}
      currentUser={user}
      wsConnected={wsConnected}
      lobbyFeed={lobbyFeed}
      starting={starting}
      onToggleReady={(ready) => wsClient.send("room:ready", { ready })}
      onSelectColor={(color) => wsClient.send("room:color", { color })}
      onUpdateSettings={handleUpdateSettings}
      onStartGame={handleStartGame}
      onLeaveRoom={handleLeaveRoom}
      onSendChat={(message) => wsClient.send("room:chat", { message })}
    />
  );
}
