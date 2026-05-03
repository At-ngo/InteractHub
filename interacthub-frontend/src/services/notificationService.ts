import api from './api';
import type { ApiResponse, Notification } from '../types';

export const notificationService = {
  async getNotifications() {
    const res = await api.get<ApiResponse<Notification[]>>('/Notifications');
    return res.data;
  },

  async markAsRead(id: number) {
    const res = await api.put<ApiResponse<string>>(`/Notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.put<ApiResponse<string>>('/Notifications/read-all');
    return res.data;
  },
};