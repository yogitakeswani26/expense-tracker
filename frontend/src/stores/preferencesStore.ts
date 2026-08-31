import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Notification / in-app preferences store.
 * ----------------------------------------------------------------------------
 * Client-side only (persisted to localStorage via zustand `persist`, same
 * pattern as `authStore`). There is currently no
 * `notificationPreferences` field on the backend User model
 * (backend/src/models/User.ts), so these toggles are device-scoped and do
 * NOT sync across devices/browsers. If/when the backend adds that field,
 * swap the `persist` storage for a hydrate-from-API + PUT /auth/profile
 * call, matching how `Settings.tsx` already saves currency/language/timezone.
 */

export interface NotificationPreferences {
  /** Show an in-app toast when a budget crosses its alert threshold. */
  budgetAlerts: boolean;
  /** Show an in-app toast confirming expense create/update/delete. */
  expenseActivity: boolean;
  /** Browser Notification API popups (requires permission grant). */
  browserPush: boolean;
  /** Play a short sound alongside toast notifications. */
  soundEnabled: boolean;
  /** Opt-in weekly spending summary reminder (client-side nudge only). */
  weeklyDigest: boolean;
}

interface PreferencesStore {
  notifications: NotificationPreferences;
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
  resetNotificationPreferences: () => void;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  budgetAlerts: true,
  expenseActivity: true,
  browserPush: false,
  soundEnabled: false,
  weeklyDigest: false,
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      notifications: DEFAULT_NOTIFICATION_PREFERENCES,

      setNotificationPreference: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),

      resetNotificationPreferences: () =>
        set({ notifications: DEFAULT_NOTIFICATION_PREFERENCES }),
    }),
    {
      name: 'expense-tracker-preferences',
      storage: typeof window !== 'undefined' ? (localStorage as any) : undefined,
    }
  )
);

/**
 * Requests browser Notification permission. Call this from a user gesture
 * (e.g. the "Browser push" toggle's onChange) — browsers reject silent
 * permission requests made outside a click handler.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
