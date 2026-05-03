import api from './api';
import type { ApiResponse, User } from '../types';

export const userService = {
  async getMyProfile() {
    const res = await api.get<ApiResponse<User>>('/Users/me');
    return res.data;
  },

  async getProfile(id: string) {
    const res = await api.get<ApiResponse<User>>(`/Users/${id}`);
    return res.data;
  },

  async updateProfile(data: {
    fullName: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    gitHubUrl?: string;
    websiteUrl?: string;
    linkedInUrl?: string;
  }) {
    const res = await api.put<ApiResponse<string>>('/Users/me', data);
    return res.data;
  },

  async searchUsers(query: string) {
    const res = await api.get<ApiResponse<User[]>>(`/Users/search?q=${query}`);
    return res.data;
  },
};