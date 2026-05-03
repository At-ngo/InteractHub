import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { isAdminFromToken } from '../services/jwt';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/common/ConfirmModal';
import { postService } from '../services/postService';

const AdminReportsPage: React.FC = () => {
  useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isAdminFromToken(token)) {
      navigate('/');
      return;
    }
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/Reports');
      if (res.data.success) setReports(res.data.data);
    } catch (e) {}
    setLoading(false);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const openActionModal = async (report: any, action: string) => {
    setSelectedReport(report); setSelectedAction(action);
    setModalTitle(action === 'ban-user' ? 'Khóa tài khoản' : (action === 'warn-user' ? 'Cảnh cáo người dùng' : (action === 'delete-post' ? 'Xóa bài viết' : 'Xóa bình luận')));
    setModalMessage('Bạn sắp thực hiện hành động này. Xem trước nội dung phía dưới (nếu có) và xác nhận.');
    setPreviewHtml(null);
    // fetch preview if post or comment
    try {
      if (action === 'delete-post') {
        const pid = Number(report.entityId);
        const res = await postService.getPost(pid); // returns ApiResponse<Post>
        if (res && res.success) setPreviewHtml(res.data?.content || '');
      } else if (action === 'delete-comment') {
        const cid = Number(report.entityId);
        const res = await api.get(`/Posts/comments/${cid}`);
        if (res.data && res.data.success) setPreviewHtml(res.data.data.content || '');
      }
    } catch (e) { /* ignore preview errors */ }
    setModalOpen(true);
  };

  const doActionConfirmed = async () => {
    if (!selectedReport || !selectedAction) return;
    const msg = prompt('Ghi chú cho hành động (message) - có thể để trống') || '';
    try {
      await api.post(`/Reports/${selectedReport.id}/take-action`, { action: selectedAction, message: msg });
      setModalOpen(false);
      alert('Đã thực hiện hành động');
      loadReports();
    } catch (e) { alert('Không thể thực hiện hành động'); }
  };

  const [expanded, setExpanded] = useState<number | null>(null);
  const [appeals, setAppeals] = useState<Record<number, any[]>>({});

  const toggleAppeals = async (reportId: number) => {
    if (expanded === reportId) { setExpanded(null); return; }
    setExpanded(reportId);
    if (!appeals[reportId]) {
      try {
        const res = await api.get(`/Reports/${reportId}/appeals`);
        if (res.data.success) setAppeals(prev => ({ ...prev, [reportId]: res.data.data }));
      } catch (e) { setAppeals(prev => ({ ...prev, [reportId]: [] })); }
    }
  };

  const resolveAppeal = async (reportId: number, appealId: number, approve: boolean) => {
    try {
      await api.put(`/Reports/${reportId}/appeals/${appealId}/resolve`, { approve });
      alert('Đã xử lý kháng cáo');
      // refresh appeals and reports
      const res = await api.get(`/Reports/${reportId}/appeals`);
      if (res.data.success) setAppeals(prev => ({ ...prev, [reportId]: res.data.data }));
      loadReports();
    } catch (e) { alert('Không thể xử lý kháng cáo'); }
  };

  const resolveReport = async (id: number) => {
    try {
      await api.put(`/Reports/${id}/resolve`);
      setReports(reports.map(r => r.id === id ? { ...r, isResolved: true } : r));
    } catch (e) { alert('Không thể xử lý báo cáo'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý báo cáo</h2>
      {loading && <p>Đang tải...</p>}
      {!loading && reports.length === 0 && <p>Không có báo cáo</p>}
      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id} className="bg-white p-4 rounded border">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-semibold">{r.type} · {r.entityId}</p>
                <p className="text-sm text-linkedin-muted">Báo cáo bởi: {r.reporter?.fullName ?? r.reporterId} · {new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openActionModal(r, 'ban-user')} className="px-3 py-1 bg-red-600 text-white rounded">Khóa tài khoản</button>
                <button onClick={() => openActionModal(r, 'delete-post')} className="px-3 py-1 bg-orange-500 text-white rounded">Xóa bài</button>
                <button onClick={() => openActionModal(r, 'delete-comment')} className="px-3 py-1 bg-orange-500 text-white rounded">Xóa cmt</button>
                <button onClick={() => openActionModal(r, 'warn-user')} className="px-3 py-1 bg-yellow-500 text-black rounded">Cảnh cáo</button>
                {r.isResolved ? (<span className="text-sm text-green-600">Đã xử lý</span>) : (<button onClick={() => resolveReport(r.id)} className="px-3 py-1 bg-linkedin-blue text-white rounded">Đánh dấu đã xử lý</button>)}
              </div>
            </div>
            <p className="text-sm">Lý do: {r.reason}</p>
                <div className="mt-3">
                  <button onClick={() => toggleAppeals(r.id)} className="text-sm text-linkedin-blue">{expanded === r.id ? 'Ẩn kháng cáo' : 'Xem kháng cáo'}</button>
                  {expanded === r.id && (
                      <div className="mt-2 border-t pt-2">
                        {(appeals[r.id] || []).length === 0 ? (<p className="text-sm text-linkedin-muted">Không có kháng cáo</p>) : (
                          (appeals[r.id] || []).map(a => (
                            <div key={a.id} className="p-2 border rounded mb-2">
                              <p className="text-sm">{a.reason}</p>
                              <p className="text-xs text-linkedin-muted">{new Date(a.createdAt).toLocaleString()} · {a.requesterId}</p>
                              {a.isResolved ? (<p className="text-xs text-green-600">Đã xử lý</p>) : (
                                <div className="mt-2 flex gap-2">
                                  <button onClick={() => resolveAppeal(r.id, a.id, true)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Chấp nhận</button>
                                  <button onClick={() => resolveAppeal(r.id, a.id, false)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Từ chối</button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                </div>
          </div>
        ))}
      </div>
        {/* Confirm modal with preview */}
        <ConfirmModal open={modalOpen} title={modalTitle} message={(modalMessage + (previewHtml ? '\n\nPreview:\n' + previewHtml : ''))} onCancel={() => setModalOpen(false)} onConfirm={doActionConfirmed} confirmLabel="Thực hiện" />
    </div>
  );
};

export default AdminReportsPage;
