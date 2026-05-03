import api from './api';
import type { ApiResponse, AuthResponse } from '../types';

export const authService = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    dateOfBirth: string;
  }) {
    const res = await api.post<ApiResponse<string>>('/Auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<ApiResponse<AuthResponse>>('/Auth/login', data);
    return res.data;
  },
};