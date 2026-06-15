// src/stores/useRepositoryStore.ts
import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { __STORE__DEFAULTS__ } from "@/lib/constants";
import { getBranches, switchBranch } from "@/lib/git";

export type Repository = {
  id: string;
  name: string;
  path: string;
  addedAt: string;
  pickedBranch: boolean;
  currentBranch: string | null;
};

interface RepositoryState {
  repos: Repository[];
  selectedRepo: Repository | null;
  isLoading: boolean;
  commitEmail: string | null;
  commitName: string | null;
  loadRepositories: () => Promise<void>;
  addRepository: (path: string) => Promise<void>;
  removeRepository: (id: string) => Promise<void>;
  setSelectedRepo: (path: string) => Promise<void>;
  changeCommitEmail: (email: string) => Promise<void>;
  changeCommitName: (name: string) => Promise<void>;
  loadDetails: () => Promise<void>;
  changeBranch: (branch: string) => Promise<void>;
  // changeDefaultBranch: (path: string) => Promise<void>;
  // changeDefaultBranch: (path: string) => Promise<void>;
}

// Helper to avoid repeating the store load configuration
async function getTauriStore() {
  return await load("gitvalet.json", {
    autoSave: true,
    defaults: __STORE__DEFAULTS__,
  });
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repos: [],
  selectedRepo: null,
  commitEmail: null,
  commitName: null,
  isLoading: true, // Useful to prevent flash of empty states on startup

  changeCommitName: async (name: string) => {
    const store = await getTauriStore();

    await store.set("user.name", name);
    set({ commitName: name });
  },

  changeCommitEmail: async (email: string) => {
    const store = await getTauriStore();

    await store.set("user.email", email);
    set({ commitEmail: email });
  },

  changeBranch: async (branch: string) => {
    const repo = get().selectedRepo;
    const store = await getTauriStore();

    if (!repo) return;

    try {
      await switchBranch(repo.path, branch);

      const newSelectedRepo = {
        ...repo,
        currentBranch: branch.replace("origin/", ""),
        pickedBranch: true,
      };

      await store.set("selected_repository", newSelectedRepo);
      set({
        selectedRepo: newSelectedRepo,
      });
    } catch (e) {
      console.log(e);
    }
  },

  loadDetails: async () => {
    try {
      const store = await getTauriStore();

      const savedName = await store.get<string>("user.name");
      const savedEmail = await store.get<string>("user.email");
      const savedRepos = await store.get<Repository[]>("repositories");
      const selectedRepo = await store.get<Repository>("selected_repository");

      if (selectedRepo) {
        const branches = await getBranches(selectedRepo.path);
        const isCurrent = branches.find((b) => b.is_current);

        set({
          selectedRepo: {
            ...selectedRepo,
            currentBranch: isCurrent?.name ?? "main",
          },
        });
      }

      if (savedRepos) set({ repos: savedRepos });

      if (savedName) set({ commitName: savedName });
      if (savedEmail) set({ commitEmail: savedEmail });
    } catch (error) {
      console.error("Failed to load repositories from Tauri store:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadRepositories: async () => {
    try {
      const store = await getTauriStore();
      const saved = await store.get<Repository[]>("repositories");

      if (saved) {
        set({ repos: saved });
      }
    } catch (error) {
      console.error("Failed to load repositories from Tauri store:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addRepository: async (path: string) => {
    const store = await getTauriStore();
    const newRepo: Repository = {
      pickedBranch: false,
      currentBranch: null,
      id: crypto.randomUUID(),
      name: path.split("/").pop() || path,
      path,
      addedAt: new Date().toISOString(),
    };

    // Get current repos from the store state safely using get()
    const updated = [...get().repos, newRepo];

    await store.set("repositories", updated);
    set({ repos: updated });
  },

  setSelectedRepo: async (path: string) => {
    const store = await getTauriStore();

    // search for repo
    const selected = get().repos.find((obj) => obj.path === path) ?? null;

    await store.set("selected_repository", selected);
    set({ selectedRepo: selected });
  },

  removeRepository: async (id: string) => {
    const store = await getTauriStore();
    const updated = get().repos.filter((r) => r.id !== id);

    await store.set("repositories", updated);
    set({ repos: updated });
  },
}));
