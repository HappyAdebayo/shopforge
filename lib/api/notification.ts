import { notificationApi } from "../axios";
import type {
  Notification,
  NotificationPaginatedData,
  NotificationListResponse,
  NotificationUnreadCountResponse,
  NotificationResponse,
} from "@/types";

export const notificationService = {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationPaginatedData> {
    const res = await notificationApi.get<NotificationListResponse>(
      "/api/notifications",
      { params }
    );
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await notificationApi.get<NotificationUnreadCountResponse>(
      "/api/notifications/unread-count"
    );
    return res.data.data.unreadCount;
  },

  async markAsRead(id: number): Promise<Notification> {
    const res = await notificationApi.patch<NotificationResponse>(
      `/api/notifications/${id}/read`
    );
    return res.data.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const res = await notificationApi.patch<{ message: string; data: { message: string } }>(
      "/api/notifications/read-all"
    );
    return res.data.data;
  },
};
