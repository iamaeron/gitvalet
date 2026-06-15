import { invoke } from "@tauri-apps/api/core";

export type CommitEntry = {
  hash: string;
  short_hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
};
export type FileStatus = { path: string; status: string };
export type BranchInfo = {
  name: string;
  is_current: boolean;
  is_remote: boolean;
};

// Repo
export const isGitRepo = (path: string) =>
  invoke<boolean>("is_git_repo", { path });
export const initRepo = (path: string) => invoke<string>("init_repo", { path });
export const cloneRepo = (url: string, dest: string, token?: string) =>
  invoke("clone_repo", { url, dest, token });

export const cancelClone = () => invoke("cancel_clone");

// Status & Staging
export const getStatus = (path: string) =>
  invoke<FileStatus[]>("get_status", { path });
export const stageFile = (path: string, file: string) =>
  invoke<string>("stage_file", { path, file });
export const stageAll = (path: string) => invoke<string>("stage_all", { path });
export const unstageFile = (path: string, file: string) =>
  invoke<string>("unstage_file", { path, file });
export const discardFile = (path: string, file: string) =>
  invoke<string>("discard_file", { path, file });

// Diff
export const getDiff = (path: string, file: string, staged: boolean) =>
  invoke<string>("get_diff", { path, file, staged });
export const getFileAtCommit = (path: string, hash: string, file: string) =>
  invoke<string>("get_file_at_commit", { path, hash, file });

// Commits
export const commit = (path: string, message: string) =>
  invoke<string>("commit", { path, message });
export const getLog = (path: string, limit = 50) =>
  invoke<CommitEntry[]>("get_log", { path, limit });
export const amendCommit = (path: string, message: string) =>
  invoke<string>("amend_commit", { path, message });

// Branches
export const getBranches = (path: string) =>
  invoke<BranchInfo[]>("get_branches", { path });
export const createBranch = (path: string, name: string) =>
  invoke<string>("create_branch", { path, name });
export const switchBranch = (path: string, name: string) =>
  invoke<string>("switch_branch", { path, name });
export const deleteBranch = (path: string, name: string, force = false) =>
  invoke<string>("delete_branch", { path, name, force });
export const mergeBranch = (path: string, name: string) =>
  invoke<string>("merge_branch", { path, name });

// Remote
export const fetch = (path: string, token?: string) =>
  invoke("fetch", { path, token });

export const pull = (path: string, token?: string) =>
  invoke("pull", { path, token });

export const push = (path: string, token?: string, force = false) =>
  invoke("push", { path, token, force });
export const pushUpstream = (path: string, branch: string) =>
  invoke<string>("push_set_upstream", { path, branch });
export const addRemote = (path: string, name: string, url: string) =>
  invoke<string>("add_remote", { path, name, url });

// Stash
export const stash = (path: string, message: string) =>
  invoke<string>("stash", { path, message });
export const stashPop = (path: string) => invoke<string>("stash_pop", { path });
export const stashList = (path: string) =>
  invoke<string>("stash_list", { path });

// Tags
export const getTags = (path: string) => invoke<string>("get_tags", { path });
export const createTag = (path: string, name: string, message: string) =>
  invoke<string>("create_tag", { path, name, message });

// Repo URL
export function getRepoNameFromURL(urlString: string): string {
  try {
    const url = new URL(urlString);

    if (url.hostname !== "github.com") return "";

    const pathParts = url.pathname.split("/").filter(Boolean);

    return pathParts[1] || "";
  } catch (e) {
    return "";
  }
}
