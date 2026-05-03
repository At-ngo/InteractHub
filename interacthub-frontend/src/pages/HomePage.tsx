import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import type { Post, User } from '../types';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/post/PostCard';
import CreatePostCard from '../components/post/CreatePostCard';
import ProfileCard from '../components/user/ProfileCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TrendingSidebar from '../components/common/TrendingSidebar';
import StoriesBar from '../components/post/StoriesBar';

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = async (p = 1, reset = false) => {
    try {
      const res = await postService.getPosts(p, 10);
      if (res.success) {
        if (reset) {
          setPosts(res.data);
        } else {
          setPosts(prev => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 10);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const res = await userService.getMyProfile();
    if (res.success) setProfile(res.data);
  };

  useEffect(() => {
    loadPosts(1, true);
    loadProfile();
  }, []);

  const handlePostCreated = () => {
    setPage(1);
    loadPosts(1, true);
  };

  const handlePostDeleted = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left - Profile */}
        <div className="md:col-span-1">
          {profile && <ProfileCard user={profile} />}
        </div>

        {/* Center - Feed */}
        <div className="md:col-span-2">
          <StoriesBar /> 
          <CreatePostCard onCreated={handlePostCreated} />
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
              ))}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-3 text-linkedin-blue text-sm font-medium hover:bg-white rounded-lg border border-linkedin-border"
                >
                  Tải thêm bài viết
                </button>
              )}
              {posts.length === 0 && (
                <div className="text-center py-12 text-linkedin-muted">
                  <p className="text-lg">Chưa có bài viết nào</p>
                  <p className="text-sm mt-1">Hãy đăng bài đầu tiên!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right - Trending */}
        <div className="md:col-span-1">
          <TrendingSidebar />
        </div>
      </div>
    </MainLayout>
  );
};
export default HomePage;