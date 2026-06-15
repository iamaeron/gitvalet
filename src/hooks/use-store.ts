// src/hooks/useStore.ts
import { load } from "@tauri-apps/plugin-store";
import { __STORE__DEFAULTS__ } from "@/lib/constants";

const store = await load("gitvalet.json", {
  autoSave: true,
  defaults: __STORE__DEFAULTS__,
});
export default store;
