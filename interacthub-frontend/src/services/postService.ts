import api from './api';
import type { ApiResponse, Post, Comment } from '../types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../config/constants';

export const postService = {
  async getPosts(page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE) {
    const res = await api.get<ApiResponse<Post[]>>(`/Posts?page=${page}&pageSize=${pageSize}`);
    return res.data;
  },

  async createPost(data: { 
    content: string; 
    imageUrl?: string; 
    hashtags: string[];
    sharedPostId?: number | null;
  }) {
    const res = await api.post<ApiResponse<string>>('/Posts', data);
    return res.data;
  },

  async deletePost(id: number) {
    const res = await api.delete<ApiResponse<string>>(`/Posts/${id}`);
    return res.data;
  },

  async likePost(id: number) {
    const res = await api.post<ApiResponse<string>>(`/Posts/${id}/like`);
    return res.data;
  },

  async getPost(id: number) {
    const res = await api.get<ApiResponse<Post>>(`/Posts/${id}`);
    return res.data;
  },

  async getComments(postId: number) {
    const res = await api.get<ApiResponse<Comment[]>>(`/Posts/${postId}/comments`);
    return res.data;
  },

  async addComment(postId: number, content: string) {
    const res = await api.post<ApiResponse<string>>(`/Posts/${postId}/comments`, { content });
    return res.data;
  },
};