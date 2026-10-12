import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyContactPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setResult({
        success: false,
        message: 'No verification token provided in the link. Please check your invitation email.'
      });
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (rawToken) => {
    try {
      setLoading(true);
      const res = await api.get(`/contacts/verify?token=${encodeURIComponent(rawToken)}`);
      if (res.data && res.data.success) {
        setResult({
          success: true,
          message: res.data.message,
          contact: res.data.data
        });
      } else {
        setResult({
          success: false,
          message: res.data?.message || 'Verification failed.'
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || 'Verification link is invalid, expired, or has already been used.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        {loading ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Verifying Contact Invitation...
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Checking cryptographic token and security integrity...
            </p>
          </div>
        ) : result?.success ? (
          <div>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛡️</div>
            <span className="badge badge-success" style={{ marginBottom: '1rem', fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
              ✓ CONTACT VERIFIED
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Trusted Contact Confirmed
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {result.message}
            </p>

            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Estate Security Guarantees:
              </div>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                <li>Your email identity is confirmed as an authorized trusted contact.</li>
                <li><strong>No assets are released immediately.</strong> All vault assets remain encrypted with AES-256-GCM.</li>
                <li>Assets are only ever unlocked after formal, reviewed death verification under the owner's explicit release policies.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">
                Sign In to LegacyVault
              </Link>
              <Link to="/" className="btn btn-secondary">
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
            <span className="badge badge-warning" style={{ marginBottom: '1rem', fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
              VERIFICATION FAILED
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Unable to Verify Token
            </h1>
            <p style={{ color: '#fca5a5', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {result?.message}
            </p>

            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Possible Causes:
              </div>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                <li><strong>Single-use Token:</strong> This link was already clicked and verified.</li>
                <li><strong>Expired:</strong> Invitations are valid for 7 days. The vault owner can click 'Resend Invitation' from their contacts page.</li>
                <li><strong>Revoked:</strong> The vault owner may have removed the contact.</li>
              </ul>
            </div>

            <Link to="/" className="btn btn-secondary">
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
