import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', dateOfBirth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.register(form);
      if (res.success) {
        navigate('/login');
      } else {
        setError(res.message);
      }
    } catch {
      setError('Đã xảy ra lỗi, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linkedin-gray flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-linkedin-blue">InteractHub</h1>
        <p className="text-linkedin-muted mt-1">Tạo tài khoản mới</p>
      </div>

      <div className="bg-white rounded-lg border border-linkedin-border p-8 w-full max-w-md shadow-sm">
        <h2 className="text-2xl font-semibold text-linkedin-text mb-6">Đăng ký</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-linkedin-text mb-1">Họ và tên</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-3 border border-linkedin-border rounded-lg focus:outline-none focus:border-linkedin-blue text-sm"
              placeholder="Họ và tên của bạn"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-linkedin-text mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border border-linkedin-border rounded-lg focus:outline-none focus:border-linkedin-blue text-sm"
              placeholder="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-linkedin-text mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-linkedin-border rounded-lg focus:outline-none focus:border-linkedin-blue text-sm"
              placeholder="Email của bạn"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-linkedin-text mb-1">Mật khẩu</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-linkedin-border rounded-lg focus:outline-none focus:border-linkedin-blue text-sm"
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-linkedin-text mb-1">Ngày sinh</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 border border-linkedin-border rounded-lg focus:outline-none focus:border-linkedin-blue text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linkedin-blue text-white py-3 rounded-full font-semibold hover:bg-linkedin-darkblue disabled:opacity-50"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-linkedin-muted">Đã có tài khoản? </span>
          <Link to="/login" className="text-linkedin-blue font-semibold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;