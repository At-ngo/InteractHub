import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useUpload } from '../hooks/useUpload';

const MessagingPage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const { uploadImage } = useUpload();
  const [showEmoji, setShowEmoji] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);
  

  useEffect(() => {
    loadConversations();
    const userId = searchParams.get('userId');
    if (userId) openConversationWithUser(userId);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConv) {
      // Poll messages mỗi 3 giây
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        loadMessages(selectedConv.id, false);
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedConv]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messageService.getConversations();
      if (res.success) setConversations(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: number, _showLoading = true) => {
    try {
      const res = await messageService.getMessages(convId);
      if (res.success) setMessages(res.data);
    } catch {}
  };

  const openConversationWithUser = async (userId: string) => {
    const res = await messageService.getOrCreateConversation(userId);
    if (res.success) {
      const profileRes = await userService.getProfile(userId);
      const conv = {
        id: res.data.id,
        isConnected: profileRes.success ? profileRes.data.isConnected : false,
        otherUser: profileRes.success ? {
          id: userId,
          fullName: profileRes.data.fullName,
          avatarUrl: profileRes.data.avatarUrl,
          userName: profileRes.data.username
        } : { id: userId, fullName: 'User', avatarUrl: null, userName: '' }
      };
      setSelectedConv(conv);
      await loadMessages(res.data.id);
      await loadConversations();
    }
  };

  const handleSelectConversation = async (conv: any) => {
    setSelectedConv(conv);
    await loadMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      await messageService.sendMessage(selectedConv.id, newMessage);
      setNewMessage('');
      await loadMessages(selectedConv.id);
      await loadConversations();
    } finally {
      setSending(false);
    }
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;
    const url = await uploadImage(file, 'messages');
    if (url) {
      await messageService.sendMessage(selectedConv.id, `📷 [Ảnh](${url})`);
      await loadMessages(selectedConv.id);
      await loadConversations();
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const res = await userService.searchUsers(q);
    if (res.success) setSearchResults(res.data.slice(0, 5));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins}p`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg border border-linkedin-border overflow-hidden flex" style={{ height: 'calc(100vh - 100px)' }}>

          {/* LEFT — Conversations list */}
          <div className="w-80 border-r border-linkedin-border flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-linkedin-border">
              <h2 className="text-lg font-bold text-linkedin-text mb-3">Nhắn tin</h2>
              {/* Search user */}
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm người dùng..."
                  className="w-full px-3 py-2 bg-linkedin-gray border border-linkedin-border rounded-full text-sm focus:outline-none focus:border-linkedin-blue"
                />
                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-10 left-0 right-0 bg-white border border-linkedin-border rounded-lg shadow-lg z-10">
                    {searchResults.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          openConversationWithUser(u.id);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="flex items-center gap-2 p-3 hover:bg-linkedin-gray cursor-pointer"
                      >
                        <Avatar src={u.avatarUrl} name={u.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{u.fullName}</p>
                          <p className="text-xs text-linkedin-muted">@{u.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? <LoadingSpinner /> : (
                conversations.length === 0 ? (
                  <div className="p-4 text-center text-linkedin-muted text-sm">
                    <p className="text-2xl mb-2">💬</p>
                    <p>Chưa có cuộc trò chuyện nào</p>
                    <p className="mt-1">Tìm kiếm người dùng để bắt đầu!</p>
                  </div>
                ) : (
                  conversations.map((conv: any) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-linkedin-gray border-b border-linkedin-border transition-colors ${selectedConv?.id === conv.id ? 'bg-linkedin-lightblue' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div onClick={() => navigate(`/profile/${conv.otherUser.id}`)} className="cursor-pointer">
                          <Avatar src={conv.otherUser.avatarUrl} name={conv.otherUser.fullName} size="md" />
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p onClick={() => navigate(`/profile/${conv.otherUser.id}`)} className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold' : 'font-medium'} cursor-pointer hover:underline`}>
                            {conv.otherUser.fullName}
                          </p>
                          {conv.lastMessage && (
                            <span className="text-xs text-linkedin-muted flex-shrink-0 ml-1">
                              {timeAgo(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-linkedin-text font-semibold' : 'text-linkedin-muted'}`}>
                            {conv.lastMessage.senderId === currentUser?.userId ? 'Bạn: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* RIGHT — Chat window */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-linkedin-border flex items-center gap-3">
                  <div onClick={() => navigate(`/profile/${selectedConv.otherUser.id}`)} className="cursor-pointer flex items-center gap-3">
                    <Avatar src={selectedConv.otherUser.avatarUrl} name={selectedConv.otherUser.fullName} />
                    <div>
                      <p className="font-semibold text-sm">{selectedConv.otherUser.fullName}</p>
                      <p className="text-xs text-linkedin-muted">@{selectedConv.otherUser.userName}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg: any) => {
                    const isMe = msg.senderId === currentUser?.userId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <Avatar src={selectedConv.otherUser.avatarUrl} name={selectedConv.otherUser.fullName} size="sm" />
                        )}
                        <div className={`max-w-xs mx-2 ${isMe ? 'order-first' : ''}`}>
                          <div className={`px-4 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-linkedin-blue text-white rounded-br-sm'
                              : 'bg-linkedin-gray text-linkedin-text rounded-bl-sm'
                          }`}>
                            {msg.content.startsWith('📷 [Ảnh](') ? (
                              <img
                                src={msg.content.match(/\(([^)]+)\)/)?.[1]}
                                className="max-w-48 rounded-lg cursor-pointer"
                                onClick={() => window.open(msg.content.match(/\(([^)]+)\)/)?.[1])}
                              />
                            ) : (
                              msg.content
                            )}
                          </div>
                          <p className={`text-xs text-linkedin-muted mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-linkedin-border">
                  {/* Emoji picker */}
                  {showEmoji && (
                    <div className="mb-2 p-2 bg-linkedin-gray rounded-lg flex flex-wrap gap-1">
                      {['😀','😂','🥰','😍','🤔','😎','🥳','😢','😡','👍','❤️','🔥','✅','🎉','💯','🙏','👏','💪','🤝','😊'].map(emoji => (
                        <button key={emoji} type="button"
                          onClick={() => { setNewMessage(prev => prev + emoji); setShowEmoji(false); }}
                          className="text-xl hover:scale-125 transition-transform p-1">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    {/* Emoji button */}
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                      className="text-xl text-linkedin-muted hover:text-linkedin-text flex-shrink-0">
                      😊
                    </button>

                    {/* Image button */}
                    <button type="button" onClick={() => imageInputRef.current?.click()}
                      className="text-xl text-linkedin-muted hover:text-linkedin-text flex-shrink-0">
                      🖼️
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*"
                      onChange={handleImageSend} className="hidden" />

                    {/* Text input */}
                    <input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Viết tin nhắn..."
                      className="flex-1 px-4 py-2 border border-linkedin-border rounded-full text-sm focus:outline-none focus:border-linkedin-blue"
                      autoComplete="off"
                    />

                    <button type="submit" disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-linkedin-blue text-white rounded-full text-sm font-semibold hover:bg-linkedin-darkblue disabled:opacity-50 flex-shrink-0">
                      {sending ? '...' : 'Gửi'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-linkedin-muted">
                <p className="text-5xl mb-4">💬</p>
                <p className="text-lg font-semibold">Chọn một cuộc trò chuyện</p>
                <p className="text-sm mt-1">hoặc tìm kiếm người dùng để bắt đầu nhắn tin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
export default MessagingPage;