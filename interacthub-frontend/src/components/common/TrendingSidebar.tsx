import { useState, useEffect } from 'react';
import { hashtagService } from '../../services/hashtagService';
import { userService } from '../../services/userService';
import { friendService } from '../../services/friendService';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';

const TrendingSidebar = () => {
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    hashtagService.getTrending()
      .then(res => { if (res.success) setHashtags(res.data); })
      .catch(() => {});

    const loadSuggestions = async () => {
      try {
        const [searchRes, sentRes, pendingRes, myProfileRes] = await Promise.all([
          userService.searchUsers(''),
          friendService.getSentRequests(),
          friendService.getPendingRequests(),
          userService.getMyProfile(),
        ]);
        if (searchRes.success) {
          const s = searchRes.data.slice(0, 12);
          const sentIds = new Set((sentRes.success ? sentRes.data : []).map((r: any) => r.receiverId));
          const pendingSenderIds = new Set((pendingRes.success ? pendingRes.data : []).map((r: any) => r.senderId));
          const myId = myProfileRes.success ? myProfileRes.data.id : null;
          // Use isConnected provided by backend and exclude both sent & incoming pending requests
          const filtered = s.filter((u: any) => u.id !== myId && !u.isConnected && !sentIds.has(u.id) && !pendingSenderIds.has(u.id));
          setSuggestions(filtered.slice(0, 3));
        }
      } catch (e) {
        // ignore errors
      }
    };

    loadSuggestions();
  }, []);

  const handleConnect = async (id: string) => {
    await friendService.sendRequest(id);
    setSuggestions(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* People suggestions */}
      {/* Always show People you may know panel; show placeholder when empty */}
      <div className="bg-white rounded-lg border border-linkedin-border p-4">
        <h3 className="font-semibold text-sm text-linkedin-text mb-3">
          Người bạn có thể biết
        </h3>
        {suggestions.length === 0 ? (
          <p className="text-xs text-linkedin-muted">Không có gợi ý phù hợp — thử tìm kiếm thêm người hoặc quay lại sau.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map(u => (
              <div key={u.id} className="flex items-center gap-2">
                <div onClick={() => navigate(`/profile/${u.id}`)} className="cursor-pointer">
                  <Avatar src={u.avatarUrl} name={u.fullName} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="text-xs font-semibold truncate cursor-pointer hover:underline"
                  >
                    {u.fullName}
                  </p>
                  <p className="text-xs text-linkedin-muted truncate">@{u.username}</p>
                </div>
                <button
                  onClick={() => handleConnect(u.id)}
                  className="text-xs border border-linkedin-blue text-linkedin-blue px-2 py-1 rounded-full hover:bg-linkedin-lightblue flex-shrink-0"
                >
                  + Kết nối
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending hashtags */}
      <div className="bg-white rounded-lg border border-linkedin-border p-4">
        <h3 className="font-semibold text-sm text-linkedin-text mb-3">
          Tin tức & Xu hướng
        </h3>
        {hashtags.length === 0 ? (
          <p className="text-xs text-linkedin-muted">
            Đăng bài với #hashtag để xuất hiện ở đây!
          </p>
        ) : (
          <div className="space-y-3">
            {hashtags.map((tag, i) => (
              <div key={tag.id} className="cursor-pointer hover:bg-linkedin-gray p-1 rounded">
                <p className="text-xs text-linkedin-muted">{i + 1} · Xu hướng</p>
                <p className="text-sm font-semibold text-linkedin-text">#{tag.name}</p>
                <p className="text-xs text-linkedin-muted">{tag.useCount} bài viết</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default TrendingSidebar;