import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types';
import { postService } from '../../services/postService';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import api from '../../services/api';
import { REACTION_HOVER_DELAY_MS, REACTION_HIDE_DELAY_MS } from '../../config/constants';

interface PostCardProps {
  post: Post;
  onDeleted?: (id: number) => void;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Thích' },
  { type: 'celebrate', emoji: '👏', label: 'Hoan hô' },
  { type: 'support', emoji: '🤝', label: 'Ủng hộ' },
  { type: 'love', emoji: '❤️', label: 'Yêu thích' },
  { type: 'insightful', emoji: '💡', label: 'Có ích' },
  { type: 'funny', emoji: '😄', label: 'Hài hước' },
];

const COMMENT_REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'celebrate', emoji: '👏' },
  { type: 'support', emoji: '🤝' },
  { type: 'love', emoji: '❤️' },
  { type: 'insightful', emoji: '�' },
  { type: 'funny', emoji: '😄' },
];

const REACTION_LABELS: Record<string, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Thích' },
  love: { emoji: '❤️', label: 'Yêu thích' },
  celebrate: { emoji: '👏', label: 'Hoan hô' },
  funny: { emoji: '😄', label: 'Hài hước' },
  support: { emoji: '🤝', label: 'Ủng hộ' },
  insightful: { emoji: '💡', label: 'Có ích' },
};

