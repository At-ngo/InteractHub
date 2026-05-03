import { Link } from 'react-router-dom';
import type { User } from '../../types';
import Avatar from '../common/Avatar';

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

interface Props { user: User; }

const ProfileCard = ({ user }: Props) => (
  <div className="bg-white rounded-lg border border-linkedin-border overflow-hidden">
    <div className="h-14 bg-gradient-to-r from-linkedin-blue to-linkedin-darkblue" />
    <div className="px-3 pb-3 -mt-6">
      <Link to={`/profile/${user.id}`}>
        <Avatar src={user.avatarUrl} name={user.fullName} size="lg" />
      </Link>
      <Link to={`/profile/${user.id}`}>
        <h3 className="font-semibold text-sm text-linkedin-text mt-1 hover:underline">{user.fullName}</h3>
      </Link>
      <p className="text-xs text-linkedin-muted">@{user.username}</p>
      {user.lastActiveAt && (
        <p className="text-xs text-linkedin-muted">Hoạt động: {timeAgo(user.lastActiveAt)}</p>
      )}
      {user.bio && <p className="text-xs text-linkedin-muted mt-1">{user.bio}</p>}

      <div className="border-t border-linkedin-border mt-3 pt-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-linkedin-muted">Người xem hồ sơ</span>
          <span className="text-linkedin-blue font-semibold">{user.postCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-linkedin-muted">Kết nối</span>
          <span className="text-linkedin-blue font-semibold">{user.friendCount}</span>
        </div>
      </div>

      <div className="border-t border-linkedin-border mt-3 pt-3 space-y-2">
        {[
          { icon: '🔖', label: 'Mục đã lưu', path: '/saved' },
        ].map(item => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center gap-2 text-xs text-linkedin-muted hover:text-linkedin-blue w-full py-1"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);
export default ProfileCard;