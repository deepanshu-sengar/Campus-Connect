import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, User, Menu, LogOut } from 'lucide-react';
import { navItems } from '../data/collegeData';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const navLinkClass = ({ isActive }) => `navbar-link ${isActive ? 'navbar-link-active' : ''}`;

  const handleAuth = () => {
    if (user) navigate('/profile');
    else navigate('/login');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">
          <NavLink to="/" className="navbar-logo">
            <div className="navbar-logo-icon"><GraduationCap size={22} /></div>
            ABES EC
          </NavLink>

          <ul className="navbar-links">
            {navItems.map(item => (
              <li key={item.path}><NavLink to={item.path} className={navLinkClass} end={item.path === '/'}>{item.label}</NavLink></li>
            ))}
          </ul>

          <div className="navbar-actions">
            <button className="navbar-login" onClick={handleAuth}>
              {user ? (user.displayName?.split(' ')[0] || 'Profile') : 'Student Login'}
            </button>
            <div className="navbar-profile" onClick={handleAuth}><User size={18} /></div>
            {user && (
              <button className="navbar-profile" title="Sign out" onClick={async () => { await logout(); navigate('/'); }}>
                <LogOut size={17} />
              </button>
            )}
            <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={navLinkClass} end={item.path === '/'} style={{ display: 'block', padding: '14px 16px' }}>{item.label}</NavLink>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 12, width: 'fit-content' }} onClick={handleAuth}>
          {user ? 'Profile' : 'Student Login'}
        </button>
      </div>
    </>
  );
}
