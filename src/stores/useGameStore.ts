import { create } from "zustand";
import type { GuessResultEvent, PersonalizedGameState } from "@/lib/types";

interface GameStore {
  gameState: PersonalizedGameState | null;
  lastGuessResult: GuessResultEvent | null;
  setGameState: (state: PersonalizedGameState | null) => void;
  setLastGuessResult: (result: GuessResultEvent | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  lastGuessResult: null,
  setGameState: (gameState) => set({ gameState }),
  setLastGuessResult: (lastGuessResult) => set({ lastGuessResult }),
  resetGame: () => set({ gameState: null, lastGuessResult: null }),
}));
