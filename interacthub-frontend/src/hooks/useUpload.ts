import { useState } from 'react';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { UPLOAD_DEFAULT_FOLDER } from '../config/constants';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, folder = UPLOAD_DEFAULT_FOLDER): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ApiResponse<string>>(
        `/Upload/image?folder=${folder}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) return res.data.data;
      return null;
    } catch (err) {
      console.error('uploadImage error', err);
      return null;
    } finally {
      setUploading(false);
    }
  };
  const uploadVideo = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<ApiResponse<string>>(
        '/Upload/video',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (res.data.success) return res.data.data;
        return null;
    } catch {
        return null;
    } finally {
        setUploading(false);
    }
    };

    return { uploadImage, uploadVideo, uploading };
};