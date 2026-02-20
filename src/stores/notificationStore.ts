import { create } from "zustand";
import { api } from "@/services/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  setNotifications: (n) => set({ notifications: n }),
  fetchNotifications: async () => {
    const res = await api.getNotifications();
    set({ notifications: res.data.map((n) => ({ ...n, id: String(n.id) })) });
  },
  markAsRead: async (id) => {
    await api.markNotificationRead(Number(id));
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  markAllRead: async () => {
    await api.markAllNotificationsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  clearAll: async () => {
    await api.clearNotifications();
    set({ notifications: [] });
  },
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
