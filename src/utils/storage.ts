/**
 * Safe localStorage wrapper with versioning and error handling
 */

export interface StoragePreferenceSchema {
  version: number;
  darkMode: boolean;
  theme: string;
}

const STORAGE_KEYS = {
  LOGGED_IN: "skillora_logged_in",
  GUEST_MODE: "skillora_guest_mode",
  DARK_MODE: "skillora_dark_mode",
  THEME: "skillora_dashboard_theme",
  PREFERENCES: "skillora_ui_preferences",
} as const;

export const safeStorage = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch (e) {
      console.warn(`[safeStorage] Failed to read key "${key}":`, e);
      return fallback;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.warn(`[safeStorage] Failed to write key "${key}":`, e);
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[safeStorage] Failed to remove key "${key}":`, e);
    }
  },

  /**
   * Clear all user-specific data from localStorage on logout to ensure Auth Cache Isolation
   */
  clearAuthSession(): void {
    try {
      // Remove sensitive session identifiers and stale local state
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      localStorage.removeItem(STORAGE_KEYS.GUEST_MODE);
      localStorage.removeItem("skillora_db");
      localStorage.removeItem("skillora_mentor_messages_v2");
      localStorage.removeItem("skillora_mentor_req_count");
      localStorage.removeItem("skillora_simulasi_decision_history");
    } catch (e) {
      console.warn("[safeStorage] Failed to clear auth session:", e);
    }
  },

  /**
   * Clean up any legacy database cache
   */
  cleanupLegacyDB(): void {
    try {
      if (localStorage.getItem("skillora_db")) {
        localStorage.removeItem("skillora_db");
      }
    } catch (e) {
      // silent
    }
  }
};

export const storage = {
  get: <T>(key: string, fallback: T): T => safeStorage.getItem(key, fallback),
  set: <T>(key: string, value: T): boolean => safeStorage.setItem(key, value),
  remove: (key: string): void => safeStorage.removeItem(key),
};

