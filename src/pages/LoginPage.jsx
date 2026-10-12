import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverSuccess, setServerSuccess] = useState(null);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data && response.data.success) {
        if (response.data.data) {
          if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
          }
          localStorage.setItem('user', JSON.stringify({
            id: response.data.data.id,
            email: response.data.data.email,
            fullName: response.data.data.fullName,
            role: response.data.data.role,
            inactivityStatus: response.data.data.inactivityStatus
          }));
        }

        setServerSuccess(response.data.message || 'Login successful! Redirecting to dashboard...');
        
        // Navigate to the dashboard after successful authentication
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      } else {
        setServerError(response.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setServerError(err.response.data.message || 'Invalid email or password.');
        if (err.response.data.data && typeof err.response.data.data === 'object') {
          setErrors(err.response.data.data);
        }
      } else if (err.code === 'ERR_NETWORK') {
        setServerError('Cannot reach backend server. Please make sure the Spring Boot backend is running on http://localhost:8080.');
      } else {
        setServerError('An unexpected error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Sign In to LegacyVault</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Access your secure digital estate dashboard
          </p>
        </div>

        {serverSuccess && (
          <div className="alert alert-success" role="alert">
            <strong>✓ Authentication Successful!</strong>
            <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>{serverSuccess}</div>
          </div>
        )}

        {serverError && (
          <div
            className="alert"
            style={{
              backgroundColor: 'var(--accent-rose-light)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fca5a5'
            }}
            role="alert"
          >
            <strong>✕ Sign-in Error:</strong> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Master Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your master password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Vault'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
}
