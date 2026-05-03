import api from './api';
import type { ApiResponse } from '../types';

export const messageService = {
  async getConversations() {
    const res = await api.get<ApiResponse<any[]>>('/Messages/conversations');
    return res.data;
  },

  async getOrCreateConversation(otherUserId: string) {
    const res = await api.post<ApiResponse<any>>(`/Messages/conversations/${otherUserId}`);
    return res.data;
  },

  async getMessages(conversationId: number, page = 1) {
    const res = await api.get<ApiResponse<any[]>>(
      `/Messages/conversations/${conversationId}/messages?page=${page}`
    );
    return res.data;
  },

  async sendMessage(conversationId: number, content: string) {
    const res = await api.post<ApiResponse<any>>(
      `/Messages/conversations/${conversationId}/messages`,
      { content }
    );
    return res.data;
  },
};