const PostCard: React.FC<PostCardProps> = ({ post, onDeleted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [currentReaction, setCurrentReaction] = useState<string | null>(post.isLikedByCurrentUser ? 'like' : null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReactionsList, setShowReactionsList] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);
  const [commentReactors, setCommentReactors] = useState<any[]>([]);
  const [showCommentReactorsFor, setShowCommentReactorsFor] = useState<number | null>(null);
  const [commentPickerFor, setCommentPickerFor] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const commentPickerTimer = useRef<any>(null);
  const [saved, setSaved] = useState(false);
  const [commentPermission, setCommentPermission] = useState(post.commentPermission || 'everyone');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reactionTimer = useRef<any>(null);

  useEffect(() => {
    const checkSaved = async () => {
      try {
        const res = await api.get('/Posts/saved');
        if (res.data.success) setSaved(res.data.data.some((p: any) => p.id === post.id));
      } catch {}
    };
    checkSaved();

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [post.id]);

  const handleReaction = async (reactionType: string) => {
    setShowReactions(false);
    try {
      await api.post(`/Posts/${post.id}/like`, { reactionType });
      if (currentReaction === reactionType) {
        setCurrentReaction(null);
        setLikeCount((c) => c - 1);
      } else {
        if (!currentReaction) setLikeCount((c) => c + 1);
        setCurrentReaction(reactionType);
      }
    } catch {}
  };

  const handleLoadComments = async () => {
    if (!showComments) {
      const res = await postService.getComments(post.id);
      if (res.success) setComments(res.data);
    }
    setShowComments((s) => !s);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (replyingTo) {
      await api.post(`/Posts/${post.id}/comments/${replyingTo.id}/reply`, { content: newComment.replace(`@${replyingTo.username} `, '') });
      setReplyingTo(null);
    } else {
      await postService.addComment(post.id, newComment);
    }
    const res = await postService.getComments(post.id);
    if (res.success) setComments(res.data);
    setNewComment('');
  };

  const handleDelete = async () => {
    // open modal instead of browser confirm
    setShowDeletePostModal(true);
  };

  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [showDeleteCommentModalFor, setShowDeleteCommentModalFor] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');

  const confirmDeletePost = async () => {
    try {
      await postService.deletePost(post.id);
      onDeleted?.(post.id);
      setShowMenu(false);
    } catch (e) {
      alert('Xóa bài viết thất bại');
    } finally {
      setShowDeletePostModal(false);
    }
  };

  const handleSave = async () => {
    const res = await api.post(`/Posts/${post.id}/save`);
    if (res.data.success) {
      if (typeof res.data.data === 'boolean') setSaved(res.data.data);
      else if (res.data.data && typeof res.data.data.saved === 'boolean') setSaved(res.data.data.saved);
      else setSaved((s) => !s);
    }
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setShowMenu(false);
    alert('Đã sao chép liên kết!');
  };

  const handleShare = () => { setShowShareModal(true); setShowMenu(false); };
  const handleConfirmShare = async () => {
    await postService.createPost({ content: shareMessage || '', imageUrl: post.imageUrl, hashtags: post.hashtags, sharedPostId: post.id });
    setShowShareModal(false); setShareMessage(''); alert('Đã đăng lại!');
  };

  const handleSendMessage = async () => {
    const res = await messageService.getOrCreateConversation(post.userId);
    if (res.success) {
      await messageService.sendMessage(res.data.id, `Tôi muốn hỏi về bài viết của bạn: "${post.content.slice(0,50)}..."`);
      navigate(`/messaging?userId=${post.userId}`);
    }
    setShowMenu(false);
  };

  const handleLoadReactions = async () => {
    const res = await api.get(`/Posts/${post.id}/reactions`);
    if (res.data.success) setReactions(res.data.data);
    setShowReactionsList(true);
  };

  // React to a comment
  const handleReactComment = async (commentId: number, reactionType = 'like') => {
    try {
      await api.post(`/Posts/${post.id}/comments/${commentId}/react`, { reactionType });
      // refresh comments so UI updates (counts/reactions)
      const res = await postService.getComments(post.id);
      if (res.success) setComments(res.data);
    } catch (e) {
      // ignore for now
    }
  };

  // Load who reacted to a comment and open modal
  const handleShowCommentReactors = async (commentId: number) => {
    try {
      // Controller exposes GET /Posts/comments/{commentId}/reactors
      const res = await api.get(`/Posts/comments/${commentId}/reactors`);
      if (res.data.success) setCommentReactors(res.data.data);
      setShowCommentReactorsFor(commentId);
    } catch (e) {
      setCommentReactors([]);
      setShowCommentReactorsFor(commentId);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    // open modal for this comment id
    setShowDeleteCommentModalFor(commentId);
  };

  const confirmDeleteComment = async (commentId: number) => {
    try {
      await api.delete(`/Posts/${post.id}/comments/${commentId}`);
      const res = await postService.getComments(post.id);
      if (res.success) setComments(res.data);
    } catch (e) {
      alert('Xóa bình luận thất bại');
    } finally {
      setShowDeleteCommentModalFor(null);
    }
  };

  const startEdit = () => { setEditing(true); setShowMenu(false); setEditContent(post.content || ''); };

  const submitEdit = async () => {
    try {
      await api.put(`/Posts/${post.id}`, { content: editContent, imageUrl: post.imageUrl });
      // update local content for UI
      post.content = editContent;
      setEditing(false);
    } catch (e) {
      alert('Cập nhật bài viết thất bại');
    }
  };

  const openReportModal = (type: string, id: string | number) => {
    setReportTarget({ type, id: String(id) });
    setReportReason('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    if (!reportReason.trim()) { alert('Vui lòng nhập lý do'); return; }
    try {
      const dto = { type: reportTarget.type, entityId: reportTarget.id, reason: reportReason };
      await api.post('/Reports', dto);
      setShowReportModal(false);
      alert('Cảm ơn, báo cáo đã được gửi');
    } catch (e) {
      alert('Gửi báo cáo thất bại');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff/60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins/60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours/24)} ngày trước`;
  };

  return (
    <div className="bg-white rounded-lg border border-linkedin-border mb-3">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.userId}`)}>
          <Avatar src={post.avatarUrl} name={post.fullName} />
          <div>
            <p className="font-semibold text-sm text-linkedin-text hover:text-linkedin-blue hover:underline">{post.fullName}</p>
            <p className="text-xs text-linkedin-muted">@{post.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </div>

        <div className="relative" ref={menuRef as any}>
          <button onClick={() => setShowMenu((s) => !s)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-linkedin-gray text-linkedin-muted text-lg">···</button>
          {showMenu && (
            <div className="absolute right-0 top-9 bg-white border border-linkedin-border rounded-xl shadow-lg z-20 min-w-48 overflow-hidden">
              <button onClick={handleSave} className="w-full px-4 py-3 text-sm text-left hover:bg-linkedin-gray flex items-center gap-3 border-b border-linkedin-border">
                <span>{saved ? '🔖' : '📌'}</span>
                <span>{saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}</span>
              </button>
              <button onClick={handleCopyLink} className="w-full px-4 py-3 text-sm text-left hover:bg-linkedin-gray flex items-center gap-3 border-b border-linkedin-border">
                <span>🔗</span>
                <span>Sao chép liên kết</span>
              </button>
              <button onClick={handleShare} className="w-full px-4 py-3 text-sm text-left hover:bg-linkedin-gray flex items-center gap-3 border-b border-linkedin-border">
                <span>🔄</span>
                <span>Đăng lại</span>
              </button>
              {user?.userId !== post.userId && (
                <>
                  <button onClick={handleSendMessage} className="w-full px-4 py-3 text-sm text-left hover:bg-linkedin-gray flex items-center gap-3 border-b border-linkedin-border">
                    <span>💬</span>
                    <span>Gửi tin nhắn về bài viết</span>
                  </button>
                  <button onClick={() => openReportModal('post', post.id)} className="w-full px-4 py-3 text-sm text-left hover:bg-linkedin-gray flex items-center gap-3 border-b border-linkedin-border">
                    <span>🚩</span>
                    <span>Báo cáo bài viết</span>
                  </button>
                </>
              )}
              {user?.userId === post.userId && (
                <>
                  <button onClick={startEdit} className="w-full px-4 py-3 text-sm text-left hover:bg-linkedin-gray flex items-center gap-3 border-b border-linkedin-border">
                    <span>✏️</span>
                    <span>Chỉnh sửa bài viết</span>
                  </button>
                  <div className="border-t border-linkedin-border">
                    <p className="px-4 pt-2 text-xs text-linkedin-muted font-medium">Ai có thể bình luận?</p>
                    {[{value:'everyone',label:'🌐 Mọi người'},{value:'connections',label:'👥 Kết nối'},{value:'none',label:'🚫 Không ai'}].map(opt => (
                      <button key={opt.value} onClick={async () => { await api.put(`/Posts/${post.id}/comment-permission`, { permission: opt.value }); setCommentPermission(opt.value); setShowMenu(false); }}
                        className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-linkedin-gray ${commentPermission === opt.value ? 'text-linkedin-blue font-semibold' : ''}`}>
                        {opt.label}
                        {commentPermission === opt.value && <span className="ml-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleDelete} className="w-full px-4 py-3 text-sm text-left text-red-500 hover:bg-red-50 flex items-center gap-3 border-t border-linkedin-border">
                    <span>🗑</span>
                    <span>Xóa bài viết</span>
                  </button>
                </>
              )}
            </div>
          )}
  </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
        {post.isShare ? (
          <>
            {post.content && (<div className="mb-3 text-sm text-linkedin-text whitespace-pre-wrap">{post.content}</div>)}
            {post.sharedPost && (
              <div className="mb-3 border border-linkedin-border rounded-lg p-3 bg-linkedin-gray" onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.sharedPost!.id}`); }}>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={post.sharedPost.avatarUrl} name={post.sharedPost.fullName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{post.sharedPost.fullName}</p>
                    <p className="text-xs text-linkedin-muted">@{post.sharedPost.username}</p>
                  </div>
                </div>
                <p className="text-sm text-linkedin-text line-clamp-3">{post.sharedPost.content}</p>
                {post.sharedPost.imageUrl && (<img src={post.sharedPost.imageUrl} className="mt-2 w-full h-40 object-cover rounded" />)}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-linkedin-text whitespace-pre-wrap">{post.content}</p>
        )}

        {post.hashtags?.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{post.hashtags.map(tag => (<span key={tag} className="text-linkedin-blue text-xs">#{tag}</span>))}</div>)}
      </div>

      {/* Image */}
      {post.imageUrl && (<img src={post.imageUrl} alt="post" className="w-full max-h-96 object-cover" />)}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-linkedin-border text-xs text-linkedin-muted">
        <button onClick={handleLoadReactions} className="hover:underline flex items-center gap-1"><span>👍❤️💡</span><span>{likeCount} cảm xúc</span></button>
        <button onClick={handleLoadComments} className="hover:underline">{post.commentCount} bình luận</button>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex border-t border-linkedin-border">
        <div className="flex-1 relative" onMouseEnter={() => { clearTimeout(reactionTimer.current); reactionTimer.current = setTimeout(() => setShowReactions(true), REACTION_HOVER_DELAY_MS); }} onMouseLeave={(e) => { clearTimeout(reactionTimer.current); const related = e.relatedTarget as Node; const picker = document.getElementById(`picker-${post.id}`); if (picker && picker.contains(related)) return; reactionTimer.current = setTimeout(() => setShowReactions(false), REACTION_HIDE_DELAY_MS); }}>
          <button onClick={() => handleReaction(currentReaction || 'like')} className={`w-full py-2 text-sm font-medium rounded flex items-center justify-center gap-1 ${currentReaction ? 'text-linkedin-blue bg-linkedin-faint' : 'text-linkedin-muted hover:bg-linkedin-gray'}`}>
            <span>{currentReaction ? (REACTION_LABELS[currentReaction]?.emoji ?? '👍') : '👍'}</span>
            <span>{currentReaction ? (REACTION_LABELS[currentReaction]?.label ?? 'Thích') : 'Thích'}</span>
          </button>
          {showReactions && (
            <div id={`picker-${post.id}`} className="absolute bottom-10 left-0 bg-white border border-linkedin-border rounded-full shadow-lg px-2 py-1 flex gap-1 z-10" onMouseEnter={() => clearTimeout(reactionTimer.current)} onMouseLeave={() => { reactionTimer.current = setTimeout(() => setShowReactions(false), 200); }}>
              {REACTIONS.map(r => (<button key={r.type} onClick={() => handleReaction(r.type)} title={r.label} className="w-9 h-9 text-xl hover:scale-125 transition-transform flex items-center justify-center rounded-full hover:bg-linkedin-gray">{r.emoji}</button>))}
            </div>
          )}
        </div>

        <button onClick={handleLoadComments} className="flex-1 py-2 text-sm font-medium text-linkedin-muted rounded hover:bg-linkedin-gray flex items-center justify-center gap-1"><span>💬</span><span>Bình luận</span></button>

        <button onClick={handleShare} className="flex-1 py-2 text-sm font-medium text-linkedin-muted rounded hover:bg-linkedin-gray flex items-center justify-center gap-1"><span>🔄</span><span>Đăng lại</span></button>

        {user?.userId !== post.userId && (<button onClick={handleSendMessage} className="flex-1 py-2 text-sm font-medium text-linkedin-muted rounded hover:bg-linkedin-gray flex items-center justify-center gap-1"><span>✉️</span><span>Gửi</span></button>)}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-linkedin-border">
          {commentPermission === 'none' && user?.userId !== post.userId ? (
            <p className="text-center text-linkedin-muted text-sm py-3">🚫 Bài viết này đã tắt bình luận</p>
          ) : commentPermission === 'connections' && user?.userId !== post.userId ? (
            <p className="text-center text-linkedin-muted text-sm py-3">👥 Chỉ kết nối mới được bình luận</p>
          ) : (
            <div className="mt-3">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 text-xs text-linkedin-muted px-1">
                  <span>Đang trả lời <span className="text-linkedin-blue font-medium">@{replyingTo.username}</span></span>
                  <button onClick={() => { setReplyingTo(null); setNewComment(''); }} className="text-red-400 hover:text-red-600">×</button>
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={replyingTo ? `Trả lời @${replyingTo.username}...` : "Viết bình luận..."} className="flex-1 px-3 py-2 text-sm border border-linkedin-border rounded-full bg-linkedin-gray focus:outline-none focus:border-linkedin-blue" />
                <button type="submit" className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full hover:bg-linkedin-darkblue">Gửi</button>
              </form>

              <div className="mt-3 space-y-3">
                {comments.map(c => (
                  <div key={c.id}>
                    <div className="flex gap-2">
                      <Avatar src={c.avatarUrl} name={c.username} size="sm" />
                      <div className="flex-1">
                        <div className="bg-linkedin-gray rounded-lg px-3 py-2 cursor-pointer" onClick={() => navigate(`/profile/${c.userId}`)}>
                          <p className="text-xs font-semibold hover:underline">{c.username}</p>
                          <p className="text-sm">{c.content}</p>
                        </div>

                        {/* comment actions: reply / react / view reactors */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-linkedin-muted">
                          <div className="relative">
                            <button
                              onMouseEnter={() => { clearTimeout(commentPickerTimer.current); setCommentPickerFor(c.id); }}
                              onMouseLeave={() => { commentPickerTimer.current = setTimeout(() => setCommentPickerFor(null), 250); }}
                              aria-label="Thả cảm xúc"
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${c.userReaction ? 'text-linkedin-blue bg-linkedin-faint' : 'hover:bg-linkedin-gray'}`}
                            >
                              <span className="text-lg">{c.userReaction ? (REACTION_LABELS[c.userReaction]?.emoji ?? '👍') : '👍'}</span>
                              {c.userReaction && <span className="ml-1">{REACTION_LABELS[c.userReaction]?.label ?? 'Thích'}</span>}
                            </button>
                            {commentPickerFor === c.id && (
                              <div className="absolute left-0 bottom-8 bg-white border border-linkedin-border rounded-full shadow-lg px-2 py-1 flex gap-1 z-10" onMouseEnter={() => clearTimeout(commentPickerTimer.current)} onMouseLeave={() => { commentPickerTimer.current = setTimeout(() => setCommentPickerFor(null), 200); }}>
                                {COMMENT_REACTIONS.map(r => (
                                  <button key={r.type} onClick={() => { handleReactComment(c.id, r.type); setCommentPickerFor(null); }} className="w-8 h-8 text-lg flex items-center justify-center rounded-full hover:bg-linkedin-gray">{r.emoji}</button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button onClick={() => { setReplyingTo({ id: c.id, username: c.username }); setNewComment(`@${c.username} `); setShowComments(true); }} className="hover:underline">Trả lời</button>
                          <button onClick={() => handleShowCommentReactors(c.id)} className="hover:underline">{c.reactionCount || 0} lượt • Xem ai thả cảm xúc</button>
                          {c.userId === user?.userId && (<button onClick={() => handleDeleteComment(c.id)} className="hover:underline text-red-500">Xóa</button>)}
                          {c.userId !== user?.userId && (<button onClick={() => openReportModal('comment', c.id)} className="hover:underline">Báo cáo</button>)}
                        </div>

                      </div>
                    </div>
                    {c.replies?.length > 0 && (
                      <div className="ml-10 mt-2 space-y-2">
                        {c.replies.map((r: any) => (
                          <div key={r.id} className="flex gap-2">
                            <Avatar src={r.avatarUrl} name={r.username} size="sm" />
                            <div className="flex-1">
                              <div className="bg-linkedin-gray rounded-lg px-3 py-2 cursor-pointer" onClick={() => navigate(`/profile/${r.userId}`)}>
                                <p className="text-xs font-semibold hover:underline">{r.username}</p>
                                <p className="text-sm">{r.content}</p>
                              </div>

                              <div className="flex items-center gap-3 mt-2 text-xs text-linkedin-muted">
                                  <div className="relative">
                                    <button
                                      onMouseEnter={() => { clearTimeout(commentPickerTimer.current); setCommentPickerFor(r.id); }}
                                      onMouseLeave={() => { commentPickerTimer.current = setTimeout(() => setCommentPickerFor(null), 250); }}
                                      aria-label="Thả cảm xúc"
                                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${r.userReaction ? 'text-linkedin-blue bg-linkedin-faint' : 'hover:bg-linkedin-gray'}`}
                                    >
                                      <span className="text-lg">{r.userReaction ? (REACTION_LABELS[r.userReaction]?.emoji ?? '👍') : '👍'}</span>
                                      {r.userReaction && <span className="ml-1">{REACTION_LABELS[r.userReaction]?.label ?? 'Thích'}</span>}
                                    </button>
                                    {commentPickerFor === r.id && (
                                      <div className="absolute left-0 bottom-8 bg-white border border-linkedin-border rounded-full shadow-lg px-2 py-1 flex gap-1 z-10" onMouseEnter={() => clearTimeout(commentPickerTimer.current)} onMouseLeave={() => { commentPickerTimer.current = setTimeout(() => setCommentPickerFor(null), 200); }}>
                                        {COMMENT_REACTIONS.map(rx => (
                                          <button key={rx.type} onClick={() => { handleReactComment(r.id, rx.type); setCommentPickerFor(null); }} className="w-8 h-8 text-lg flex items-center justify-center rounded-full hover:bg-linkedin-gray">{rx.emoji}</button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <button onClick={() => { setReplyingTo({ id: r.id, username: r.username }); setNewComment(`@${r.username} `); setShowComments(true); }} className="hover:underline">Trả lời</button>
                                  <button onClick={() => handleShowCommentReactors(r.id)} className="hover:underline">{r.reactionCount || 0} lượt • Xem ai thả cảm xúc</button>
                  {r.userId === user?.userId && (<button onClick={() => handleDeleteComment(r.id)} className="hover:underline text-red-500">Xóa</button>)}
                  {r.userId !== user?.userId && (<button onClick={() => openReportModal('comment', r.id)} className="hover:underline">Báo cáo</button>)}
                              </div>

                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report modal */}
      {showReportModal && reportTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-xl p-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Báo cáo {reportTarget.type}</h3>
            <p className="text-sm text-linkedin-muted mb-2">ID: {reportTarget.id}</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Mô tả lý do..." rows={4} className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mb-3" />
            <div className="flex gap-2"><button onClick={submitReport} className="flex-1 py-2 bg-linkedin-blue text-white rounded-full">Gửi báo cáo</button><button onClick={() => setShowReportModal(false)} className="flex-1 py-2 border border-linkedin-border rounded-full">Hủy</button></div>
          </div>
        </div>
      )}

      {/* Reactions list modal */}
      {showReactionsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowReactionsList(false)}>
          <div className="bg-white rounded-xl p-4 max-w-sm w-full mx-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Cảm xúc ({reactions.length})</h3>
              <button onClick={() => setShowReactionsList(false)} className="text-xl text-linkedin-muted">×</button>
            </div>
            <div className="space-y-3">
              {reactions.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setShowReactionsList(false); navigate(`/profile/${r.userId}`); }}>
                    <Avatar src={r.avatarUrl} name={r.fullName} size="sm" />
                    <p className="text-sm font-medium hover:underline">{r.fullName}</p>
                  </div>
                  <span className="text-xl">{REACTIONS.find(rx => rx.type === r.reactionType)?.emoji || '👍'}</span>
                </div>
              ))}
              {reactions.length === 0 && (<p className="text-center text-linkedin-muted py-4">Chưa có cảm xúc nào</p>)}
            </div>
          </div>
        </div>
      )}

      {/* Comment reactors modal */}
      {showCommentReactorsFor !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => { setShowCommentReactorsFor(null); setCommentReactors([]); }}>
          <div className="bg-white rounded-xl p-4 max-w-sm w-full mx-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Ai đã thả cảm xúc</h3>
              <button onClick={() => { setShowCommentReactorsFor(null); setCommentReactors([]); }} className="text-xl text-linkedin-muted">×</button>
            </div>
            <div className="space-y-3">
              {commentReactors.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setShowCommentReactorsFor(null); navigate(`/profile/${r.userId}`); }}>
                    <Avatar src={r.avatarUrl} name={r.fullName} size="sm" />
                    <p className="text-sm font-medium hover:underline">{r.fullName}</p>
                  </div>
                  <span className="text-xl">{COMMENT_REACTIONS.find(rx => rx.type === r.reactionType)?.emoji || '👍'}</span>
                </div>
              ))}
              {commentReactors.length === 0 && (<p className="text-center text-linkedin-muted py-4">Chưa có cảm xúc nào</p>)}
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-xl p-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Đăng lại bài viết</h3>
            <textarea value={shareMessage} onChange={e => setShareMessage(e.target.value)} placeholder="Thêm lời của bạn (tuỳ chọn)..." rows={3} className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mb-3 focus:outline-none focus:border-linkedin-blue resize-none" />
            <div className="border border-linkedin-border rounded-lg p-3 mb-3 bg-linkedin-gray">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Avatar src={post.avatarUrl} name={post.fullName} size="sm" /><div><p className="text-xs font-semibold">{post.fullName}</p><p className="text-xs text-linkedin-muted">@{post.username}</p></div></div>
                <div className="flex items-center gap-2"><button onClick={() => navigate(`/post/${post.id}`)} className="text-xs px-2 py-1 border border-linkedin-border rounded bg-white hover:bg-linkedin-gray">Xem bài gốc</button><button onClick={async () => { await postService.likePost(post.id); alert('Đã thả cảm xúc vào bài gốc'); }} className="text-xs px-2 py-1 border border-linkedin-border rounded bg-white hover:bg-linkedin-gray">Thả cảm xúc</button></div>
              </div>
              <p className="text-sm text-linkedin-text line-clamp-3">{post.content}</p>
              {post.imageUrl && (<img src={post.imageUrl} className="mt-2 w-full h-24 object-cover rounded" />)}
            </div>
            <div className="flex gap-2"><button onClick={handleConfirmShare} className="flex-1 py-2 bg-linkedin-blue text-white rounded-full text-sm font-semibold">Đăng lại</button><button onClick={() => setShowShareModal(false)} className="flex-1 py-2 border border-linkedin-border rounded-full text-sm">Hủy</button></div>
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Modal */}
      {showDeletePostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeletePostModal(false)}>
          <div className="bg-white rounded-xl p-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Xác nhận xóa bài viết</h3>
            <p className="text-sm text-linkedin-muted mb-4">Bạn có chắc muốn xóa bài viết này? Hành động này có thể không thể hoàn tác.</p>
            <div className="flex gap-2"><button onClick={confirmDeletePost} className="flex-1 py-2 bg-red-500 text-white rounded-full">Xóa</button><button onClick={() => setShowDeletePostModal(false)} className="flex-1 py-2 border border-linkedin-border rounded-full">Hủy</button></div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {showDeleteCommentModalFor !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteCommentModalFor(null)}>
          <div className="bg-white rounded-xl p-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Xác nhận xóa bình luận</h3>
            <p className="text-sm text-linkedin-muted mb-4">Bạn có chắc muốn xóa bình luận này?</p>
            <div className="flex gap-2"><button onClick={() => confirmDeleteComment(showDeleteCommentModalFor!)} className="flex-1 py-2 bg-red-500 text-white rounded-full">Xóa</button><button onClick={() => setShowDeleteCommentModalFor(null)} className="flex-1 py-2 border border-linkedin-border rounded-full">Hủy</button></div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-xl p-4 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Chỉnh sửa bài viết</h3>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={6} className="w-full border border-linkedin-border rounded-lg p-3 mb-3" />
            <div className="flex gap-2"><button onClick={submitEdit} className="flex-1 py-2 bg-linkedin-blue text-white rounded-full">Lưu</button><button onClick={() => setEditing(false)} className="flex-1 py-2 border border-linkedin-border rounded-full">Hủy</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;