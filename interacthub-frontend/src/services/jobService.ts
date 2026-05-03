import api from './api';
import type { ApiResponse } from '../types';

export const jobService = {
  async getJobs(q?: string, location?: string) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (location) params.append('location', location);
    const res = await api.get<ApiResponse<any[]>>(`/Jobs?${params}`);
    return res.data;
  },

  async getJob(id: number) {
    const res = await api.get<ApiResponse<any>>(`/Jobs/${id}`);
    return res.data;
  },

  async createJob(data: {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements?: string;
    salary?: string;
    jobType: string;
  }) {
    const res = await api.post<ApiResponse<string>>('/Jobs', data);
    return res.data;
  },

  async applyJob(id: number, coverLetter: string) {
    const res = await api.post<ApiResponse<string>>(`/Jobs/${id}/apply`, { coverLetter });
    return res.data;
  },

  async getMyApplications() {
    const res = await api.get<ApiResponse<any[]>>('/Jobs/my-applications');
    return res.data;
  },

  async deleteJob(id: number) {
    const res = await api.delete<ApiResponse<string>>(`/Jobs/${id}`);
    return res.data;
  },
};