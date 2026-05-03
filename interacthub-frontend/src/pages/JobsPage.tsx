import { useState, useEffect } from 'react';
import { jobService } from '../services/jobService';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

const JobsPage = () => {
  const { } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [tab, setTab] = useState<'jobs' | 'applied' | 'post'>('jobs');
  const [applications, setApplications] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  // Post job form
  const [jobForm, setJobForm] = useState({
    title: '', company: '', location: '',
    description: '', requirements: '', salary: '', jobType: 'Full-time'
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async (q?: string, location?: string) => {
    setLoading(true);
    try {
      const res = await jobService.getJobs(q, location);
      if (res.success) {
        setJobs(res.data);
        if (res.data.length > 0) setSelectedJob(res.data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    const res = await jobService.getMyApplications();
    if (res.success) setApplications(res.data);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(searchQ, searchLocation);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setApplying(true);
    try {
      const res = await jobService.applyJob(selectedJob.id, coverLetter);
      if (res.success) {
        setShowApplyModal(false);
        setCoverLetter('');
        loadJobs();
      }
    } finally {
      setApplying(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      const res = await jobService.createJob(jobForm);
      if (res.success) {
        setJobForm({ title: '', company: '', location: '', description: '', requirements: '', salary: '', jobType: 'Full-time' });
        setTab('jobs');
        loadJobs();
      }
    } finally {
      setPosting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    return `${days} ngày trước`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'text-green-600 bg-green-50';
      case 'Rejected': return 'text-red-600 bg-red-50';
      case 'Reviewed': return 'text-blue-600 bg-blue-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'Accepted': return 'Đã chấp nhận';
      case 'Rejected': return 'Bị từ chối';
      case 'Reviewed': return 'Đang xem xét';
      default: return 'Đang chờ';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-linkedin-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-linkedin-text">Việc làm</h1>
            <div className="flex gap-2">
              {[
                { key: 'jobs', label: '🔍 Tìm việc' },
                { key: 'applied', label: '📋 Đã ứng tuyển' },
                { key: 'post', label: '+ Đăng tuyển' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key as any);
                    if (t.key === 'applied') loadApplications();
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-linkedin-blue text-white'
                      : 'border border-linkedin-border text-linkedin-muted hover:bg-linkedin-gray'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          {tab === 'jobs' && (
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Tìm theo chức danh, công ty..."
                className="flex-1 px-4 py-2 border border-linkedin-border rounded-lg text-sm focus:outline-none focus:border-linkedin-blue"
              />
              <input
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                placeholder="Địa điểm..."
                className="w-40 px-4 py-2 border border-linkedin-border rounded-lg text-sm focus:outline-none focus:border-linkedin-blue"
              />
              <button type="submit" className="px-4 py-2 bg-linkedin-blue text-white text-sm rounded-lg hover:bg-linkedin-darkblue font-semibold">
                Tìm kiếm
              </button>
            </form>
          )}
        </div>

        {/* TAB: Jobs */}
        {tab === 'jobs' && (
          <div className="grid grid-cols-5 gap-4">
            {/* Jobs list */}
            <div className="col-span-2 space-y-2">
              {loading ? <LoadingSpinner /> : (
                jobs.length === 0 ? (
                  <div className="bg-white rounded-lg border border-linkedin-border p-8 text-center text-linkedin-muted">
                    Không tìm thấy việc làm nào
                  </div>
                ) : jobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer hover:border-linkedin-blue transition-colors ${
                      selectedJob?.id === job.id ? 'border-linkedin-blue bg-linkedin-lightblue' : 'border-linkedin-border'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-linkedin-gray rounded flex items-center justify-center text-xl flex-shrink-0">
                        🏢
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-linkedin-text hover:text-linkedin-blue truncate">
                          {job.title}
                        </p>
                        <p className="text-sm text-linkedin-text">{job.company}</p>
                        <p className="text-xs text-linkedin-muted">{job.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-linkedin-muted">{timeAgo(job.createdAt)}</span>
                          {job.hasApplied && (
                            <span className="text-xs text-green-600 font-medium">✓ Đã ứng tuyển</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Job detail */}
            <div className="col-span-3">
              {selectedJob ? (
                <div className="bg-white rounded-lg border border-linkedin-border p-6 sticky top-16">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-linkedin-gray rounded-lg flex items-center justify-center text-3xl">
                        🏢
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-linkedin-text">{selectedJob.title}</h2>
                        <p className="text-sm text-linkedin-text font-medium">{selectedJob.company}</p>
                        <p className="text-sm text-linkedin-muted">
                          📍 {selectedJob.location} · {selectedJob.jobType}
                        </p>
                        {selectedJob.salary && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            💰 {selectedJob.salary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-linkedin-border">
                    <p className="text-xs text-linkedin-muted">
                      {selectedJob.applicationCount} người đã ứng tuyển · {timeAgo(selectedJob.createdAt)}
                    </p>
                  </div>

                  {selectedJob.hasApplied ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                      ✓ Bạn đã ứng tuyển vị trí này
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="w-full py-2.5 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-linkedin-darkblue mb-4"
                    >
                      Ứng tuyển ngay
                    </button>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Mô tả công việc</h3>
                      <p className="text-sm text-linkedin-text whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>
                    {selectedJob.requirements && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Yêu cầu</h3>
                        <p className="text-sm text-linkedin-text whitespace-pre-wrap">{selectedJob.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-linkedin-border p-8 text-center text-linkedin-muted">
                  Chọn một việc làm để xem chi tiết
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Applied */}
        {tab === 'applied' && (
          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="bg-white rounded-lg border border-linkedin-border p-8 text-center text-linkedin-muted">
                <p className="text-2xl mb-2">📋</p>
                <p>Chưa ứng tuyển việc làm nào</p>
              </div>
            ) : applications.map((app: any) => (
              <div key={app.id} className="bg-white rounded-lg border border-linkedin-border p-4 flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-linkedin-gray rounded flex items-center justify-center text-xl">🏢</div>
                  <div>
                    <p className="font-semibold text-sm">{app.job.title}</p>
                    <p className="text-sm text-linkedin-muted">{app.job.company} · {app.job.location}</p>
                    <p className="text-xs text-linkedin-muted mt-1">{timeAgo(app.createdAt)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(app.status)}`}>
                  {statusText(app.status)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Post Job */}
        {tab === 'post' && (
          <div className="bg-white rounded-lg border border-linkedin-border p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold mb-4">Đăng việc làm mới</h2>
            <form onSubmit={handlePostJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-linkedin-muted font-medium">Chức danh *</label>
                  <input required value={jobForm.title}
                    onChange={e => setJobForm({...jobForm, title: e.target.value})}
                    placeholder="VD: Frontend Developer"
                    className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted font-medium">Công ty *</label>
                  <input required value={jobForm.company}
                    onChange={e => setJobForm({...jobForm, company: e.target.value})}
                    placeholder="VD: Google Vietnam"
                    className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted font-medium">Địa điểm *</label>
                  <input required value={jobForm.location}
                    onChange={e => setJobForm({...jobForm, location: e.target.value})}
                    placeholder="VD: TP. Hồ Chí Minh"
                    className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted font-medium">Loại công việc</label>
                  <select value={jobForm.jobType}
                    onChange={e => setJobForm({...jobForm, jobType: e.target.value})}
                    className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-linkedin-muted font-medium">Mức lương</label>
                  <input value={jobForm.salary}
                    onChange={e => setJobForm({...jobForm, salary: e.target.value})}
                    placeholder="VD: 15-25 triệu/tháng"
                    className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue" />
                </div>
              </div>
              <div>
                <label className="text-xs text-linkedin-muted font-medium">Mô tả công việc *</label>
                <textarea required value={jobForm.description}
                  onChange={e => setJobForm({...jobForm, description: e.target.value})}
                  placeholder="Mô tả chi tiết về công việc..."
                  rows={4}
                  className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue resize-none" />
              </div>
              <div>
                <label className="text-xs text-linkedin-muted font-medium">Yêu cầu</label>
                <textarea value={jobForm.requirements}
                  onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                  placeholder="Yêu cầu về kỹ năng, kinh nghiệm..."
                  rows={3}
                  className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-1 focus:outline-none focus:border-linkedin-blue resize-none" />
              </div>
              <button type="submit" disabled={posting}
                className="w-full py-3 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-linkedin-darkblue disabled:opacity-50">
                {posting ? 'Đang đăng...' : 'Đăng việc làm'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-1">Ứng tuyển: {selectedJob.title}</h3>
            <p className="text-sm text-linkedin-muted mb-4">{selectedJob.company}</p>
            <form onSubmit={handleApply}>
              <label className="text-sm font-medium text-linkedin-text">Thư xin việc</label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..."
                rows={5}
                className="w-full px-3 py-2 border border-linkedin-border rounded-lg text-sm mt-2 focus:outline-none focus:border-linkedin-blue resize-none"
              />
              <div className="flex gap-2 mt-4">
                <button type="submit" disabled={applying}
                  className="flex-1 py-2.5 bg-linkedin-blue text-white rounded-full font-semibold hover:bg-linkedin-darkblue disabled:opacity-50">
                  {applying ? 'Đang gửi...' : 'Gửi ứng tuyển'}
                </button>
                <button type="button" onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 border border-linkedin-border rounded-full text-sm font-semibold hover:bg-linkedin-gray">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
export default JobsPage;