import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function EmergencyAccessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heartbeatSending, setHeartbeatSending] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [notice, setNotice] = useState(null);

  // Death Claim states
  const [ownerClaims, setOwnerClaims] = useState([]);
  const [reviewerClaims, setReviewerClaims] = useState([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimOwnerId, setClaimOwnerId] = useState('');
  const [claimFile, setClaimFile] = useState(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReviewClaim, setSelectedReviewClaim] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchEmergencyStatus();
    fetchDeathClaims();
  }, []);

  const fetchDeathClaims = async () => {
    try {
      const [ownerRes, reviewRes] = await Promise.allSettled([
        api.get('/claims/owner-claims'),
        api.get('/claims/review-queue')
      ]);
      if (ownerRes.status === 'fulfilled' && ownerRes.value.data?.success) {
        setOwnerClaims(ownerRes.value.data.data || []);
      }
      if (reviewRes.status === 'fulfilled' && reviewRes.value.data?.success) {
        setReviewerClaims(reviewRes.value.data.data || []);
      }
    } catch {
      // Non-blocking if role is not authorized for review-queue
    }
  };

  const handleVetoClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to Veto this death claim and confirm you are alive?')) {
      return;
    }
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await api.post(`/claims/${claimId}/veto`);
      if (res.data && res.data.success) {
        setNotice({
          type: 'success',
          text: '✓ Death claim successfully VETOED. Your active survival has been registered and verified.'
        });
        fetchEmergencyStatus();
        fetchDeathClaims();
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to veto death claim.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimFile || !claimOwnerId || !claimNotes.trim()) {
      alert('Please fill out all required fields and attach supporting evidence.');
      return;
    }
    setActionLoading(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append('ownerId', claimOwnerId);
      formData.append('evidenceFile', claimFile);
      formData.append('evidenceNotes', claimNotes);

      const res = await api.post('/claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setNotice({
          type: 'success',
          text: '✓ Formal death claim submitted successfully. The 7-day challenge window has started.'
        });
        setShowClaimModal(false);
        setClaimOwnerId('');
        setClaimFile(null);
        setClaimNotes('');
        fetchDeathClaims();
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit death claim.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (claimId, decision) => {
    if (!reviewNotes.trim() || reviewNotes.trim().length < 10) {
      alert('Written justification notes (minimum 10 characters) are required for review decisions.');
      return;
    }
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await api.post(`/claims/${claimId}/review`, {
        decision: decision,
        reviewNotes: reviewNotes.trim()
      });
      if (res.data && res.data.success) {
        setNotice({
          type: 'success',
          text: `✓ Claim review recorded as ${decision}. ${decision === 'APPROVED' ? 'Eligible digital assets have been released.' : ''}`
        });
        setSelectedReviewClaim(null);
        setReviewNotes('');
        fetchDeathClaims();
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to record review decision.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadEvidence = async (claimId, fileName) => {
    try {
      const res = await api.get(`/claims/${claimId}/evidence`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'evidence_file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download evidence document.');
    }
  };

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
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Death Claims Filed Against Your Vault
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Pending claims trigger a mandatory <strong>7-Day Veto Window</strong>. If you are alive, clicking "Veto Claim / Confirm Alive" instantly revokes the claim, records survival proof, and notifies all parties.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowClaimModal(true)}
            style={{ fontSize: '0.85rem' }}
          >
            + File Death Claim as Deputy / Contact
          </button>
        </div>

        {ownerClaims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              No Claims Filed Against Your Account
            </strong>
            <span>Your vault has 0 active death claims. All digital assets remain safely protected and sealed.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {ownerClaims.map(claim => (
              <div
                key={claim.id}
                style={{
                  padding: '1.2rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: claim.status === 'UNDER_REVIEW' || claim.status === 'PENDING_REVIEW'
                    ? '1px solid rgba(244, 63, 94, 0.5)'
                    : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Claim #{claim.id} &bull; Filed: {new Date(claim.createdAt).toLocaleString()}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0' }}>Claimant: {claim.claimantName} ({claim.claimantEmail})</h3>
                  </div>
                  <span className={`badge ${
                    claim.status === 'APPROVED' ? 'badge-danger' :
                    claim.status === 'VETOED_BY_OWNER' ? 'badge-success' :
                    claim.status === 'REJECTED' ? 'badge-secondary' : 'badge-warning'
                  }`}>
                    {claim.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', backgroundColor: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Claimant Statement:</strong> {claim.evidenceNotes || 'No claimant statement provided.'}
                </div>

                {claim.challengeExpiresAt && (
                  <div style={{ fontSize: '0.82rem', color: '#f87171', marginBottom: '1rem' }}>
                    ⚠️ Challenge Window Closes: {new Date(claim.challengeExpiresAt).toLocaleString()}
                  </div>
                )}

                {claim.status === 'PENDING_REVIEW' || claim.status === 'UNDER_REVIEW' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleVetoClaim(claim.id)}
                    disabled={actionLoading}
                    style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
                  >
                    {actionLoading ? 'Processing Veto...' : '🚫 Veto Claim / Confirm Alive Now'}
                  </button>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Status resolved: {claim.status}. Review notes: {claim.reviewNotes || 'N/A'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewer / Admin Verification Queue */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Authorized Verifier Review Queue
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Restricted to authorized estate verifiers and system administrators. Requires written justification before approving or rejecting.
            </p>
          </div>
          <span className="badge badge-info">Audited Decisions</span>
        </div>

        {reviewerClaims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <span>No pending death claims awaiting review in your queue.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviewerClaims.map(claim => (
              <div
                key={claim.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <strong>Claim #{claim.id} — Vault Owner: {claim.ownerEmail}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Claimant: {claim.claimantName} ({claim.claimantEmail}) &bull; Filed: {new Date(claim.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`badge ${
                    claim.status === 'APPROVED' ? 'badge-success' :
                    claim.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {claim.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <strong>Claimant Notes:</strong> {claim.evidenceNotes}
                </div>

                {claim.evidenceFileUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => handleDownloadEvidence(claim.id, claim.evidenceFileName)}
                    >
                      📎 Download &amp; Inspect Official Evidence Document ({claim.evidenceFileName})
                    </button>
                  </div>
                )}

                {selectedReviewClaim?.id === claim.id ? (
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-focus)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Record Review Decision</h4>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Mandatory Justification Notes (Minimum 10 characters):
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Detail certified proof examined, death certificate authority checked, or rejection reasoning..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        style={{ width: '100%', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleReviewSubmit(claim.id, 'APPROVED')}
                        disabled={actionLoading || reviewNotes.trim().length < 10}
                      >
                        Approve Claim &amp; Authorize Releases
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleReviewSubmit(claim.id, 'REJECTED')}
                        disabled={actionLoading || reviewNotes.trim().length < 10}
                        style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f87171' }}
                      >
                        Reject Claim
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { setSelectedReviewClaim(null); setReviewNotes(''); }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  (claim.status === 'PENDING_REVIEW' || claim.status === 'UNDER_REVIEW') && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => { setSelectedReviewClaim(claim); setReviewNotes(''); }}
                    >
                      ⚖️ Evaluate &amp; Record Decision
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Death Claim Modal */}
      {showClaimModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Submit Formal Death Confirmation Claim
              </h2>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Submitting a claim initiates a formal verification process. Inactivity alone never releases assets. Supporting government-issued documentation is encrypted upon upload.
            </p>

            <form onSubmit={handleClaimSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Vault Owner User ID *
                </label>
                <input
                  type="number"
                  className="form-control"
                  required
                  placeholder="e.g. 1"
                  value={claimOwnerId}
                  onChange={(e) => setClaimOwnerId(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Official Evidence Document (PDF, JPEG, PNG, max 10MB) *
                </label>
                <input
                  type="file"
                  className="form-control"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setClaimFile(e.target.files[0])}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Certified death certificate, obituary notice, or probate court filing. Encrypted with AES-256-GCM.
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Claimant Notes / Official Details *
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  required
                  placeholder="State jurisdiction, date of passing, certificate number, or relationship details..."
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClaimModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Uploading & Encrypting...' : 'Submit Claim for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
