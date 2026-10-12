import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function BeneficiaryVaultPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReleasedAssets();
  }, []);

  const fetchReleasedAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/beneficiary/assets');
      if (res.data && res.data.success) {
        setAssets(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve released assets.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (assetId, fileName) => {
    try {
      setDownloadingId(assetId);
      const res = await api.get(`/beneficiary/assets/${assetId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'released_document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download authorized document file.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Beneficiary Vault — Released Digital Assets</h1>
        <p className="page-subtitle">
          Digital assets explicitly authorized and released to you following formal, verified death confirmation.
        </p>
      </div>

      {error && (
        <div className="alert" style={{ backgroundColor: 'var(--accent-rose-light)', border: '1px solid rgba(244,63,94,0.4)', color: '#fca5a5', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-focus)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Estate Security &amp; Authorization Notice</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          You are viewing only the specific digital assets that the deceased vault owner explicitly assigned to your verified email address. All unassigned vault records remain permanently encrypted and sealed.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving released digital assets from secure vault...
        </div>
      ) : assets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Released Assets Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            No digital assets have been released to your account at this time. Assets are released only after formal death verification has been reviewed and approved by an authorized legal verifier, and the owner has an active policy assigning the asset to your email.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {assets.map((asset) => (
            <div key={asset.releaseId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{asset.assetTitle}</h3>
                  <span className="badge badge-success">
                    {asset.permissionLevel || 'VIEW_ONLY'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                  Category: {asset.category?.replace('_', ' ')} • Owner: {asset.ownerName} ({asset.ownerEmail})
                </div>

                {asset.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {asset.description}
                  </p>
                )}

                {asset.secretContent && (
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                      DECRYPTED INHERITANCE CONTENT:
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {asset.secretContent}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Released: {asset.releasedAt ? new Date(asset.releasedAt).toLocaleDateString() : 'Recently'}
                </div>
                {asset.hasAttachment && asset.permissionLevel !== 'VIEW_ONLY' ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(asset.assetId, asset.fileName)}
                    className="btn btn-primary"
                    disabled={downloadingId === asset.assetId}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    {downloadingId === asset.assetId ? 'Decrypting...' : `⬇ Download ${asset.fileName || 'Document'}`}
                  </button>
                ) : asset.hasAttachment ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Attachment download restricted (View-Only)
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
