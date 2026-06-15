import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import {
  requestDeviceCode,
  pollForToken,
  DeviceCodeResponse,
} from "@/lib/auth";
import { __STORE__DEFAULTS__ } from "@/lib/constants";

export type GitHubUser = {
  login: string;
  name: string;
  avatar_url: string;
  email: string;
};

export type AuthStatus =
  | "loading"
  | "idle"
  | "awaiting_user"
  | "polling"
  | "authenticated"
  | "error";

interface AuthState {
  status: AuthStatus;
  deviceCode: DeviceCodeResponse | null;
  user: GitHubUser | null;
  token: string | null;
  error: string | null;

  initializeAuth: () => Promise<void>;
  setupListeners: () => () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (token: string, user: GitHubUser) => void;
}

async function fetchUser(token: string): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  return res.json();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  deviceCode: null,
  user: null,
  token: null,
  error: null,

  setAuthenticated: (token, user) =>
    set({
      token,
      user,
      status: "authenticated",
      deviceCode: null,
    }),

  initializeAuth: async () => {
    try {
      const token = await invoke<string | null>("get_auth_token");
      if (token) {
        const user = await fetchUser(token);
        get().setAuthenticated(token, user);
      } else {
        set({ status: "idle" });
      }
    } catch (e: any) {
      set({ status: "idle", error: e.toString() });
    }
  },

  setupListeners: () => {
    const unlistenPromise = listen<string>("auth:success", async (e) => {
      const token = e.payload;
      try {
        const user = await fetchUser(token);
        get().setAuthenticated(token, user);
      } catch (err: any) {
        set({ status: "error", error: "Failed to fetch user profiles." });
      }
    });

    return () => {
      unlistenPromise.then((unlistenFn) => unlistenFn());
    };
  },

  login: async () => {
    try {
      set({ error: null, status: "awaiting_user" });

      const response = await requestDeviceCode();
      set({ deviceCode: response, status: "polling" });

      pollForToken(response.device_code, response.interval).catch((e) => {
        set({ error: e.toString(), status: "error", deviceCode: null });
      });
    } catch (e: any) {
      set({ error: e.toString(), status: "error", deviceCode: null });
    }
  },

  logout: async () => {
    await invoke("logout");
    const store = await load("gitvalet.json", {
      autoSave: true,
      defaults: __STORE__DEFAULTS__,
    });
    await store.delete("github_token");
    set({ token: null, user: null, status: "idle" });
  },
}));
