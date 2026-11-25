import { create } from "zustand";

export interface ToastMessage {
  id: string;
  tone: "info" | "success" | "error" | "warning";
  title: string;
  description?: string;
}

interface UiStore {
  toasts: ToastMessage[];
  activePanelTab: "chat" | "clue" | "ask";
  passwordModalRoomCode: string | null;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  setActivePanelTab: (tab: "chat" | "clue" | "ask") => void;
  openPasswordModal: (roomCode: string) => void;
  closePasswordModal: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  toasts: [],
  activePanelTab: "chat",
  passwordModalRoomCode: null,

  pushToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts.slice(-4), { ...toast, id }] }));
    if (typeof window !== "undefined") {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, 4500);
    }
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setActivePanelTab: (activePanelTab) => set({ activePanelTab }),
  openPasswordModal: (roomCode) => set({ passwordModalRoomCode: roomCode }),
  closePasswordModal: () => set({ passwordModalRoomCode: null }),
}));
