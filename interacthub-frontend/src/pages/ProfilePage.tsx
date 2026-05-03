import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';
import { postService } from '../services/postService';
import { friendService } from '../services/friendService';
import { followService } from '../services/followService';
import { messageService } from '../services/messageService';
import { useUpload } from '../hooks/useUpload';
import type { User, Post, ApiResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import PostCard from '../components/post/PostCard';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const { uploadImage, uploading } = useUpload();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [friendshipStatus, setFriendshipStatus] = useState<{
    status: string;
    isSender: boolean;
  } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '', bio: '', jobTitle: '', company: '', location: '',
    gitHubUrl: '', websiteUrl: ''
  });

  const [showAddExp, setShowAddExp] = useState(false);
  const [expForm, setExpForm] = useState({
    title: '', company: '', location: '',
    startDate: '', endDate: '', isCurrentJob: false, description: ''
  });

  const [showAddEdu, setShowAddEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    school: '', degree: '', fieldOfStudy: '',
    startDate: '', endDate: '', description: ''
  });

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa hoạt động';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  const isOwner = currentUser?.userId === id;

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = isOwner || !id
        ? await userService.getMyProfile()
        : await userService.getProfile(id!);

      if (res.success) {
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);
        setFollowerCount(res.data.followerCount);
        setEditForm({
          fullName: res.data.fullName,
          bio: res.data.bio || '',
          jobTitle: res.data.jobTitle || '',
          company: res.data.company || '',
          location: res.data.location || '',
          gitHubUrl: res.data.gitHubUrl || '',
          websiteUrl: res.data.websiteUrl || '',
        });
      }

      const skillsRes = await profileService.getSkills();
      if (skillsRes.success) setSkills(skillsRes.data);
      if (id && !isOwner) {
        const statusRes = await friendService.getFriendshipStatus(id);
        if (statusRes.success) setFriendshipStatus(statusRes.data);
      }

      const postsRes = await postService.getPosts(1, 20);
      if (postsRes.success)
        setPosts(postsRes.data.filter(p => p.userId === (id || currentUser?.userId)));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'avatars');
    if (url) {
      await userService.updateProfile({
        fullName: profile!.fullName,
        bio: profile!.bio,
        jobTitle: profile!.jobTitle,
        company: profile!.company,
        location: profile!.location,
        coverUrl: profile!.coverUrl,
        gitHubUrl: profile!.gitHubUrl,
        websiteUrl: profile!.websiteUrl,
        avatarUrl: url,
      });
      updateUser({ avatarUrl: url });
      loadAll();
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'covers');
    if (url) {
      await userService.updateProfile({
        fullName: profile!.fullName,
        bio: profile!.bio,
        jobTitle: profile!.jobTitle,
        company: profile!.company,
        location: profile!.location,
        avatarUrl: profile!.avatarUrl,
          gitHubUrl: profile!.gitHubUrl,
          websiteUrl: profile!.websiteUrl,
        coverUrl: url,
      });
      loadAll();
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await userService.updateProfile({
      ...editForm,
      avatarUrl: profile!.avatarUrl,  // THÊM
      coverUrl: profile!.coverUrl,    // THÊM
    });
    setEditingProfile(false);
    loadAll();
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileService.addExperience(expForm);
    setShowAddExp(false);
    setExpForm({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrentJob: false, description: '' });
    loadAll();
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileService.addEducation(eduForm);
    setShowAddEdu(false);
    setEduForm({ school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' });
    loadAll();
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    await profileService.addSkill(skillInput);
    setSkillInput('');
    setShowAddSkill(false);
    const res = await profileService.getSkills();
    if (res.success) setSkills(res.data);
  };

  const handleToggleFollow = async () => {
    if (!id) return;
    const res = await followService.toggleFollow(id);
    if (res.success) {
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
    }
  };

  const handleSendRequest = async () => {
    if (!id) return;
    await friendService.sendRequest(id);
    setFriendshipStatus({ status: 'pending', isSender: true });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Hiện tại';
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>;
  if (!profile) return <MainLayout><p className="text-center py-8">Không tìm thấy người dùng</p></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-3">

        {/* HEADER */}
        <div className="bg-white rounded-lg border border-linkedin-border overflow-hidden">

          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-linkedin-blue to-linkedin-darkblue relative group"
            style={{ cursor: 'pointer' }}>
            {profile.coverUrl && (
              <img src={profile.coverUrl} className="w-full h-full object-cover"
                onClick={() => !isOwner && setViewImage(profile.coverUrl!)} />
            )}
            {isOwner && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center"
                onClick={() => coverInputRef.current?.click()}>
                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                  {uploading ? '⏳ Đang tải...' : '📷 Đổi ảnh bìa'}
                </span>
              </div>
            )}
            {isOwner && profile.coverUrl && (
              <button onClick={e => { e.stopPropagation(); setViewImage(profile.coverUrl!); }}
                className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full hover:bg-opacity-70">
                🔍 Xem
              </button>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-3">

              {/* Avatar */}
              <div className="border-4 border-white rounded-full relative group">
                <Avatar src={profile.avatarUrl} name={profile.fullName} size="lg"
                  onClick={() => profile.avatarUrl && setViewImage(profile.avatarUrl)} />
                {isOwner && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <button onClick={e => { e.stopPropagation(); avatarInputRef.current?.click(); }}
                      className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                      📷 Đổi
                    </button>
                    {profile.avatarUrl && (
                      <button onClick={e => { e.stopPropagation(); setViewImage(profile.avatarUrl!); }}
                        className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                        🔍 Xem
                      </button>
                    )}
                  </div>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-12">
                {isOwner ? (
                  <button onClick={() => setEditingProfile(!editingProfile)}
                    className="px-4 py-1.5 border border-linkedin-blue text-linkedin-blue text-sm rounded-full hover:bg-linkedin-lightblue font-semibold">
                    Chỉnh sửa hồ sơ
                  </button>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {/* Theo dõi */}
                    <button onClick={handleToggleFollow}
                      className={`px-4 py-1.5 text-sm rounded-full font-semibold border transition-colors ${
                        isFollowing
                          ? 'border-linkedin-border text-linkedin-muted hover:bg-linkedin-gray'
                          : 'bg-linkedin-blue text-white hover:bg-linkedin-darkblue border-linkedin-blue'
                      }`}>
                      {isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi'}
                    </button>

                    {/* Nút kết nối thông minh */}
                    {friendshipStatus?.status === 'accepted' ? (
                      <button onClick={() => setShowUnfriendConfirm(true)}
                        className="px-4 py-1.5 border border-linkedin-border text-linkedin-muted text-sm rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-300 font-semibold">
                        ✓ Đã kết nối ▾
                      </button>
                    ) : friendshipStatus?.status === 'pending' && friendshipStatus?.isSender ? (
                      <button onClick={() => setShowCancelConfirm(true)}
                        className="px-4 py-1.5 border border-linkedin-border text-linkedin-muted text-sm rounded-full hover:bg-linkedin-gray font-semibold">
                        ⏳ Đang chờ xử lý
                      </button>
                    ) : friendshipStatus?.status === 'pending' && !friendshipStatus?.isSender ? (
                      <button onClick={() => setShowRespondModal(true)}
                        className="px-4 py-1.5 bg-linkedin-blue text-white text-sm rounded-full hover:bg-linkedin-darkblue font-semibold">
                        📩 Phản hồi
                      </button>
                    ) : (
                      <button onClick={handleSendRequest}
                        className="px-4 py-1.5 border border-linkedin-blue text-linkedin-blue text-sm rounded-full hover:bg-linkedin-lightblue font-semibold">
                        + Kết nối
                      </button>
                    )}

                    {/* Nhắn tin */}
                    <button
                      onClick={async () => {
                        const res = await messageService.getOrCreateConversation(id!);
                        if (res.success) navigate(`/messaging?userId=${id}`);
                      }}
                      className="px-4 py-1.5 border border-linkedin-border text-linkedin-text text-sm rounded-full hover:bg-linkedin-gray font-semibold">
                      💬 Nhắn tin
                    </button>

                    {/* Gửi hồ sơ */}
                    <button
                      onClick={async () => {
                        const res = await messageService.getOrCreateConversation(id!);
                        if (res.success) {
                          const profileText = `📋 Hồ sơ cá nhân của tôi:
              👤 Họ tên: ${currentUser?.fullName}
              💼 ${profile.jobTitle || ''} ${profile.company ? `tại ${profile.company}` : ''}
              📍 ${profile.location || ''}
              ${profile.gitHubUrl ? `🐙 GitHub: ${profile.gitHubUrl}` : ''}
              ${profile.websiteUrl ? `🌐 Website: ${profile.websiteUrl}` : ''}
              🔗 Xem hồ sơ: ${window.location.origin}/profile/${currentUser?.userId}`;
                          await messageService.sendMessage(res.data.id, profileText);
                          navigate(`/messaging?userId=${id}`);
                        }
                      }}
                      className="px-4 py-1.5 border border-linkedin-border text-linkedin-text text-sm rounded-full hover:bg-linkedin-gray font-semibold">
                      📋 Gửi hồ sơ
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Edit form */}
            {editingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-linkedin-muted">Họ và tên</label>
                    <input value={editForm.fullName}
                      onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                      className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                  </div>
                  <div>
                    <label className="text-xs text-linkedin-muted">Vị trí công việc</label>
                    <input value={editForm.jobTitle}
                      onChange={e => setEditForm({...editForm, jobTitle: e.target.value})}
                      placeholder="VD: Software Engineer"
                      className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                  </div>
                  <div>
                    <label className="text-xs text-linkedin-muted">Công ty</label>
                    <input value={editForm.company}
                      onChange={e => setEditForm({...editForm, company: e.target.value})}
                      placeholder="VD: Google"
                      className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                  </div>
                  <div>
                    <label className="text-xs text-linkedin-muted">Địa điểm</label>
                    <input value={editForm.location}
                      onChange={e => setEditForm({...editForm, location: e.target.value})}
                      placeholder="VD: TP. Hồ Chí Minh"
                      className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                  </div>
                  <div>
                    <label className="text-xs text-linkedin-muted">GitHub URL</label>
                    <input value={editForm.gitHubUrl}
                      onChange={e => setEditForm({...editForm, gitHubUrl: e.target.value})}
                      placeholder="https://github.com/username"
                      className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                  </div>
                  <div>
                    <label className="text-xs text-linkedin-muted">Website</label>
                    <input value={editForm.websiteUrl}
                      onChange={e => setEditForm({...editForm, websiteUrl: e.target.value})}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                  </div>
                  <div className="col-span-2">
                    {/* LinkedIn URL removed per product decision */}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Giới thiệu</label>
                  <textarea value={editForm.bio}
                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full font-semibold">Lưu</button>
                  <button type="button" onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 border border-linkedin-border text-sm rounded-full">Hủy</button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-xl font-bold text-linkedin-text">{profile.fullName}</h1>
                {profile.lastActiveAt && <p className="text-sm text-linkedin-muted mt-1">Hoạt động: {formatLastActive(profile.lastActiveAt)}</p>}
                {profile.jobTitle && (
                  <p className="text-sm text-linkedin-text mt-0.5">
                    {profile.jobTitle}
                    {profile.company && <span> tại <span className="font-semibold">{profile.company}</span></span>}
                  </p>
                )}
                {profile.location && <p className="text-sm text-linkedin-muted mt-0.5">📍 {profile.location}</p>}
                {profile.bio && <p className="text-sm text-linkedin-text mt-2">{profile.bio}</p>}

                {/* Stats */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-linkedin-border flex-wrap">
                  <span className="text-sm text-linkedin-blue font-semibold">{profile.postCount} bài viết</span>
                  <span className="text-sm text-linkedin-blue font-semibold">{profile.friendCount} kết nối</span>
                  <span className="text-sm text-linkedin-blue font-semibold">{followerCount} người theo dõi</span>
                  <span className="text-sm text-linkedin-blue font-semibold">{profile.followingCount} đang theo dõi</span>
                </div>

                {/* Links */}
                {(profile.gitHubUrl || profile.websiteUrl) && (
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {profile.gitHubUrl && (
                      <a href={profile.gitHubUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-linkedin-blue hover:underline">
                        🐙 GitHub
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a href={profile.websiteUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-linkedin-blue hover:underline">
                        🌐 Website
                      </a>
                    )}
                    {/* LinkedIn link removed per product decision */}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="bg-white rounded-lg border border-linkedin-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Kinh nghiệm làm việc</h2>
            {isOwner && (
              <button onClick={() => setShowAddExp(!showAddExp)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-linkedin-gray text-2xl text-linkedin-muted font-light">+</button>
            )}
          </div>
          {showAddExp && (
            <form onSubmit={handleAddExperience} className="bg-linkedin-gray p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-linkedin-muted">Chức vụ *</label>
                  <input required value={expForm.title}
                    onChange={e => setExpForm({...expForm, title: e.target.value})}
                    placeholder="VD: Software Engineer"
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Công ty *</label>
                  <input required value={expForm.company}
                    onChange={e => setExpForm({...expForm, company: e.target.value})}
                    placeholder="VD: Google"
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Địa điểm</label>
                  <input value={expForm.location}
                    onChange={e => setExpForm({...expForm, location: e.target.value})}
                    placeholder="VD: TP. HCM"
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Ngày bắt đầu *</label>
                  <input required type="date" value={expForm.startDate}
                    onChange={e => setExpForm({...expForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Ngày kết thúc</label>
                  <input type="date" value={expForm.endDate} disabled={expForm.isCurrentJob}
                    onChange={e => setExpForm({...expForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1 disabled:opacity-50" />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="currentJob" checked={expForm.isCurrentJob}
                    onChange={e => setExpForm({...expForm, isCurrentJob: e.target.checked, endDate: ''})} />
                  <label htmlFor="currentJob" className="text-sm">Đang làm việc tại đây</label>
                </div>
              </div>
              <textarea value={expForm.description}
                onChange={e => setExpForm({...expForm, description: e.target.value})}
                placeholder="Mô tả công việc..." rows={2}
                className="w-full px-3 py-2 border border-linkedin-border rounded text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full font-semibold">Lưu</button>
                <button type="button" onClick={() => setShowAddExp(false)}
                  className="px-4 py-2 border border-linkedin-border text-sm rounded-full">Hủy</button>
              </div>
            </form>
          )}
          {!profile.experiences || profile.experiences.length === 0 ? (
            <p className="text-sm text-linkedin-muted">Chưa có kinh nghiệm làm việc</p>
          ) : (
            <div className="space-y-4">
              {profile.experiences.map(exp => (
                <div key={exp.id} className="flex gap-3">
                  <div className="w-10 h-10 bg-linkedin-gray rounded flex items-center justify-center flex-shrink-0 text-xl">🏢</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-sm">{exp.title}</p>
                        <p className="text-sm text-linkedin-text">{exp.company}</p>
                        <p className="text-xs text-linkedin-muted">
                          {formatDate(exp.startDate)} – {exp.isCurrentJob ? 'Hiện tại' : formatDate(exp.endDate)}
                        </p>
                        {exp.location && <p className="text-xs text-linkedin-muted">{exp.location}</p>}
                        {exp.description && <p className="text-sm mt-1 text-linkedin-text">{exp.description}</p>}
                      </div>
                      {isOwner && (
                        <button onClick={() => profileService.deleteExperience(exp.id).then(loadAll)}
                          className="text-linkedin-muted hover:text-red-500 text-sm ml-2">🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EDUCATION */}
        <div className="bg-white rounded-lg border border-linkedin-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Học vấn</h2>
            {isOwner && (
              <button onClick={() => setShowAddEdu(!showAddEdu)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-linkedin-gray text-2xl text-linkedin-muted font-light">+</button>
            )}
          </div>
          {showAddEdu && (
            <form onSubmit={handleAddEducation} className="bg-linkedin-gray p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-linkedin-muted">Trường *</label>
                  <input required value={eduForm.school}
                    onChange={e => setEduForm({...eduForm, school: e.target.value})}
                    placeholder="VD: Đại học Sài Gòn"
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Bằng cấp *</label>
                  <input required value={eduForm.degree}
                    onChange={e => setEduForm({...eduForm, degree: e.target.value})}
                    placeholder="VD: Cử nhân"
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Ngành học</label>
                  <input value={eduForm.fieldOfStudy}
                    onChange={e => setEduForm({...eduForm, fieldOfStudy: e.target.value})}
                    placeholder="VD: Công nghệ thông tin"
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Ngày bắt đầu *</label>
                  <input required type="date" value={eduForm.startDate}
                    onChange={e => setEduForm({...eduForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted">Ngày kết thúc</label>
                  <input type="date" value={eduForm.endDate}
                    onChange={e => setEduForm({...eduForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-linkedin-border rounded text-sm mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full font-semibold">Lưu</button>
                <button type="button" onClick={() => setShowAddEdu(false)}
                  className="px-4 py-2 border border-linkedin-border text-sm rounded-full">Hủy</button>
              </div>
            </form>
          )}
          {!profile.educations || profile.educations.length === 0 ? (
            <p className="text-sm text-linkedin-muted">Chưa có thông tin học vấn</p>
          ) : (
            <div className="space-y-4">
              {profile.educations.map(edu => (
                <div key={edu.id} className="flex gap-3">
                  <div className="w-10 h-10 bg-linkedin-gray rounded flex items-center justify-center flex-shrink-0 text-xl">🎓</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-sm">{edu.school}</p>
                        <p className="text-sm text-linkedin-text">
                          {edu.degree}{edu.fieldOfStudy && ` · ${edu.fieldOfStudy}`}
                        </p>
                        <p className="text-xs text-linkedin-muted">
                          {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                        </p>
                      </div>
                      {isOwner && (
                        <button onClick={() => profileService.deleteEducation(edu.id).then(loadAll)}
                          className="text-linkedin-muted hover:text-red-500 text-sm ml-2">🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKILLS */}
        <div className="bg-white rounded-lg border border-linkedin-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Kỹ năng</h2>
            {isOwner && (
              <button onClick={() => setShowAddSkill(!showAddSkill)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-linkedin-gray text-2xl text-linkedin-muted font-light">+</button>
            )}
          </div>
          {showAddSkill && (
            <form onSubmit={handleAddSkill} className="flex gap-2 mb-4">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                placeholder="VD: React, C#, SQL..."
                className="flex-1 px-3 py-2 border border-linkedin-border rounded text-sm focus:outline-none focus:border-linkedin-blue" />
              <button type="submit" className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-full font-semibold">Thêm</button>
              <button type="button" onClick={() => setShowAddSkill(false)}
                className="px-4 py-2 border border-linkedin-border text-sm rounded-full">Hủy</button>
            </form>
          )}
          {skills.length === 0 ? (
            <p className="text-sm text-linkedin-muted">Chưa có kỹ năng nào</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: any) => (
                <div key={skill.id}
                  className="flex items-center gap-1 px-3 py-1.5 border border-linkedin-border rounded-full text-sm hover:bg-linkedin-gray">
                  <span>{skill.name}</span>
                  {isOwner && (
                    <button
                      onClick={() => profileService.deleteSkill(skill.id).then(() =>
                        profileService.getSkills().then((r: ApiResponse<any[]>) => { if (r.success) setSkills(r.data); })
                      )}
                      className="text-linkedin-muted hover:text-red-500 ml-1 text-xs leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* POSTS */}
        <div>
          <h2 className="font-bold text-linkedin-text mb-3 text-lg">Hoạt động</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-linkedin-border p-8 text-center text-linkedin-muted">
              Chưa có bài viết nào
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post}
                onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))} />
            ))
          )}
        </div>

      </div>

      {/* Image viewer modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setViewImage(null)}>
          <div className="relative max-w-3xl max-h-screen p-4">
            <img src={viewImage} className="max-w-full max-h-screen object-contain rounded-lg"
              onClick={e => e.stopPropagation()} />
            <button onClick={() => setViewImage(null)}
              className="absolute top-2 right-2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 text-xl">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Thu hồi lời mời */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Thu hồi lời mời?</h3>
            <p className="text-sm text-linkedin-muted mb-4">
              Bạn có muốn thu hồi lời mời kết nối với {profile?.fullName} không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await friendService.cancelRequest(id!);
                  setFriendshipStatus(null);
                  setShowCancelConfirm(false);
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600"
              >
                Thu hồi lời mời
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 border border-linkedin-border rounded-full text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hủy kết nối */}
      {showUnfriendConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Hủy kết nối?</h3>
            <p className="text-sm text-linkedin-muted mb-4">
              Bạn có muốn hủy kết nối với {profile?.fullName} không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await friendService.unfriend(id!);
                  setFriendshipStatus(null);
                  setShowUnfriendConfirm(false);
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600"
              >
                Hủy kết nối
              </button>
              <button
                onClick={() => setShowUnfriendConfirm(false)}
                className="flex-1 py-2 border border-linkedin-border rounded-full text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phản hồi lời mời */}
      {showRespondModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Phản hồi lời mời</h3>
            <p className="text-sm text-linkedin-muted mb-4">
              {profile?.fullName} đã gửi lời mời kết nối với bạn
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await friendService.acceptRequest(id!);
                  setFriendshipStatus({ status: 'accepted', isSender: false });
                  setShowRespondModal(false);
                }}
                className="flex-1 py-2 bg-linkedin-blue text-white rounded-full text-sm font-semibold"
              >
                ✓ Chấp nhận
              </button>
              <button
                onClick={async () => {
                  await friendService.rejectRequest(id!);
                  setFriendshipStatus(null);
                  setShowRespondModal(false);
                }}
                className="flex-1 py-2 border border-red-300 text-red-500 rounded-full text-sm font-semibold"
              >
                ✕ Xóa
              </button>
              <button
                onClick={() => setShowRespondModal(false)}
                className="px-3 py-2 border border-linkedin-border rounded-full text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
};
export default ProfilePage;