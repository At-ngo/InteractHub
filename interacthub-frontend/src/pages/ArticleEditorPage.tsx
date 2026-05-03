import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUpload } from '../hooks/useUpload';
import { postService } from '../services/postService';
import Avatar from '../components/common/Avatar';

const ArticleEditorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { uploadImage, uploading } = useUpload();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
    const url = await uploadImage(file, 'covers');
    if (url) setCoverImage(url);
  };

  const insertFormat = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      prefix + (selected || 'text') + suffix +
      content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected || 'text').length
      );
    }, 0);
  };

  const handlePublish = async () => {
    if (!title.trim() && !content.trim()) return;
    setLoading(true);
    try {
      const fullContent = title ? `# ${title}\n\n${content}` : content;
      const hashtags = (content.match(/#\w+/g) || []).map(h => h.slice(1));
      await postService.createPost({
        content: fullContent,
        imageUrl: coverImage || undefined,
        hashtags
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatButtons = [
    { label: 'B', title: 'Bold', prefix: '**', suffix: '**', style: 'font-bold' },
    { label: 'I', title: 'Italic', prefix: '_', suffix: '_', style: 'italic' },
    { label: 'H1', title: 'Heading 1', prefix: '\n# ', suffix: '' },
    { label: 'H2', title: 'Heading 2', prefix: '\n## ', suffix: '' },
    { label: '• List', title: 'Bullet List', prefix: '\n- ', suffix: '' },
    { label: '1. List', title: 'Numbered List', prefix: '\n1. ', suffix: '' },
    { label: '❝', title: 'Quote', prefix: '\n> ', suffix: '' },
    { label: '`code`', title: 'Code', prefix: '`', suffix: '`' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-linkedin-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-linkedin-blue font-bold text-2xl">
            <span className="bg-linkedin-blue text-white px-2 py-1 rounded text-lg">in</span>
          </button>
          <div className="flex items-center gap-2">
            <Avatar src={user?.avatarUrl} name={user?.fullName || ''} size="sm" />
            <div>
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-linkedin-muted">Bài viết cá nhân</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm text-linkedin-muted hover:bg-linkedin-gray rounded-full"
          >
            Hủy
          </button>
          <button
            onClick={handlePublish}
            disabled={loading || uploading || (!title.trim() && !content.trim())}
            className="px-5 py-2 bg-linkedin-blue text-white text-sm rounded-full font-semibold hover:bg-linkedin-darkblue disabled:opacity-50"
          >
            {loading ? 'Đang đăng...' : 'Đăng bài →'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">

        {/* Cover image */}
        <div className="mb-6">
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          {coverPreview ? (
            <div className="relative">
              <img src={coverPreview} className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70"
              >×</button>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-linkedin-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-linkedin-blue hover:bg-linkedin-lightblue transition-colors"
            >
              <span className="text-3xl">🖼️</span>
              <span className="text-sm text-linkedin-muted">Thêm ảnh bìa cho bài viết</span>
              <span className="text-xs text-linkedin-blue font-medium">Tải lên từ máy tính</span>
            </button>
          )}
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Chức danh"
          className="w-full text-3xl font-bold text-linkedin-text placeholder-gray-300 border-none outline-none mb-4 resize-none"
        />

        <div className="border-t border-linkedin-border pt-4">
          {/* Formatting toolbar */}
          <div className="flex flex-wrap gap-1 mb-3 p-2 bg-linkedin-gray rounded-lg">
            {formatButtons.map(btn => (
              <button
                key={btn.label}
                title={btn.title}
                onClick={() => insertFormat(btn.prefix, btn.suffix)}
                className={`px-3 py-1.5 text-sm rounded hover:bg-white hover:shadow-sm transition-all ${btn.style || ''} text-linkedin-text`}
              >
                {btn.label}
              </button>
            ))}
            <div className="w-px bg-linkedin-border mx-1" />
            <button
              title="Thêm ảnh vào nội dung"
              onClick={() => {
                const url = prompt('Nhập URL ảnh:');
                if (url) insertFormat(`\n![image](${url})`, '');
              }}
              className="px-3 py-1.5 text-sm rounded hover:bg-white hover:shadow-sm transition-all text-linkedin-text"
            >
              🖼️
            </button>
            <button
              title="Thêm link"
              onClick={() => {
                const url = prompt('Nhập URL:');
                if (url) insertFormat('[', `](${url})`);
              }}
              className="px-3 py-1.5 text-sm rounded hover:bg-white hover:shadow-sm transition-all text-linkedin-text"
            >
              🔗
            </button>
            <button
              title="Kẻ ngang"
              onClick={() => setContent(prev => prev + '\n\n---\n\n')}
              className="px-3 py-1.5 text-sm rounded hover:bg-white hover:shadow-sm transition-all text-linkedin-text"
            >
              —
            </button>
          </div>

          {/* Content textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Viết ở đây. Bạn cũng có thể bao gồm @mentions và #hashtag..."
            className="w-full min-h-96 text-base text-linkedin-text placeholder-gray-300 border-none outline-none resize-none leading-relaxed"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif' }}
          />
        </div>

        {/* Preview toggle */}
        {content && (
          <div className="mt-6 pt-4 border-t border-linkedin-border">
            <p className="text-xs text-linkedin-muted mb-2">Xem trước (Markdown):</p>
            <div className="p-4 bg-linkedin-gray rounded-lg text-sm text-linkedin-text whitespace-pre-wrap leading-relaxed">
              {title && <h1 className="text-2xl font-bold mb-3">{title}</h1>}
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ArticleEditorPage;