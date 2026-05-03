import api from './api';
import type { ApiResponse } from '../types';

export const friendService = {
  async sendRequest(receiverId: string) {
    const res = await api.post<ApiResponse<string>>(`/Friends/request/${receiverId}`);
    return res.data;
  },

  async acceptRequest(senderId: string) {
    const res = await api.put<ApiResponse<string>>(`/Friends/accept/${senderId}`);
    return res.data;
  },

  async rejectRequest(senderId: string) {
    const res = await api.put<ApiResponse<string>>(`/Friends/reject/${senderId}`);
    return res.data;
  },

  async getFriends() {
    const res = await api.get<ApiResponse<any[]>>('/Friends');
    return res.data;
  },

  async getSentRequests() {
    const res = await api.get<ApiResponse<any[]>>('/Friends/sent');
    return res.data;
  },

  async getPendingRequests() {
    const res = await api.get<ApiResponse<any[]>>('/Friends/pending');
    return res.data;
  },

  async unfriend(friendId: string) {
    const res = await api.delete<ApiResponse<string>>(`/Friends/unfriend/${friendId}`);
    return res.data;
  },

  async cancelRequest(receiverId: string) {
    const res = await api.delete<ApiResponse<string>>(`/Friends/cancel/${receiverId}`);
    return res.data;
  },

  async getFriendshipStatus(targetId: string) {
    const res = await api.get<ApiResponse<any>>(`/Friends/status/${targetId}`);
    return res.data;
  },

};