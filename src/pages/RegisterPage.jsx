import { Link } from 'react-router-dom';
import { GraduationCap, LogIn } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><GraduationCap size={28} /></div>
        <h1>Account Access</h1>
        <p>Campus Connect accounts are created by the administrator.</p>
        <div className="auth-error" style={{ margin: '20px 0' }}>
          Self-registration is disabled. Please contact the Campus Connect administrator to receive your email and password.
        </div>
        <Link className="btn btn-primary auth-submit" to="/login">
          <LogIn size={18} /> Go to Login
        </Link>
      </div>
    </div>
  );
}
