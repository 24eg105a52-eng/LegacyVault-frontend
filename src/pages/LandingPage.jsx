import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3.5rem 1rem 4rem' }}>
        <div className="badge badge-info" style={{ marginBottom: '1.25rem' }}>
          🛡️ Digital Asset Protection &amp; Inheritance
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, maxWidth: '820px', margin: '0 auto 1.25rem' }}>
          Secure Your Digital Legacy Before It Is Too Late
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          Store critical credentials, legal documents, and personal instructions. Designate trusted contacts and define automated check-in protocols that ensure seamless transfer when it matters most.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
            Start Building Your Vault →
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
            Sign In to Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ margin: '2rem 0 4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Built for Security, Designed for Peace of Mind</h2>
          <p style={{ color: 'var(--text-secondary)' }}>How LegacyVault guarantees resilience and confidentiality.</p>
        </div>

        <div className="grid-3">
          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Encrypted Vault Storage</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Protect sensitive documents, estate instructions, and digital asset locations with authenticated backend encryption.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏱️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dead-Man Switch Check-ins</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Automated periodic heartbeat checks. If you become inactive, automated grace period warnings trigger before policies evaluate.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tiered Beneficiary Access</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Assign specific family members or trustees to specific assets with granular permissions and mandatory multi-step verification.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚨</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Emergency Access Protocol</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Time-delayed emergency requests give vault owners ample opportunity to deny malicious access attempts before expiry.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📜</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tamper-Evident Audit Logs</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Every login, policy update, asset download, and emergency claim is logged with timestamps and IP records.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Modern Full-Stack Architecture</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Crafted with Spring Boot 3, React 18, Spring Security 6 with JWT tokens, and persistent MySQL database storage.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
