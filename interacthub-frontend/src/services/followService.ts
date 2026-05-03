import api from './api';
import type { ApiResponse } from '../types';

export const followService = {
  async toggleFollow(targetId: string) {
    const res = await api.post<ApiResponse<string>>(`/Follow/${targetId}`);
    return res.data;
  },
};