import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ fullName: '', phoneNumber: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/profile');
      if (res.data && res.data.success) {
        setProfile(res.data.data);
        setProfileForm({
          fullName: res.data.data.fullName || '',
          phoneNumber: res.data.data.phoneNumber || ''
        });
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileNotice(null);
    if (!profileForm.fullName.trim()) {
      setProfileNotice({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setProfileSaving(true);
    try {
      const res = await api.put('/user/profile', profileForm);
      if (res.data && res.data.success) {
        setProfile(res.data.data);
        // Sync cached user in localStorage
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.fullName = res.data.data.fullName;
        localStorage.setItem('user', JSON.stringify(stored));

        setProfileNotice({ type: 'success', text: '✓ Profile updated successfully.' });
      } else {
        setProfileNotice({ type: 'error', text: res.data?.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileNotice({
        type: 'error',
        text: err.response?.data?.message || 'Error saving profile details.'
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!passwordForm.currentPassword) {
      setPasswordNotice({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setPasswordNotice({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.post('/user/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.data && res.data.success) {
        setPasswordNotice({ type: 'success', text: '✓ Password updated successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordNotice({ type: 'error', text: res.data?.message || 'Password update rejected.' });
      }
    } catch (err) {
      setPasswordNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please verify current password.'
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading profile data from secure vault...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Account Security &amp; Profile</h1>
          <p className="page-subtitle">Manage your verified identity, credentials, and session settings.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ borderColor: 'var(--accent-rose)', color: '#fca5a5' }}
        >
          Sign Out
        </button>
      </div>

      {/* Profile Details Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Personal Details
        </h2>

        {profileNotice && (
          <div
            className={`alert ${profileNotice.type === 'success' ? 'alert-success' : ''}`}
            style={profileNotice.type === 'error' ? {
              backgroundColor: 'var(--accent-rose-light)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fca5a5',
              marginBottom: '1.25rem'
            } : { marginBottom: '1.25rem' }}
          >
            {profileNotice.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email Address (Immutable Identity)</label>
              <input
                type="text"
                className="form-input"
                value={profile?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Account identifier bound to your encryption keys.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input
                id="phoneNumber"
                type="text"
                className="form-input"
                placeholder="e.g. +1 (555) 012-3456"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Inactivity Protocol Status</label>
              <input
                type="text"
                className="form-input"
                value={`${profile?.inactivityStatus || 'ACTIVE'} (Cadence: ${profile?.inactivityThresholdDays || 30} days)`}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileSaving}
            style={{ marginTop: '0.5rem' }}
          >
            {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Change Master Password
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Verify your current password to rotate to a new BCrypt-hashed master credential.
        </p>

        {passwordNotice && (
          <div
            className={`alert ${passwordNotice.type === 'success' ? 'alert-success' : ''}`}
            style={passwordNotice.type === 'error' ? {
              backgroundColor: 'var(--accent-rose-light)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fca5a5',
              marginBottom: '1.25rem'
            } : { marginBottom: '1.25rem' }}
          >
            {passwordNotice.text}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Current Master Password</label>
            <input
              id="currentPassword"
              type="password"
              className="form-input"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="Minimum 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-type new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={passwordSaving}
            style={{ marginTop: '0.5rem' }}
          >
            {passwordSaving ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
