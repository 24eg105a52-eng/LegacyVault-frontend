import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ROLES = [
  { value: 'BENEFICIARY', label: 'Primary Beneficiary (Inheritance Recipient)' },
  { value: 'EMERGENCY_DEPUTY', label: 'Emergency Deputy (Authorized Claim Requester)' },
  { value: 'LEGAL_VERIFIER', label: 'Legal Verifier (Attorney / Estate Trustee)' }
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [vaultAssets, setVaultAssets] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Policy Modal state
  const [selectedContactForPolicy, setSelectedContactForPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    assetId: '',
    permissionLevel: 'VIEW_ONLY',
    releaseTrigger: 'APPROVED_EMERGENCY_CLAIM',
    requiresLegalVerification: false,
    isAuthorized: true
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    relationship: '',
    roleType: 'BENEFICIARY'
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [contactsRes, assetsRes, policiesRes] = await Promise.allSettled([
        api.get('/contacts'),
        api.get('/vault'),
        api.get('/policies')
      ]);

      if (contactsRes.status === 'fulfilled' && contactsRes.value.data?.success) {
        setContacts(contactsRes.value.data.data || []);
      }
      if (assetsRes.status === 'fulfilled' && assetsRes.value.data?.success) {
        setVaultAssets(assetsRes.value.data.data || []);
      }
      if (policiesRes.status === 'fulfilled' && policiesRes.value.data?.success) {
        setPolicies(policiesRes.value.data.data || []);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to retrieve data.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.relationship.trim()) {
      setFeedback({ type: 'error', text: 'Name, email, and relationship are required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post('/contacts', form);
      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          text: `✓ Added contact ${form.fullName}. A single-use verification email was dispatched.`
        });
        setShowAddModal(false);
        setForm({ fullName: '', email: '', phoneNumber: '', relationship: '', roleType: 'BENEFICIARY' });
        loadAllData();
      } else {
        setFeedback({ type: 'error', text: res.data?.message || 'Could not add contact.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save contact.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (id, name) => {
    try {
      setResendingId(id);
      setFeedback(null);
      const res = await api.post(`/contacts/${id}/resend-invite`);
      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          text: `✓ Fresh invitation link with 7-day expiration resent to ${name}.`
        });
        loadAllData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to resend invitation.'
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove trusted contact "${name}" from your vault?`)) {
      return;
    }

    try {
      const res = await api.delete(`/contacts/${id}`);
      if (res.data && res.data.success) {
        setFeedback({ type: 'success', text: `✓ Contact "${name}" removed.` });
        loadAllData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove contact.'
      });
    }
  };

  // Policy configuration
  const handleOpenPolicyModal = (contact) => {
    setSelectedContactForPolicy(contact);
    setPolicyForm({
      assetId: vaultAssets[0]?.id ? String(vaultAssets[0].id) : '',
      permissionLevel: 'VIEW_ONLY',
      releaseTrigger: 'APPROVED_EMERGENCY_CLAIM',
      requiresLegalVerification: false,
      isAuthorized: true
    });
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!policyForm.assetId) {
      alert('Please select a vault asset to assign.');
      return;
    }

    try {
      setSavingPolicy(true);
      const payload = {
        assetId: Number(policyForm.assetId),
        contactId: selectedContactForPolicy.id,
        permissionLevel: policyForm.permissionLevel,
        releaseTrigger: policyForm.releaseTrigger,
        requiresLegalVerification: policyForm.requiresLegalVerification,
        isAuthorized: policyForm.isAuthorized
      };

      const res = await api.post('/policies', payload);
      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          text: `✓ Release policy saved for ${selectedContactForPolicy.fullName}.`
        });
        setSelectedContactForPolicy(null);
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm('Revoke this release policy?')) return;
    try {
      const res = await api.delete(`/policies/${policyId}`);
      if (res.data && res.data.success) {
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete policy.');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Trusted Contacts &amp; Asset Release Policies</h1>
          <p className="page-subtitle">
            Designate inheritance beneficiaries, manage single-use email verification, and assign explicit asset-release rules.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowAddModal(!showAddModal); setFeedback(null); }}
        >
          {showAddModal ? '✕ Close Form' : '+ Add Trusted Contact'}
        </button>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.type === 'success' ? 'alert-success' : ''}`}
          style={feedback.type === 'error' ? {
            backgroundColor: 'var(--accent-rose-light)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fca5a5',
            marginBottom: '1.5rem'
          } : { marginBottom: '1.5rem' }}
        >
          {feedback.text}
        </div>
      )}

      {/* Add Contact Modal / Card */}
      {showAddModal && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-focus)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Designate New Trusted Contact
          </h2>
          <form onSubmit={handleAddSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Eleanor Vance"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="eleanor@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">Phone Number (Optional)</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="relationship">Relationship *</label>
                <input
                  id="relationship"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Spouse, Sibling, Legal Trustee"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="roleType">Role Designation</label>
              <select
                id="roleType"
                className="form-input"
                value={form.roleType}
                onChange={(e) => setForm({ ...form, roleType: e.target.value })}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending Invitation...' : 'Save & Dispatch Invitation'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policy Configuration Modal */}
      {selectedContactForPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', border: '1px solid var(--border-focus)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Assign Asset Release Policy
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Configure which digital asset <strong>{selectedContactForPolicy.fullName}</strong> can access after verified death confirmation.
            </p>

            {vaultAssets.length === 0 ? (
              <div>
                <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>
                  You have not added any vault assets yet. Please add assets in 'My Vault' first.
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedContactForPolicy(null)}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePolicy}>
                <div className="form-group">
                  <label className="form-label">Select Vault Asset *</label>
                  <select
                    className="form-input"
                    value={policyForm.assetId}
                    onChange={(e) => setPolicyForm({ ...policyForm, assetId: e.target.value })}
                    required
                  >
                    {vaultAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.category?.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Permission Level</label>
                  <select
                    className="form-input"
                    value={policyForm.permissionLevel}
                    onChange={(e) => setPolicyForm({ ...policyForm, permissionLevel: e.target.value })}
                  >
                    <option value="VIEW_ONLY">View Only (Inspect secret instructions / View document)</option>
                    <option value="FULL_TRANSFER">Full Transfer (Download authorized document & full directive)</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="isAuthorized"
                    checked={policyForm.isAuthorized}
                    onChange={(e) => setPolicyForm({ ...policyForm, isAuthorized: e.target.checked })}
                  />
                  <label htmlFor="isAuthorized" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Policy is Active &amp; Authorized (will trigger on verified death)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedContactForPolicy(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingPolicy}>
                    {savingPolicy ? 'Saving...' : 'Authorize Release Policy'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contact List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving contacts and release policies...
        </div>
      ) : contacts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Trusted Contacts Added Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Designate trusted contacts who can receive your encrypted legacy assets upon verified death confirmation.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Designate Your First Trusted Contact
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {contacts.map((c) => {
            const contactPolicies = policies.filter(p => p.contactId === c.id);
            const isVerified = c.verificationStatus === 'VERIFIED';
            const isExpired = c.verificationStatus === 'EXPIRED';

            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.fullName}</div>
                    <span className={`badge ${c.roleType === 'EMERGENCY_DEPUTY' ? 'badge-warning' : 'badge-info'}`}>
                      {c.roleType.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontWeight: 600 }}>
                    {c.relationship}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                    <div>📧 {c.email}</div>
                    {c.phoneNumber && <div>📞 {c.phoneNumber}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>Verification:</span>
                      <span className={`badge ${isVerified ? 'badge-success' : isExpired ? 'badge-warning' : 'badge-info'}`}>
                        {c.verificationStatus}
                      </span>
                      {!isVerified && (
                        <button
                          type="button"
                          onClick={() => handleResendInvite(c.id, c.fullName)}
                          className="btn btn-outline"
                          disabled={resendingId === c.id}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {resendingId === c.id ? 'Resending...' : 'Resend Invite'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Configured Release Policies for this Contact */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Authorized Asset Policies ({contactPolicies.length}):
                    </div>
                    {contactPolicies.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No specific assets assigned yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {contactPolicies.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              • {p.assetTitle} ({p.permissionLevel})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePolicy(p.id)}
                              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0.2rem' }}
                              title="Revoke policy"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenPolicyModal(c)}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    + Assign Asset Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.fullName)}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', borderColor: 'var(--accent-rose)', color: '#fca5a5' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
