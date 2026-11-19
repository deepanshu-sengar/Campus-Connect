import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || '/';

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><GraduationCap size={28} /></div>
        <h1>Campus Connect Login</h1>
        <p>Use the email and password provided by the administrator.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button className="btn btn-primary auth-submit" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">Need an account? Contact the administrator.</p>
      </div>
    </div>
  );
}
