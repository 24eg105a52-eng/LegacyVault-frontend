import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverSuccess, setServerSuccess] = useState(null);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
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
      const response = await api.post('/auth/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data && response.data.success) {
        setServerSuccess(response.data.message || 'User registered successfully! You can now log in.');
        setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      } else {
        setServerError(response.data?.message || 'Registration was rejected by the server.');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setServerError(err.response.data.message || 'Registration failed.');
        if (err.response.data.data && typeof err.response.data.data === 'object') {
          setErrors(err.response.data.data);
        }
      } else if (err.code === 'ERR_NETWORK') {
        setServerError('Cannot reach backend server. Please make sure the Spring Boot backend is running on http://localhost:8080.');
      } else {
        setServerError('An unexpected error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Create Your Vault Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Set up encrypted digital legacy management
          </p>
        </div>

        {serverSuccess && (
          <div className="alert alert-success" role="alert">
            <div><strong>✓ Registration Successful!</strong></div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>{serverSuccess}</div>
            <div style={{ marginTop: '0.85rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => navigate('/login')}
              >
                Proceed to Sign In →
              </button>
            </div>
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
            <strong>✕ Registration Error:</strong> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="e.g. Alexander Hamilton"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={loading}
            />
            {errors.fullName && <span className="form-error">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. alexander@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Master Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Re-type your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register Secure Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
