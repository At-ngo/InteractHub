import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { postService } from '../services/postService';
import type { Post } from '../types';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!id) return;
      const res = await postService.getPost(Number(id));
      if (res.success) setPost(res.data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>;
  if (!post) return <MainLayout><p className="py-8 text-center">Không tìm thấy bài viết</p></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-lg border border-linkedin-border p-6">
          {/* If this post is a share, show the share message from the sharer (top) and then the original post full below */}
          {post.isShare ? (
            <div className="mb-4">
              <p className="text-sm text-linkedin-muted mb-2">📢 Đăng lại từ @{post.username}</p>
              <div className="text-sm whitespace-pre-wrap mb-4">{post.content}</div>
              {post.sharedPost && (
                <div className="border border-linkedin-border rounded-lg p-4 bg-linkedin-gray">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={post.sharedPost.avatarUrl} name={post.sharedPost.fullName} />
                    <div>
                      <p className="font-semibold">{post.sharedPost.fullName}</p>
                      <p className="text-xs text-linkedin-muted">@{post.sharedPost.username}</p>
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{post.sharedPost.content}</div>
                  {post.sharedPost.imageUrl && (
                    <img src={post.sharedPost.imageUrl} className="mt-3 w-full object-cover rounded" />
                  )}
                  <div className="mt-3 text-xs text-linkedin-muted">Xem bài gốc bằng cách nhấp vào avatar hoặc tên</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={post.avatarUrl} name={post.fullName} />
                <div>
                  <p className="font-semibold">{post.fullName}</p>
                  <p className="text-xs text-linkedin-muted">@{post.username}</p>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap">{post.content}</div>
              {post.imageUrl && <img src={post.imageUrl} className="mt-3 w-full object-cover rounded" />}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PostDetailPage;
