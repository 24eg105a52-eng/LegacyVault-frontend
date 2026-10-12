import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to vault service.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Retrieving your verified digital estate metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert" style={{ backgroundColor: 'var(--accent-rose-light)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fca5a5' }}>
          <strong>✕ Dashboard Notice:</strong> {error}
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button type="button" onClick={fetchDashboardStats} className="btn btn-secondary">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Digital Assets Secured',
      value: stats ? stats.assetCount : 0,
      subtext: stats?.assetCount === 0 ? 'No assets added yet' : 'AES-256-GCM encrypted records',
      icon: '🗄️',
      badge: stats?.assetCount > 0 ? 'Active' : 'Empty',
      badgeClass: stats?.assetCount > 0 ? 'badge-success' : 'badge-warning',
      link: '/vault'
    },
    {
      label: 'Trusted Contacts',
      value: stats ? stats.contactCount : 0,
      subtext: stats?.contactCount === 0 ? 'No contacts designated yet' : 'Designated inheritance contacts',
      icon: '👥',
      badge: stats?.contactCount > 0 ? 'Configured' : 'Needs Setup',
      badgeClass: stats?.contactCount > 0 ? 'badge-info' : 'badge-warning',
      link: '/contacts'
    },
    {
      label: 'Check-in Status',
      value: stats?.checkInStatus || 'Active',
      subtext: `Next check-in in ${stats?.daysUntilNextCheckIn ?? 30} days`,
      icon: '⏱️',
      badge: stats?.daysUntilNextCheckIn > 7 ? 'On Schedule' : 'Action Required',
      badgeClass: stats?.daysUntilNextCheckIn > 7 ? 'badge-success' : 'badge-warning',
      link: '/emergency-access'
    },
    {
      label: 'Emergency Access Claims',
      value: stats ? stats.pendingEmergencyRequestsCount : 0,
      subtext: stats?.pendingEmergencyRequestsCount === 0 ? 'No pending claims' : 'Review claims immediately',
      icon: '🚨',
      badge: stats?.pendingEmergencyRequestsCount === 0 ? 'Clear' : 'Review Required',
      badgeClass: stats?.pendingEmergencyRequestsCount === 0 ? 'badge-info' : 'badge-warning',
      link: '/emergency-access'
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Digital Estate Dashboard</h1>
          <p className="page-subtitle">
            {user?.fullName ? `Welcome back, ${user.fullName}. Your digital legacy protections are active.` : 'Welcome back. Your digital legacy protections are active.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/vault" className="btn btn-primary">
            + Add Digital Asset
          </Link>
          <Link to="/emergency-access" className="btn btn-secondary">
            Heartbeat Check-in
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {metrics.map((item, index) => (
          <Link key={index} to={item.link} className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              <span className={`badge ${item.badgeClass}`}>{item.badge}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {item.subtext}
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid: Policy Summary & Real Audit Activity */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Active Protection Policy</h2>
            <span className="badge badge-success">Automated Guard</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Check-in Cadence:</span>
              <strong>Every 30 Days</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Inactivity Warning Grace Period:</span>
              <strong>14 Days</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Emergency Veto Window:</span>
              <strong>7 Days (Owner veto window)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Automatic Release on Missed Ping:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>Strictly Disabled (Verification Required)</strong>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/emergency-access" className="btn btn-outline btn-block">
              Review Protocols &amp; Check-ins &rarr;
            </Link>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Real Audit Trail</h2>
            <span className="badge badge-info">Immutable Log</span>
          </div>

          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {stats.recentActivities.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{evt.action}</strong>
                    <span className="badge badge-info">{evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{evt.details}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No audit activities recorded yet. Actions such as logins, asset creation, and profile edits will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
