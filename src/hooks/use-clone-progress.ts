// src/hooks/useCloneProgress.ts
import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { cancelClone } from "@/lib/git";

export type CloneProgress = {
  phase: "receiving" | "resolving" | "done" | "cancelled";
  received: number;
  total: number;
  bytes: number;
  percent: number;
};

export function useCloneProgress() {
  const [progress, setProgress] = useState<CloneProgress | null>(null);

  useEffect(() => {
    const unlistenProgress = listen<CloneProgress>("clone:progress", (e) => {
      setProgress(e.payload);
      if (e.payload.phase === "done") {
        setTimeout(() => setProgress(null), 1500);
      }
    });

    const unlistenCancelled = listen("clone:cancelled", () => {
      setProgress(null);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenCancelled.then((fn) => fn());
    };
  }, []);

  const cancel = useCallback(async () => {
    await cancelClone();
    setProgress(null);
  }, []);

  return { progress, cancel };
}
