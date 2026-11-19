import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createManagedUser } from '../services/admin';
import { communities as fallbackCommunities } from '../data/communities';
import { events as fallbackEvents } from '../data/events';
import { setDocument } from '../services/firestore';

export default function AdminPage() {
  const { user, role } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'student',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/profile" replace />;

  const seedData = async () => {
    setError('');
    setMessage('');
    setSeedLoading(true);
    try {
      const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await Promise.all([
        ...fallbackCommunities.map(item => setDocument('communities', slug(item.name), { ...item, id: slug(item.name) })),
        ...fallbackEvents.map(item => setDocument('events', slug(item.title), { ...item, id: slug(item.title) })),
      ]);
      setMessage('Default communities and events have been added to Firestore.');
    } catch (err) {
      setError(err?.message || 'Unable to seed default data.');
    } finally {
      setSeedLoading(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await createManagedUser(form);
      setMessage(`${form.role === 'faculty' ? 'Faculty' : 'Student'} account created successfully.`);
      setForm({ name: '', email: '', password: '', confirm: '', role: 'student' });
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 620 }}>
        <div className="auth-logo"><ShieldCheck size={28} /></div>
        <h1>Admin User Management</h1>
        <p>Create controlled Campus Connect accounts for students and faculty.</p>

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label>Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Role
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </label>
          <label>Password<input required minLength={6} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <label>Confirm password<input required minLength={6} type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} /></label>
          <button className="btn btn-primary auth-submit" disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>


        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(148,163,184,0.2)' }}>
          <h3 style={{ marginBottom: 8 }}>Initial Campus Data</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.75, marginBottom: 14 }}>Use this once after deploying the updated Firestore rules to populate the default communities and events.</p>
          <button type="button" className="btn btn-secondary auth-submit" onClick={seedData} disabled={seedLoading}>
            {seedLoading ? 'Adding default data...' : 'Seed Communities & Events'}
          </button>
        </div>

        <p style={{ marginTop: 18, fontSize: '0.85rem', opacity: 0.75 }}>
          The new user receives the email and password you provide. Students cannot create accounts or upload academic notes.
        </p>
      </div>
    </div>
  );
}
