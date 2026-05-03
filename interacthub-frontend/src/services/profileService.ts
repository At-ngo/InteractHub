import api from './api';
import type { ApiResponse } from '../types';

export const profileService = {
  async addExperience(data: {
    title: string; company: string; location?: string;
    startDate: string; endDate?: string; isCurrentJob: boolean; description?: string;
  }) {
    const res = await api.post<ApiResponse<string>>('/Profile/experience', data);
    return res.data;
  },

  async deleteExperience(id: number) {
    const res = await api.delete<ApiResponse<string>>(`/Profile/experience/${id}`);
    return res.data;
  },

  async addEducation(data: {
    school: string; degree: string; fieldOfStudy?: string;
    startDate: string; endDate?: string; description?: string;
  }) {
    const res = await api.post<ApiResponse<string>>('/Profile/education', data);
    return res.data;
  },

  async deleteEducation(id: number) {
    const res = await api.delete<ApiResponse<string>>(`/Profile/education/${id}`);
    return res.data;
  },

  async addSkill(name: string) {
    const res = await api.post<ApiResponse<string>>('/Profile/skills', JSON.stringify(name));
    return res.data;
  },

  async deleteSkill(id: number) {
    const res = await api.delete<ApiResponse<string>>(`/Profile/skills/${id}`);
    return res.data;
  },

  async getSkills() {
    const res = await api.get<ApiResponse<any[]>>('/Profile/skills');
    return res.data;
  },
};