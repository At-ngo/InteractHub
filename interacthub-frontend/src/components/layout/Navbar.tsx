import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import DarkModeToggle from '../common/DarkModeToggle';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { isAdminFromToken } from '../../services/jwt';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  // search history removed as per requirement
  


  const handleLogout = () => { logout(); navigate('/login'); };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${search}`);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCounts = async () => {
      try {
        const notifRes = await api.get('/Notifications');
        if (notifRes.data.success) {
          setUnreadCount(notifRes.data.data.filter((n: any) => !n.isRead).length);
        }
        const msgRes = await api.get('/Messages/conversations');
        if (msgRes.data.success) {
          setUnreadMessages(msgRes.data.data.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0));
        }
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <nav className="bg-white border-b border-linkedin-border fixed top-0 left-0 right-0 z-50 h-14">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo + Search */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-linkedin-blue font-bold text-2xl flex-shrink-0">
            <span className="bg-linkedin-blue text-white px-2 py-1 rounded text-lg">in</span>
          </Link>
          {isAuthenticated && (
            <div className="relative">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm"
                  className="px-4 py-2 bg-linkedin-gray border border-linkedin-border rounded-md text-sm focus:outline-none focus:border-linkedin-blue w-48"
                />
              </form>
              {/* search history removed */}
            </div>
          )}
        </div>

        {/* Center Nav Icons */}
        {isAuthenticated && (
          <div className="flex items-center">
            {[
              { to: '/', icon: '🏠', label: 'Trang chủ', badge: 0 },
              { to: '/friends', icon: '👥', label: 'Kết nối', badge: 0 },
              { to: '/jobs', icon: '💼', label: 'Việc làm', badge: 0 },
              { to: '/messaging', icon: '💬', label: 'Nhắn tin', badge: unreadMessages },
              { to: '/notifications', icon: '🔔', label: 'Thông báo', badge: unreadCount },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center px-3 py-1 text-linkedin-muted hover:text-linkedin-text border-b-2 border-transparent hover:border-linkedin-text transition-all relative"
              >
                <span className="text-xl relative">
                  {item.icon}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Right */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {isAdminFromToken(localStorage.getItem('token')) && (
              <Link to="/admin/reports" className="text-sm text-linkedin-muted hover:underline mr-3">Admin</Link>
            )}
            <DarkModeToggle />
            <Link
              to={`/profile/${user?.userId}`}
              className="flex flex-col items-center text-linkedin-muted hover:text-linkedin-text"
            >
              <Avatar src={user?.avatarUrl} name={user?.fullName || ''} size="sm" />
              <span className="text-xs">Tôi ▾</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-linkedin-muted hover:text-red-500 border border-linkedin-border px-3 py-1 rounded-full"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-linkedin-blue font-semibold text-sm hover:underline">
              Đăng nhập
            </Link>
            <Link to="/register" className="bg-linkedin-blue text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-linkedin-darkblue">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;