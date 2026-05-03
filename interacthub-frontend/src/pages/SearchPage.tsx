import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { friendService } from '../services/friendService';
import MainLayout from '../components/layout/MainLayout';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [incomingIds, setIncomingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (query) {
      setLoading(true);
      Promise.all([userService.searchUsers(query), friendService.getSentRequests(), friendService.getPendingRequests()])
        .then(([res, sentRes, pendingRes]) => {
          if (res.success) setResults(res.data);
          const s = new Set((sentRes.success ? sentRes.data : []).map((r: any) => r.receiverId));
          const p = new Set((pendingRes.success ? pendingRes.data : []).map((r: any) => r.senderId));
          setSentIds(s);
          setIncomingIds(p);
        })
        .finally(() => setLoading(false));
    }
  }, [query]);

  const handleSendRequest = async (id: string) => {
    await friendService.sendRequest(id);
    setResults(prev => prev.filter(u => u.id !== id));
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-linkedin-text mb-4">
          Kết quả tìm kiếm: "{query}"
        </h1>
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-center text-linkedin-muted py-8">Không tìm thấy kết quả</p>
            ) : results.map((u: any) => (
              <div key={u.id} className="bg-white rounded-lg border border-linkedin-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatarUrl} name={u.fullName} />
                  <div>
                    <p className="font-medium text-sm">{u.fullName}</p>
                    <p className="text-xs text-linkedin-muted">@{u.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="px-3 py-1 border border-linkedin-border text-xs rounded-full hover:bg-linkedin-gray"
                  >
                    Xem hồ sơ
                  </button>
                  {u.isConnected ? (
                    <button disabled
                      className="px-3 py-1 border border-linkedin-border text-xs rounded-full text-linkedin-muted bg-linkedin-gray cursor-not-allowed">
                      ✓ Đã kết nối
                    </button>
                  ) : sentIds.has(u.id) ? (
                    <button disabled
                      className="px-3 py-1 border border-linkedin-border text-xs rounded-full text-linkedin-muted bg-linkedin-gray cursor-not-allowed">
                      ✓ Đã gửi
                    </button>
                  ) : incomingIds.has(u.id) ? (
                    <button disabled
                      className="px-3 py-1 border border-linkedin-border text-xs rounded-full text-linkedin-muted bg-linkedin-gray cursor-not-allowed">
                      📨 Đã nhận lời mời
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(u.id)}
                      className="px-3 py-1 bg-linkedin-blue text-white text-xs rounded-full hover:bg-linkedin-darkblue"
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
    </MainLayout>
  );
};
export default SearchPage;