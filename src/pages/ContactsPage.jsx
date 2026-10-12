import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ROLES = [
  { value: 'BENEFICIARY', label: 'Primary Beneficiary (Inheritance Recipient)' },
  { value: 'EMERGENCY_DEPUTY', label: 'Emergency Deputy (Authorized Claim Requester)' },
  { value: 'LEGAL_VERIFIER', label: 'Legal Verifier (Attorney / Estate Trustee)' }
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    relationship: '',
    roleType: 'BENEFICIARY'
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contacts');
      if (res.data && res.data.success) {
        setContacts(res.data.data || []);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to retrieve contacts from server.'
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
        setFeedback({ type: 'success', text: `✓ Added trusted contact: ${form.fullName}.` });
        setShowAddModal(false);
        setForm({ fullName: '', email: '', phoneNumber: '', relationship: '', roleType: 'BENEFICIARY' });
        fetchContacts();
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove trusted contact "${name}" from your vault?`)) {
      return;
    }

    try {
      const res = await api.delete(`/contacts/${id}`);
      if (res.data && res.data.success) {
        setFeedback({ type: 'success', text: `✓ Contact "${name}" removed.` });
        fetchContacts();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove contact.'
      });
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Trusted Contacts &amp; Beneficiaries</h1>
          <p className="page-subtitle">
            Designate individuals authorized to be assigned legacy assets or submit emergency claims.
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

      {/* Add Contact Form Card */}
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
                  placeholder="e.g. eleanor@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="relationship">Relationship *</label>
                <input
                  id="relationship"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Spouse, Sibling, Attorney, Trustee"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phoneNumber">Phone Number (Optional)</label>
                <input
                  id="phoneNumber"
                  type="text"
                  className="form-input"
                  placeholder="e.g. +1 (555) 234-5678"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="roleType">Authorization Role</label>
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
                {submitting ? 'Saving Contact...' : 'Save Trusted Contact'}
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

      {/* Contact List / Empty State */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving trusted contacts from secure database...
        </div>
      ) : contacts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Trusted Contacts Added Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Designate trusted contacts, beneficiaries, or attorneys who can be assigned to your encrypted vault assets.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Designate Your First Trusted Contact
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {contacts.map((c) => (
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

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>📧 {c.email}</div>
                  {c.phoneNumber && <div>📞 {c.phoneNumber}</div>}
                  <div>Status: <span className="badge badge-success">{c.verificationStatus}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Added {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}
                </span>
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
          ))}
        </div>
      )}
    </div>
  );
}
