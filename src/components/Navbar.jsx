import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={token ? '/dashboard' : '/'} className="brand">
          <div className="brand-badge">🔐</div>
          <span>LegacyVault</span>
        </Link>

        <nav>
          <ul className="nav-links">
            {token ? (
              <>
                <li>
                  <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/vault" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    My Vault
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/contacts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Trusted Contacts
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/emergency-access" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Emergency Protocols
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Profile
                  </NavLink>
                </li>
              </>
            ) : (
              <li>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Home
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="nav-actions">
          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/profile" className="btn btn-outline" style={{ padding: '0.45rem 0.85rem' }}>
                👤 {user?.fullName ? user.fullName.split(' ')[0] : 'Profile'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.45rem 0.85rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 0.85rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
