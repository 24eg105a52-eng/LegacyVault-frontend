import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function EmergencyAccessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heartbeatSending, setHeartbeatSending] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchEmergencyStatus();
  }, []);

  const fetchEmergencyStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/emergency-access');
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to retrieve emergency protocol status.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualHeartbeat = async () => {
    setHeartbeatSending(true);
    setNotice(null);
    try {
      const res = await api.post('/emergency-access/heartbeat');
      if (res.data && res.data.success) {
        setNotice({
          type: 'success',
          text: '✓ Heartbeat confirmed! Your activity timestamp has been updated in MySQL and any active grace warnings acknowledged.'
        });
        fetchEmergencyStatus();
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to record check-in ping.'
      });
    } finally {
      setHeartbeatSending(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setNotice(null);
    try {
      const res = await api.post('/emergency-access/test-email');
      if (res.data) {
        setNotice({
          type: 'success',
          text: `✓ ${res.data.message}`
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to trigger test email.'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    setTestingSms(true);
    setNotice(null);
    try {
      const res = await api.post('/emergency-access/test-sms');
      if (res.data) {
        setNotice({
          type: 'success',
          text: `✓ ${res.data.message}`
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to trigger test SMS. Ensure a phone number is saved in your Profile.'
      });
    } finally {
      setTestingSms(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading emergency protocols, notification channels, and heartbeat status...
      </div>
    );
  }

  const lastActivity = data?.lastHeartbeatAt
    ? new Date(data.lastHeartbeatAt).toLocaleString()
    : 'No check-in recorded yet';

  const requests = data?.requests || [];
  const reminders = data?.reminders || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check-in Protocols &amp; Dead-Man Switch Guard</h1>
        <p className="page-subtitle">
          Automated inactivity watchdog with guaranteed estate protections ensuring assets are never released on missed check-ins alone.
        </p>
      </div>

      {notice && (
        <div
          className={`alert ${notice.type === 'success' ? 'alert-success' : ''}`}
          style={notice.type === 'error' ? {
            backgroundColor: 'var(--accent-rose-light)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fca5a5',
            marginBottom: '1.5rem'
          } : { marginBottom: '1.5rem' }}
        >
          {notice.text}
        </div>
      )}

      {/* Heartbeat Monitor & Multi-Tier Rules */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Inactivity Heartbeat Monitor</h2>
            <span className={`badge ${data?.inactivityStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
              {data?.inactivityStatus || 'ACTIVE'}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Your vault monitors presence on a periodic cadence of <strong>{data?.inactivityThresholdDays || 30} days</strong>. Logging in or clicking the button below confirms your active presence.
          </p>

          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Registered Activity:</span>
              <strong>{lastActivity}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Inactivity Protocol Status:</span>
              <span className="badge badge-info">{data?.inactivityStatus || 'ACTIVE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Warning Grace Window:</span>
              <strong>{data?.gracePeriodDays || 14} Days</strong>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleManualHeartbeat}
            disabled={heartbeatSending}
          >
            {heartbeatSending ? 'Recording Heartbeat...' : '✓ Confirm Check-in Ping Now'}
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Multi-Tier Safety Rules</h2>
            <span className="badge badge-info">Zero False Releases</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>1. Warning Grace Period ({data?.gracePeriodDays || 14} Days):</strong>
              <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                Multi-channel warnings (Email + SMS) are sent before any policy evaluation begins.
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>2. Mandatory Veto Window ({data?.emergencyDelayHours ? Math.round(data.emergencyDelayHours / 24) : 7} Days):</strong>
              <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                Vault owners maintain an uncompromised delay window to reject or cancel false claims.
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>3. Non-Immediate Dead-Man Switch:</strong>
              <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                Assets are <strong>NEVER released automatically</strong> on a missed check-in alone. Legal proof or verified deputy identity is always mandatory.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Delivery Channels Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notification Delivery Channels</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Real multi-channel delivery configuration for inactivity warnings and emergency alerts.
            </p>
          </div>
          <span className="badge badge-info">Configurable Delivery</span>
        </div>

        <div className="grid-2">
          {/* SMTP Channel */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✉️</span>
                <strong>SMTP Email Delivery</strong>
              </div>
              <span className={`badge ${data?.isEmailConfigured ? 'badge-success' : 'badge-warning'}`}>
                {data?.isEmailConfigured ? 'Live SMTP Active' : 'Simulated (Logged)'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {data?.isEmailConfigured
                ? `Active sender: ${data?.mailFrom || 'noreply@legacyvault.local'} (Configured via MAIL_USERNAME and MAIL_PASSWORD).`
                : 'SMTP credentials unset. Alerts are safely recorded to server logs without failing.'}
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleTestEmail}
              disabled={testingEmail}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: '100%' }}
            >
              {testingEmail ? 'Sending Test Email...' : 'Send Test Email Notification'}
            </button>
          </div>

          {/* Twilio SMS Channel */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📱</span>
                <strong>Twilio SMS Gateway</strong>
              </div>
              <span className={`badge ${data?.isSmsConfigured ? 'badge-success' : 'badge-warning'}`}>
                {data?.isSmsConfigured ? 'Twilio SMS Active' : 'Simulated (Logged)'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {data?.isSmsConfigured
                ? 'Twilio API credentials configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).'
                : 'Twilio SMS credentials unset. Security SMS messages are safely recorded to server logs.'}
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleTestSms}
              disabled={testingSms}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: '100%' }}
            >
              {testingSms ? 'Sending Test SMS...' : 'Send Test SMS Notification'}
            </button>
          </div>
        </div>
      </div>

      {/* Grace Period Reminders History */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Grace Period Warning History
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Audit log of multi-channel warning notices dispatched by the automated background scheduler.
        </p>

        {reminders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
            <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              All Clear &bull; No Inactivity Warnings Issued
            </strong>
            <span>Your account is in good standing. No warning notices have been triggered.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.map(rem => (
              <div
                key={rem.id}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>
                    Notice #{rem.reminderNumber}: Sent to {rem.sentToEmail}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Dispatched {new Date(rem.createdAt).toLocaleString()} &bull; Grace Expires: {new Date(rem.gracePeriodExpiresAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`badge ${rem.status === 'ACKNOWLEDGED_BY_USER' ? 'badge-success' : rem.status === 'SENT' ? 'badge-warning' : 'badge-danger'}`}>
                  {rem.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Requests Section */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Active Emergency Access Claims
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Claims initiated by designated emergency deputies or estate verifiers.
        </p>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              No Emergency Access Claims Pending
            </strong>
            <span>Your vault has 0 active or historical emergency access claims. All assets remain securely locked.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map(req => (
              <div key={req.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Claim #{req.id}</strong>
                  <span className="badge badge-warning">{req.requestStatus}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reason: {req.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
