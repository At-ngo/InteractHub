import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { postService } from '../../services/postService';
import { useUpload } from '../../hooks/useUpload';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';

interface Props { onCreated: () => void; }

const CreatePostCard = ({ onCreated }: Props) => {
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, uploadVideo, uploading } = useUpload();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setExpanded(true);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setExpanded(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !videoFile) return;
    setLoading(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const url = await uploadImage(imageFile, 'posts');
        if (url) imageUrl = url;
      }

      if (videoFile) {
        const url = await uploadVideo(videoFile);
        if (url) imageUrl = url; // dùng chung field
      }

      const hashtags = (content.match(/#\w+/g) || []).map(h => h.slice(1));

      await postService.createPost({ content, imageUrl, hashtags });

      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      setExpanded(false);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setExpanded(false);
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
  };

  return (
    <div className="bg-white rounded-lg border border-linkedin-border p-3 mb-3">
      {/* Top row */}
      <div className="flex gap-2 items-center mb-3">
        <Avatar src={user?.avatarUrl} name={user?.fullName || ''} />
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 text-left px-4 py-3 border border-linkedin-border rounded-full text-sm text-linkedin-muted hover:bg-linkedin-gray hover:border-linkedin-text transition-colors"
        >
          Bắt đầu bài viết
        </button>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="mt-2">
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Bạn muốn nói về điều gì? Dùng #hashtag để tag chủ đề"
            className="w-full p-3 border border-linkedin-border rounded-lg text-sm resize-none focus:outline-none focus:border-linkedin-blue min-h-28"
            rows={4}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-2">
              <img src={imagePreview} alt="preview" className="w-full max-h-64 object-cover rounded-lg" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 text-lg leading-none"
              >×</button>
            </div>
          )}

          {/* Video preview */}
          {videoPreview && (
            <div className="relative mt-2">
              <video src={videoPreview} controls className="w-full max-h-64 rounded-lg" />
              <button
                onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 text-lg leading-none"
              >×</button>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            {/* Upload buttons */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-2 text-sm text-linkedin-muted hover:bg-linkedin-gray rounded-lg"
              >
                🖼️ Thêm ảnh
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-2 text-sm text-linkedin-muted hover:bg-linkedin-gray rounded-lg"
              >
                🎥 Thêm video
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm text-linkedin-muted hover:bg-linkedin-gray rounded-full"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || uploading || (!content.trim() && !imageFile && !videoFile)}
                className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full hover:bg-linkedin-darkblue disabled:opacity-50 font-semibold"
              >
                {uploading ? '⏳ Đang tải...' : loading ? 'Đang đăng...' : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action buttons */}
      {!expanded && (
        <div className="flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
          />

          {[
            { icon: '🎥', label: 'Video', action: () => videoInputRef.current?.click() },
            { icon: '🖼️', label: 'Ảnh', action: () => fileInputRef.current?.click() },
            { icon: '📝', label: 'Viết bài', action: () => navigate('/article/new') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-2 px-4 py-2 text-sm text-linkedin-muted font-semibold hover:bg-linkedin-gray rounded-lg flex-1 justify-center"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatePostCard;