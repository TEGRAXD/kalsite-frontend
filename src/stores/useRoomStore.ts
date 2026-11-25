import { create } from "zustand";
import { api, getErrorMessage } from "@/lib/api";
import type { FeedItem, RoomDetail, RoomSummary } from "@/lib/types";

interface RoomFilters {
  search: string;
  status: "all" | "waiting" | "playing" | "finished";
  page: number;
}

interface RoomStore {
  rooms: RoomSummary[];
  loadingList: boolean;
  filters: RoomFilters;
  currentRoom: RoomDetail | null;
  lobbyFeed: FeedItem[];
  wsConnected: boolean;
  error: string | null;
  setFilters: (patch: Partial<RoomFilters>) => void;
  fetchRooms: (options?: { silent?: boolean }) => Promise<void>;
  setCurrentRoom: (room: RoomDetail | null) => void;
  setLobbyFeed: (feed: FeedItem[]) => void;
  appendLobbyFeed: (item: FeedItem) => void;
  setWsConnected: (connected: boolean) => void;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  loadingList: false,
  filters: {
    search: "",
    status: "all",
    page: 1,
  },
  currentRoom: null,
  lobbyFeed: [],
  wsConnected: false,
  error: null,

  setFilters: (patch) =>
    set((state) => ({
      filters: { ...state.filters, ...patch },
    })),

  fetchRooms: async (options) => {
    const { search, status, page } = get().filters;
    if (!options?.silent) {
      set({ loadingList: true, error: null });
    }
    try {
      const res = await api.get("/rooms", {
        params: {
          search: search.trim() || undefined,
          status: status === "all" ? undefined : status,
          page,
        },
      });
      set({ rooms: res.data?.data ?? [], loadingList: false });
    } catch (err) {
      set({
        loadingList: false,
        error: getErrorMessage(err, "Failed to load rooms"),
      });
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),
  setLobbyFeed: (lobbyFeed) => set({ lobbyFeed }),
  appendLobbyFeed: (item) =>
    set((state) => ({ lobbyFeed: [...state.lobbyFeed.slice(-79), item] })),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  resetRoom: () =>
    set({ currentRoom: null, lobbyFeed: [], wsConnected: false, error: null }),
}));
