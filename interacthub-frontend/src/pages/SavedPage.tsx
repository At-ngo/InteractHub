import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/post/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Post } from '../types';
import api from '../services/api';

const SavedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const res = await api.get('/Posts/saved');
      if (res.data.success) setPosts(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-linkedin-border p-4 mb-4">
          <h1 className="text-xl font-bold text-linkedin-text">🔖 Mục đã lưu</h1>
          <p className="text-sm text-linkedin-muted mt-1">{posts.length} bài viết đã lưu</p>
        </div>

        {loading ? <LoadingSpinner /> : (
          posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-linkedin-border p-8 text-center text-linkedin-muted">
              <p className="text-3xl mb-2">🔖</p>
              <p>Chưa có bài viết nào được lưu</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            ))
          )
        )}
      </div>
    </MainLayout>
  );
};
export default SavedPage;