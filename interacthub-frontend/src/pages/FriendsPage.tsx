import { useState, useEffect } from 'react';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import MainLayout from '../components/layout/MainLayout';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/messageService';
import api from '../services/api';

const FriendsPage = () => {
  const [tab, setTab] = useState<'network' | 'pending' | 'search'>('network');
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ connected: 0, sentRequests: 0, followers: 0, following: 0 });
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, pendingRes, suggestRes, sentRes, myProfileRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingRequests(),
        userService.searchUsers(''),
        friendService.getSentRequests(),
        userService.getMyProfile(),
      ]);
      const statsRes = await api.get('/Friends/stats');
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (friendsRes.success) setFriends(friendsRes.data);
      if (pendingRes.success) setPending(pendingRes.data);
        if (suggestRes.success) {
          const s = suggestRes.data.slice(0, 12);
          // Exclude users who are already connected (isConnected), those you sent requests to, and those who sent you requests.
          const sentIds = new Set((sentRes.success ? sentRes.data : []).map((r: any) => r.receiverId));
          const pendingSenderIds = new Set((pendingRes.success ? pendingRes.data : []).map((r: any) => r.senderId));
          const myId = myProfileRes.success ? myProfileRes.data.id : null;
          const filtered = s.filter((u: any) => u.id !== myId && !u.isConnected && !sentIds.has(u.id) && !pendingSenderIds.has(u.id));
          setSuggestions(filtered.slice(0, 8));
        }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = await userService.searchUsers(searchQuery);
    if (res.success) setSearchResults(res.data);
    setTab('search');
  };

  const handleAccept = async (senderId: string) => {
    await friendService.acceptRequest(senderId);
    loadData();
  };

  const handleReject = async (senderId: string) => {
    await friendService.rejectRequest(senderId);
    loadData();
  };

  const handleConnect = async (id: string) => {
    await friendService.sendRequest(id);
    setSuggestions(prev => prev.filter(u => u.id !== id));
    setSearchResults(prev => prev.filter(u => u.id !== id));
  };

  const handleMessage = async (id: string) => {
    const res = await messageService.getOrCreateConversation(id);
    if (res.success) navigate(`/messaging?userId=${id}`);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4">

          {/* Left sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-linkedin-border p-4">
              <h2 className="font-bold text-linkedin-text mb-3">Mạng lưới của tôi</h2>

              {/* Thống kê */}
              <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-linkedin-border">
                <div className="bg-linkedin-gray rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-linkedin-blue">{stats.connected}</p>
                  <p className="text-xs text-linkedin-muted">Kết nối</p>
                </div>
                <div className="bg-linkedin-gray rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-linkedin-blue">{stats.sentRequests}</p>
                  <p className="text-xs text-linkedin-muted">Đã gửi lời mời</p>
                </div>
                <div className="bg-linkedin-gray rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-linkedin-blue">{stats.followers}</p>
                  <p className="text-xs text-linkedin-muted">Người theo dõi</p>
                </div>
                <div className="bg-linkedin-gray rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-linkedin-blue">{stats.following}</p>
                  <p className="text-xs text-linkedin-muted">Đang theo dõi</p>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { key: 'network', label: 'Kết nối', count: friends.length },
                  { key: 'pending', label: 'Lời mời kết nối', count: pending.length },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      tab === item.key
                        ? 'bg-linkedin-lightblue text-linkedin-blue font-semibold'
                        : 'text-linkedin-muted hover:bg-linkedin-gray'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.count > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        tab === item.key ? 'bg-linkedin-blue text-white' : 'bg-linkedin-gray'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="col-span-2 space-y-4">

            {/* Search bar */}
            <div className="bg-white rounded-lg border border-linkedin-border p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên..."
                  className="flex-1 px-4 py-2 border border-linkedin-border rounded-full text-sm focus:outline-none focus:border-linkedin-blue"
                />
                <button type="submit"
                  className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full hover:bg-linkedin-darkblue font-semibold">
                  Tìm
                </button>
              </form>
            </div>

            {loading ? <LoadingSpinner /> : (
              <>
                {/* Pending requests */}
                {tab === 'pending' && (
                  <div className="bg-white rounded-lg border border-linkedin-border p-4">
                    <h3 className="font-bold text-linkedin-text mb-4">
                      Lời mời kết nối ({pending.length})
                    </h3>
                    {pending.length === 0 ? (
                      <p className="text-center text-linkedin-muted py-6">Không có lời mời nào</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {pending.map((r: any) => (
                          <div key={r.friendshipId} className="border border-linkedin-border rounded-lg overflow-hidden">
                            <div className="h-12 bg-gradient-to-r from-linkedin-blue to-linkedin-darkblue" />
                            <div className="p-3 -mt-6">
                              <Avatar src={r.avatarUrl} name={r.fullName} size="md" />
                              <p className="font-semibold text-sm mt-2">{r.fullName}</p>
                              <p className="text-xs text-linkedin-muted">@{r.userName}</p>
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => handleAccept(r.senderId)}
                                  className="flex-1 py-1.5 bg-linkedin-blue text-white text-xs rounded-full font-semibold">
                                  Chấp nhận
                                </button>
                                <button onClick={() => handleReject(r.senderId)}
                                  className="flex-1 py-1.5 border border-linkedin-border text-xs rounded-full hover:bg-linkedin-gray">
                                  Bỏ qua
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Friends / Network */}
                {tab === 'network' && (
                  <div className="bg-white rounded-lg border border-linkedin-border p-4">
                    <h3 className="font-bold text-linkedin-text mb-4">
                      Kết nối của tôi ({friends.length})
                    </h3>
                    {friends.length === 0 ? (
                      <p className="text-center text-linkedin-muted py-6">Chưa có kết nối nào</p>
                    ) : (
                      <div className="space-y-3">
                        {friends.map((f: any) => (
                          <div key={f.id} className="flex items-center justify-between p-3 hover:bg-linkedin-gray rounded-lg">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${f.id}`)}>
                              <Avatar src={f.avatarUrl} name={f.fullName} />
                              <div>
                                <p className="font-semibold text-sm hover:text-linkedin-blue">{f.fullName}</p>
                                <p className="text-xs text-linkedin-muted">@{f.userName}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMessage(f.id)}
                                className="px-3 py-1.5 border border-linkedin-border text-xs rounded-full hover:bg-linkedin-gray font-medium"
                              >
                                💬 Nhắn tin
                              </button>
                              <button
                                onClick={() => navigate(`/profile/${f.id}`)}
                                className="px-3 py-1.5 border border-linkedin-border text-xs rounded-full hover:bg-linkedin-gray font-medium"
                              >
                                Xem hồ sơ
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Search results */}
                {tab === 'search' && (
                  <div className="bg-white rounded-lg border border-linkedin-border p-4">
                    <h3 className="font-bold text-linkedin-text mb-4">
                      Kết quả tìm kiếm "{searchQuery}"
                    </h3>
                    {searchResults.length === 0 ? (
                      <p className="text-center text-linkedin-muted py-6">Không tìm thấy kết quả</p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between p-3 hover:bg-linkedin-gray rounded-lg">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
                              <Avatar src={u.avatarUrl} name={u.fullName} />
                              <div>
                                <p className="font-semibold text-sm">{u.fullName}</p>
                                <p className="text-xs text-linkedin-muted">@{u.username}</p>
                                {u.jobTitle && <p className="text-xs text-linkedin-muted">{u.jobTitle}</p>}
                              </div>
                            </div>
                            <button
                              onClick={() => handleConnect(u.id)}
                              className="px-3 py-1.5 border border-linkedin-blue text-linkedin-blue text-xs rounded-full hover:bg-linkedin-lightblue font-semibold"
                            >
                              + Kết nối
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* People you may know - always show panel when in network tab; show placeholder if empty */}
                {tab === 'network' && (
                  <div className="bg-white rounded-lg border border-linkedin-border p-4">
                    <h3 className="font-bold text-linkedin-text mb-4">Người bạn có thể biết</h3>
                    {suggestions.length === 0 ? (
                      <p className="text-center text-linkedin-muted py-6">Không có gợi ý phù hợp — thử tìm kiếm thêm người hoặc quay lại sau.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {suggestions.map((u: any) => (
                          <div key={u.id} className="border border-linkedin-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="h-12 bg-gradient-to-r from-gray-300 to-gray-400" />
                            <div className="p-3 -mt-6">
                              <div className="cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
                                <Avatar src={u.avatarUrl} name={u.fullName} size="md" />
                                <p className="font-semibold text-sm mt-2 hover:text-linkedin-blue">{u.fullName}</p>
                                <p className="text-xs text-linkedin-muted">@{u.username}</p>
                                {u.jobTitle && <p className="text-xs text-linkedin-muted truncate">{u.jobTitle}</p>}
                              </div>
                              {u.isFriend ? (
                                <button disabled
                                  className="w-full mt-3 py-1.5 border border-linkedin-border text-xs rounded-full text-linkedin-muted">
                                  ✓ Đã kết nối
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConnect(u.id)}
                                  className="w-full mt-3 py-1.5 border border-linkedin-blue text-linkedin-blue text-xs rounded-full hover:bg-linkedin-lightblue font-semibold"
                                >
                                  + Kết nối
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
export default FriendsPage;