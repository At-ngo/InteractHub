import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUpload } from '../../hooks/useUpload';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import { messageService } from '../../services/messageService';

const BACKGROUNDS = [
  'linear-gradient(135deg, #0A66C2, #004182)',
  'linear-gradient(135deg, #E91E63, #9C27B0)',
  'linear-gradient(135deg, #FF6B35, #F7C59F)',
  'linear-gradient(135deg, #00BCD4, #009688)',
  'linear-gradient(135deg, #4CAF50, #8BC34A)',
  'linear-gradient(135deg, #FF5722, #FF9800)',
  'linear-gradient(135deg, #1D2226, #455A64)',
  'linear-gradient(135deg, #673AB7, #3F51B5)',
];

const StoriesBar = () => {
  const { user } = useAuth();
  const { uploadImage, uploading } = useUpload();
  const [stories, setStories] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [storyViews, setStoryViews] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [showStoryReactions, setShowStoryReactions] = useState(false);
  const [storyMessage, setStoryMessage] = useState('');
  const [storyViewCounts, setStoryViewCounts] = useState<Record<string, number>>({});

  // Create story states
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  

  useEffect(() => { loadStories(); }, []);

  useEffect(() => {
    if (!selectedStory) return;

    // Clear timer cũ
    if (timerRef.current) clearTimeout(timerRef.current);

    // Set timer mới 5 giây
    timerRef.current = setTimeout(() => {
      if (storyIndex < selectedStory.stories.length - 1) {
        setStoryIndex(prev => prev + 1);
      } else {
        setSelectedStory(null); // Hết story → đóng lại
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selectedStory, storyIndex]);

  const loadStories = async () => {
    try {
      const res = await api.get('/Stories');
      if (res.data.success) setStories(res.data.data);
    } catch {}
  };

  // When loading stories, if some belong to current user fetch view counts so owner can see counts on the bar
  useEffect(() => {
    const fetchViewCounts = async () => {
      if (!user) return;
      try {
        const res = await api.get('/Stories');
        if (!res.data.success) return;
        const data = res.data.data as any[];
        const myGroups = (Object.values(data.reduce((acc: any, s: any) => {
          if (!acc[s.userId]) acc[s.userId] = s;
          return acc;
        }, {})) as any[]).filter(g => g.userId === user?.userId);

        const counts: Record<string, number> = {};
        await Promise.all(myGroups.map(async (g: any) => {
          try {
            const firstStoryId = g.id || (g.stories && g.stories[0]?.id);
            if (!firstStoryId) return;
            const v = await api.get(`/Stories/${firstStoryId}/views`);
            if (v.data.success) counts[g.userId] = v.data.data.length;
          } catch {}
        }));
        setStoryViewCounts(counts);
      } catch {}
    };
    fetchViewCounts();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setStoryType('image');
  };

  const openStory = async (group: any) => {
    setSelectedStory(group);
    setStoryIndex(0);
    setStoryViews([]);
    if (group.stories[0]) {
      await api.post(`/Stories/${group.stories[0].id}/view`);
      // Load views nếu là chủ story
      if (group.userId === user?.userId) {
        const res = await api.get(`/Stories/${group.stories[0].id}/views`);
        if (res.data.success) setStoryViews(res.data.data);
      }
    }
  };

  // Trong nextStory
  const nextStory = async () => {
    if (storyIndex < selectedStory.stories.length - 1) {
      const nextIdx = storyIndex + 1;
      setStoryIndex(nextIdx);
      await api.post(`/Stories/${selectedStory.stories[nextIdx].id}/view`);
    } else {
      setSelectedStory(null);
    }
  };

  const handleCreateStory = async () => {
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const url = await uploadImage(imageFile, 'stories');
        if (url) imageUrl = url;
      }
      await api.post('/Stories', {
        textContent: textContent || undefined,
        imageUrl,
        background: storyType === 'text' ? selectedBg : undefined,
      });
      setShowCreateModal(false);
      setTextContent('');
      setImageFile(null);
      setImagePreview(null);
      setStoryType('text');
      loadStories();
    } finally {
      setPosting(false);
    }
  };

  // Group stories by user
  const groupedStories = stories.reduce((acc: Record<string, any>, story: any) => {
    const uid = story?.userId || 'unknown';
    if (!acc[uid]) {
      acc[uid] = {
        userId: uid,
        fullName: story?.fullName || 'Người dùng',
        avatarUrl: story?.avatarUrl,
        stories: [] as any[],
      };
    }
    acc[uid].stories.push(story);
    return acc;
  }, {} as Record<string, any>);
  const storyGroups = Object.values(groupedStories) as any[];

  const prevStory = () => {
    if (storyIndex > 0) setStoryIndex(storyIndex - 1);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-linkedin-border p-4 mb-3">
        <div className="flex gap-3 overflow-x-auto pb-1">

          {/* Create story button */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-linkedin-blue flex items-center justify-center hover:bg-linkedin-lightblue transition-colors">
              <span className="text-2xl text-linkedin-blue">+</span>
            </div>
            <span className="text-xs text-linkedin-muted w-16 text-center">Tạo story</span>
          </div>

          {/* Story groups */}
          {storyGroups.map((group: any) => (
            <div
              key={group.userId}
              onClick={() => openStory(group)}
              className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-linkedin-blue to-purple-500">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                  <Avatar src={group.avatarUrl} name={group.fullName} size="md" />
                </div>
              </div>
              <div className="text-xs text-linkedin-muted w-16 text-center truncate">
                <div>{group.fullName?.split(' ').pop()}</div>
                {group.userId === user?.userId && storyViewCounts[group.userId] !== undefined && (
                  <div className="text-[10px] text-linkedin-blue">{storyViewCounts[group.userId]} lượt xem</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE STORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-linkedin-border">
              <h3 className="font-bold text-lg">Tạo story</h3>
              <button onClick={() => {
                setShowCreateModal(false);
                setTextContent('');
                setImageFile(null);
                setImagePreview(null);
                setStoryType('text');
              }} className="text-linkedin-muted hover:text-linkedin-text text-2xl leading-none">×</button>
            </div>

            {/* Type selector */}
            <div className="flex border-b border-linkedin-border">
              <button
                onClick={() => setStoryType('text')}
                className={`flex-1 py-3 text-sm font-medium ${storyType === 'text' ? 'text-linkedin-blue border-b-2 border-linkedin-blue' : 'text-linkedin-muted'}`}
              >
                📝 Văn bản
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 py-3 text-sm font-medium ${storyType === 'image' ? 'text-linkedin-blue border-b-2 border-linkedin-blue' : 'text-linkedin-muted'}`}
              >
                🖼️ Ảnh
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Preview */}
            <div className="p-4">
              {storyType === 'text' ? (
                <div
                  className="w-full h-72 rounded-xl flex flex-col items-center justify-center p-6 relative"
                  style={{ background: selectedBg }}
                >
                  {textContent ? (
                    <p className="text-white text-xl font-semibold text-center leading-relaxed">
                      {textContent}
                    </p>
                  ) : (
                    <p className="text-white text-opacity-50 text-base">Nhập nội dung bên dưới...</p>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <Avatar src={user?.avatarUrl} name={user?.fullName || ''} size="sm" />
                    <span className="text-white text-xs font-medium">{user?.fullName}</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-72 rounded-xl overflow-hidden bg-black flex items-center justify-center relative">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} className="w-full h-full object-cover" />
                      {textContent && (
                        <div className="absolute bottom-8 left-0 right-0 text-center">
                          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            {textContent}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <Avatar src={user?.avatarUrl} name={user?.fullName || ''} size="sm" />
                        <span className="text-white text-xs font-medium">{user?.fullName}</span>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white text-center"
                    >
                      <p className="text-4xl mb-2">🖼️</p>
                      <p className="text-sm">Chọn ảnh</p>
                    </button>
                  )}
                </div>
              )}

              {/* Text input */}
              <input
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder={storyType === 'text' ? 'Nhập nội dung story...' : 'Thêm chú thích (tuỳ chọn)...'}
                className="w-full mt-3 px-4 py-2 border border-linkedin-border rounded-full text-sm focus:outline-none focus:border-linkedin-blue"
              />

              {/* Background selector (text only) */}
              {storyType === 'text' && (
                <div className="mt-3">
                  <p className="text-xs text-linkedin-muted mb-2">Chọn nền:</p>
                  <div className="flex gap-2 flex-wrap">
                    {BACKGROUNDS.map((bg, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedBg(bg)}
                        className={`w-8 h-8 rounded-full border-2 ${selectedBg === bg ? 'border-linkedin-blue scale-110' : 'border-transparent'} transition-all`}
                        style={{ background: bg }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Post button */}
              <button
                onClick={handleCreateStory}
                disabled={posting || uploading || (!textContent.trim() && !imageFile)}
                className="w-full mt-4 py-2.5 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-linkedin-darkblue disabled:opacity-50"
              >
                {uploading ? '⏳ Đang tải ảnh...' : posting ? 'Đang đăng...' : 'Đăng story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW STORY MODAL */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="relative w-full max-w-sm h-screen max-h-screen flex flex-col">

            {/* Progress bar */}
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {selectedStory.stories.map((_: any, i: number) => (
                <div key={i} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  {i < storyIndex && (
                    <div className="h-full w-full bg-white rounded-full" />
                  )}
                  {i === storyIndex && (
                    <div
                      key={`progress-${storyIndex}`}
                      className="h-full bg-white rounded-full animate-progress"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3">
              {/* Progress bars */}
              <div className="flex gap-1 mb-3">
                {selectedStory.stories.map((_: any, i: number) => (
                  <div key={i} className="flex-1 h-1 bg-white bg-opacity-40 rounded-full overflow-hidden">
                    {i < storyIndex && <div className="h-full w-full bg-white rounded-full" />}
                    {i === storyIndex && (
                      <div
                        key={`progress-${storyIndex}`}
                        className="h-full rounded-full"
                        style={{ backgroundColor: '#FFFFFF', animation: 'progress 5s linear forwards' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* User info row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={selectedStory.avatarUrl} name={selectedStory.fullName} size="sm" />
                  <div>
                    <span className="text-white text-sm font-medium">{selectedStory.fullName}</span>
                    <p className="text-white text-opacity-60 text-xs">
                      {(() => {
                        const story = selectedStory.stories[storyIndex];
                        const diff = new Date(story.expiresAt).getTime() - Date.now();
                        const hours = Math.floor(diff / 3600000);
                        const mins = Math.floor((diff % 3600000) / 60000);
                        if (hours > 0) return `Còn ${hours}h ${mins}p`;
                        return `Còn ${mins} phút`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* 3 chấm */}
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setShowStoryMenu(!showStoryMenu); }}
                      className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 text-lg font-bold"
                    >
                      ⋯
                    </button>
                    {showStoryMenu && (
                      <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl overflow-hidden min-w-48 z-30">
                        {/* Nhắc đến - chỉ hiện với story của mình */}
                        {selectedStory.stories[storyIndex]?.userId === user?.userId && (
                          <button
                            onClick={async e => {
                              e.stopPropagation();
                              setShowStoryMenu(false);
                              setShowMentionModal(true);
                            }}
                            className="w-full px-4 py-3 text-sm text-linkedin-text hover:bg-linkedin-gray text-left flex items-center gap-3 border-b border-linkedin-border"
                          >
                            <span>👥</span>
                            <span>Nhắc đến bạn bè</span>
                          </button>
                        )}
                        {/* Xóa - chỉ hiện nếu là owner */}
                        {selectedStory.stories[storyIndex]?.userId === user?.userId && (
                          <button
                            onClick={async e => {
                              e.stopPropagation();
                              if (confirm('Xóa story này?')) {
                                await api.delete(`/Stories/${selectedStory.stories[storyIndex].id}`);
                                loadStories();
                                setSelectedStory(null);
                              }
                              setShowStoryMenu(false);
                            }}
                            className="w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 text-left flex items-center gap-3"
                          >
                            <span>🗑</span>
                            <span>Xóa story</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nút X đóng */}
                  <button
                    onClick={() => { setSelectedStory(null); setShowStoryMenu(false); }}
                    className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Story content */}
            {(() => {
              const story = selectedStory.stories[storyIndex];
              return (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: story.background || '#1D2226' }}
                >
                  {story.imageUrl ? (
                    <img src={story.imageUrl} className="w-full h-full object-cover" />
                  ) : null}
                  {story.textContent && (
                    <div className={`${story.imageUrl ? 'absolute bottom-20' : ''} text-center px-8`}>
                      <p className="text-white text-2xl font-bold leading-relaxed">{story.textContent}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bottom bar — cảm xúc + gửi tin nhắn */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              {selectedStory.stories[storyIndex]?.userId === user?.userId ? (
                // Chủ story: xem lượt xem
                <button
                  onClick={async () => {
                    const res = await api.get(`/Stories/${selectedStory.stories[storyIndex].id}/views`);
                    if (res.data.success) setStoryViews(res.data.data);
                    setShowViewers(true);
                  }}
                  className="flex items-center gap-2 text-white text-sm bg-black bg-opacity-40 px-4 py-2 rounded-full"
                >
                  <span>👁</span>
                  <span>{storyViews.length} lượt xem</span>
                </button>
              ) : (
                // Người xem: thả cảm xúc + nhắn tin
                <div className="flex items-center gap-2">
                  {/* Reaction picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStoryReactions(!showStoryReactions)}
                      className="text-white bg-black bg-opacity-40 px-3 py-2 rounded-full text-lg"
                    >
                      {showStoryReactions ? '×' : '😊'}
                    </button>
                    {showStoryReactions && (
                      <div className="absolute bottom-12 left-0 bg-white rounded-full px-2 py-1 flex gap-1 shadow-lg">
                        {[
                          { type: 'like', emoji: '👍' },
                          { type: 'love', emoji: '❤️' },
                          { type: 'celebrate', emoji: '👏' },
                          { type: 'support', emoji: '🤝' },
                          { type: 'funny', emoji: '😄' },
                        ].map(r => (
                          <button key={r.type}
                            onClick={async () => {
                              await api.post(`/Stories/${selectedStory.stories[storyIndex].id}/react`, {
                                reactionType: r.type
                              });
                              setShowStoryReactions(false);
                            }}
                            className="w-9 h-9 text-xl hover:scale-125 transition-transform flex items-center justify-center">
                            {r.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nhắn tin */}
                  <div className="flex-1 flex gap-2">
                    <input
                      value={storyMessage}
                      onChange={e => setStoryMessage(e.target.value)}
                      placeholder="Gửi tin nhắn cho người đăng..."
                      className="flex-1 px-3 py-2 rounded-full text-sm bg-black bg-opacity-30 placeholder-white text-white focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        const targetUserId = selectedStory.stories[storyIndex].userId;
                        const storyId = selectedStory.stories[storyIndex].id;
                        const res = await messageService.getOrCreateConversation(targetUserId);
                        if (res.success) {
                          // Send a message that includes a reference to the story and the user's message
                          const storyText = selectedStory.stories[storyIndex].textContent
                            ? `"${selectedStory.stories[storyIndex].textContent}"`
                            : selectedStory.stories[storyIndex].imageUrl ? '[Ảnh story]' : '[Story]';
                          const content = `${storyMessage || ''}\n\nVề story: ${storyText} (id: ${storyId})`;
                          await messageService.sendMessage(res.data.id, content);
                          setStoryMessage('');
                          // Navigate to conversation
                          window.location.href = `/messaging?userId=${targetUserId}`;
                        }
                      }}
                      className="px-3 py-2 bg-linkedin-blue text-white rounded-full text-sm"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MENTION MODAL */}
            {showMentionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowMentionModal(false)}>
                <div className="bg-white rounded-xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Nhắc đến bạn bè</h3>
                    <button onClick={() => setShowMentionModal(false)} className="text-linkedin-muted text-xl">×</button>
                  </div>
                  <input
                    value={mentionSearch}
                    onChange={async e => {
                      setMentionSearch(e.target.value);
                      if (e.target.value.trim().length >= 1) {
                        const res = await api.get(`/Users/search?q=${e.target.value}`);
                        if (res.data.success) setMentionResults(res.data.data.slice(0, 5));
                      } else {
                        setMentionResults([]);
                      }
                    }}
                    placeholder="Tìm tên bạn bè..."
                    className="w-full px-3 py-2 border border-linkedin-border rounded-full text-sm mb-3 focus:outline-none focus:border-linkedin-blue"
                  />
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {mentionResults.map((u: any) => (
                      <div key={u.id}
                        className="flex items-center justify-between p-2 hover:bg-linkedin-gray rounded-lg cursor-pointer"
                        onClick={async () => {
                          // Gửi notification cho user được nhắc đến
                          await api.post('/Notifications/mention', {
                            mentionedUserId: u.id,
                            storyId: selectedStory.stories[storyIndex].id,
                            message: `${user?.fullName} đã nhắc đến bạn trong story`
                          });
                          setShowMentionModal(false);
                          setMentionSearch('');
                          setMentionResults([]);
                          alert(`Đã nhắc đến ${u.fullName}!`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatarUrl} name={u.fullName} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{u.fullName}</p>
                            <p className="text-xs text-linkedin-muted">@{u.username}</p>
                          </div>
                        </div>
                        <span className="text-linkedin-blue text-sm font-medium">Nhắc đến</span>
                      </div>
                    ))}
                    {mentionSearch.length > 0 && mentionResults.length === 0 && (
                      <p className="text-center text-linkedin-muted text-sm py-4">Không tìm thấy</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <button
              onClick={prevStory}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            />
            <button
              onClick={nextStory}
              className="absolute right-0 top-0 bottom-0 w-2/3 z-10"
            />

            {/* Close */}
            {/* <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-8 right-3 text-white text-2xl z-20"
            >×</button> */}
          </div>
        </div>
      )}

      {/* Viewers modal */}
      {showViewers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          onClick={() => setShowViewers(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-sm max-h-96 overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-linkedin-border flex justify-between">
              <h3 className="font-bold">👁 Người đã xem ({storyViews.length})</h3>
              <button onClick={() => setShowViewers(false)} className="text-linkedin-muted">×</button>
            </div>
            <div className="p-4 space-y-3">
              {storyViews.length === 0 ? (
                <p className="text-center text-linkedin-muted py-4">Chưa có ai xem</p>
              ) : storyViews.map((v: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={v.avatarUrl} name={v.fullName} size="sm" />
                    <p className="text-sm font-medium">{v.fullName}</p>
                  </div>
                  {v.reactionType && (
                    <span className="text-xl">
                      {v.reactionType === 'like' ? '👍' :
                      v.reactionType === 'love' ? '❤️' :
                      v.reactionType === 'celebrate' ? '👏' :
                      v.reactionType === 'support' ? '🤝' : '😄'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


    </>
  );
};
export default StoriesBar;