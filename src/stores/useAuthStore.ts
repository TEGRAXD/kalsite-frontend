import { create } from "zustand";
import { api, getErrorMessage } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthProviders {
  discord: boolean;
  devLogin: boolean;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  providers: AuthProviders;
  error: string | null;
  fetchUser: (force?: boolean) => Promise<User | null>;
  fetchProviders: () => Promise<AuthProviders>;
  devLogin: (username: string) => Promise<User>;
  logout: () => Promise<void>;
}

let inFlightUser: Promise<User | null> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  providers: { discord: false, devLogin: true },
  error: null,

  fetchUser: async (force = false) => {
    if (!force && get().initialized) return get().user;
    if (inFlightUser) return inFlightUser;

    set({ loading: true, error: null });
    inFlightUser = (async () => {
      try {
        const res = await api.get("/me");
        const user: User | null = res.data?.data?.user ?? null;
        set({ user, loading: false, initialized: true });
        return user;
      } catch {
        set({ user: null, loading: false, initialized: true });
        return null;
      } finally {
        inFlightUser = null;
      }
    })();

    return inFlightUser;
  },

  fetchProviders: async () => {
    try {
      const res = await api.get("/auth/providers");
      const providers = res.data?.data as AuthProviders;
      if (providers) {
        set({ providers });
        return providers;
      }
    } catch {
      // Keep default fallback
    }
    return get().providers;
  },

  devLogin: async (username: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/dev-login", { username });
      const user = res.data?.data?.user as User;
      set({ user, loading: false, initialized: true });
      return user;
    } catch (err) {
      const msg = getErrorMessage(err, "Sign-in failed");
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null, initialized: true });
    }
  },
}));
