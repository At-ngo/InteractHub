import api from './api';
import type { ApiResponse } from '../types';

export const hashtagService = {
  async getTrending() {
    const res = await api.get<ApiResponse<any[]>>('/Hashtags/trending');
    return res.data;
  }
};