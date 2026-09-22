import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.displayName || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.displayName || '');
  }, [user]);

  const save = async e => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await updateUserProfile(name);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><User size={28} /></div>
        <h1>My Profile</h1>
        <p>{user?.email}</p>

        {message && <div className={message.includes('successfully') ? 'auth-success' : 'auth-error'}>{message}</div>}

        <form className="auth-form" onSubmit={save}>
          <label>
            Full name
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <button className="btn btn-primary auth-submit" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <button className="btn btn-secondary auth-submit" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}
