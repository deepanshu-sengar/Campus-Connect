import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><GraduationCap size={28} /></div>
        <h1>Student Login</h1>
        <p>Sign in to use Campus Connect features.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button className="btn btn-primary auth-submit" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button className="btn btn-secondary auth-google" onClick={googleLogin} disabled={loading}>
          Continue with Google
        </button>

        <p className="auth-switch">New student? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
