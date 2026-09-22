import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><GraduationCap size={28} /></div>
        <h1>Create Student Account</h1>
        <p>Join your campus community.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <label>Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <label>Confirm password<input type="password" required minLength={6} value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /></label>
          <button className="btn btn-primary auth-submit" disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
