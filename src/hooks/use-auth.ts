import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const store = useAuthStore();

  // Run the bootstrap loading sequence once on initial mount
  useEffect(() => {
    store.initializeAuth();
  }, []);

  // Run and clean up background event listeners
  useEffect(() => {
    const cleanup = store.setupListeners();
    return () => cleanup();
  }, []);

  return {
    status: store.status,
    deviceCode: store.deviceCode,
    user: store.user,
    token: store.token,
    error: store.error,
    login: store.login,
    logout: store.logout,
  };
}
