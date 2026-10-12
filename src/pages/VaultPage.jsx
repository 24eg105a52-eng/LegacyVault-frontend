import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const CATEGORIES = [
  { value: 'DOCUMENT', label: 'Document / Legal Deed' },
  { value: 'PERSONAL_INSTRUCTION', label: 'Personal Instruction' },
  { value: 'FINANCIAL_DIRECTIVE', label: 'Financial Directive' },
  { value: 'SUBSCRIPTION_INVENTORY', label: 'Subscription Inventory' },
  { value: 'HARDWARE_RECOVERY_KEY', label: 'Hardware Recovery Key / Mnemonic' }
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileName, category) {
  if (!fileName) {
    if (category === 'HARDWARE_RECOVERY_KEY') return '🔑';
    if (category === 'FINANCIAL_DIRECTIVE') return '💳';
    if (category === 'PERSONAL_INSTRUCTION') return '📝';
    return '📄';
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📕';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (ext === 'txt') return '📝';
  return '📁';
}

export default function VaultPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    category: 'DOCUMENT',
    description: '',
    secretContent: ''
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vault');
      if (res.data && res.data.success) {
        setAssets(res.data.data || []);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to retrieve vault assets from server.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (withFilePicker = false) => {
    setEditingAsset(null);
    setForm({ title: '', category: 'DOCUMENT', description: '', secretContent: '' });
    setSelectedFile(null);
    setFileError(null);
    setShowAddForm(true);
    setFeedback(null);

    if (withFilePicker) {
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 100);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingAsset(item);
    setForm({
      title: item.title,
      category: item.category,
      description: item.description || '',
      secretContent: item.secretContent || ''
    });
    setSelectedFile(null);
    setFileError(null);
    setShowAddForm(true);
    setFeedback(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported format '.${ext}'. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (15MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File exceeds 15MB limit (${formatBytes(file.size)}). Please select a smaller file.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);

    // Pre-populate title if empty
    if (!form.title.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setForm(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFeedback({ type: 'error', text: 'Asset title is required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (selectedFile) {
        // Multipart file upload with AES-256-GCM server-side encryption
        const formData = new FormData();
        formData.append('title', form.title.trim());
        formData.append('category', form.category);
        if (form.description) formData.append('description', form.description.trim());
        if (form.secretContent) formData.append('secretContent', form.secretContent.trim());
        formData.append('file', selectedFile);

        if (editingAsset) {
          const res = await api.put(`/vault/${editingAsset.id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data && res.data.success) {
            setFeedback({ type: 'success', text: `✓ Updated asset and encrypted document "${selectedFile.name}".` });
            setShowAddForm(false);
            setEditingAsset(null);
            setSelectedFile(null);
            fetchAssets();
          }
        } else {
          const res = await api.post('/vault/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data && res.data.success) {
            setFeedback({
              type: 'success',
              text: `✓ Document "${selectedFile.name}" encrypted with AES-256-GCM and stored securely.`
            });
            setShowAddForm(false);
            setSelectedFile(null);
            setForm({ title: '', category: 'DOCUMENT', description: '', secretContent: '' });
            fetchAssets();
          }
        }
      } else {
        // Standard JSON payload
        if (editingAsset) {
          const res = await api.put(`/vault/${editingAsset.id}`, form);
          if (res.data && res.data.success) {
            setFeedback({ type: 'success', text: '✓ Vault asset updated successfully.' });
            setShowAddForm(false);
            setEditingAsset(null);
            fetchAssets();
          }
        } else {
          const res = await api.post('/vault', form);
          if (res.data && res.data.success) {
            setFeedback({ type: 'success', text: '✓ New digital asset secured with AES-256-GCM in MySQL.' });
            setShowAddForm(false);
            setForm({ title: '', category: 'DOCUMENT', description: '', secretContent: '' });
            fetchAssets();
          }
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save asset to secure vault.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (item) => {
    try {
      setDownloadingId(item.id);
      setFeedback(null);

      const res = await api.get(`/vault/${item.id}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: item.fileType || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', item.fileName || 'vault_document');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        text: `✓ Decrypted and downloaded "${item.fileName}". File contents are never stored in browser localStorage.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to download and decrypt attached document.'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your vault?\nAttached files will also be permanently deleted from secure disk storage.`)) {
      return;
    }

    try {
      const res = await api.delete(`/vault/${id}`);
      if (res.data && res.data.success) {
        setFeedback({ type: 'success', text: `✓ Asset "${title}" removed from vault.` });
        fetchAssets();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete vault asset.'
      });
    }
  };

  const filteredAssets = filter === 'ALL'
    ? assets
    : assets.filter(item => item.category === filter);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Digital Asset Vault</h1>
          <p className="page-subtitle">Encrypted repository of your digital records, directives, and credentials.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => handleOpenAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
          >
            📎 Add Document / Upload File
          </button>
          <button
            className="btn btn-primary"
            onClick={showAddForm ? () => setShowAddForm(false) : () => handleOpenAdd(false)}
          >
            {showAddForm ? '✕ Close Form' : '+ New Vault Item'}
          </button>
        </div>
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

      {/* Add / Edit Asset Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-focus)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            {editingAsset ? `Edit Vault Asset: ${editingAsset.title}` : 'Secure New Digital Asset'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="title">Asset Title *</label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Real Estate Deed, Trust Document, Seed Phrase"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Unencrypted Descriptor / Indexing Notes</label>
              <input
                id="description"
                type="text"
                className="form-input"
                placeholder="High-level indexing description (safe to view unencrypted)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Document File Attachment Section */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Attach Encrypted File (PDF, DOC, DOCX, TXT, JPG, PNG &bull; Max 15MB)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Private Disk Storage &bull; AES-256-GCM</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="filePicker"
              />

              {selectedFile ? (
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>{getFileIcon(selectedFile.name, form.category)}</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{selectedFile.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'Document'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-info">Ready to Encrypt</span>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--accent-rose)', color: '#fca5a5' }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-primary)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {editingAsset?.hasFile ? 'Click to replace attached document' : 'Click to select a document or image to encrypt'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 15MB)
                  </div>
                  {editingAsset?.hasFile && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      Currently attached: {editingAsset.fileName} ({formatBytes(editingAsset.fileSizeBytes)})
                    </div>
                  )}
                </div>
              )}

              {fileError && (
                <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  ⚠️ {fileError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="secretContent">
                Sensitive Payload / Private Notes (Encrypted via AES-256-GCM in MySQL)
              </label>
              <textarea
                id="secretContent"
                className="form-input"
                rows="3"
                placeholder="Enter sensitive instructions, private keys, access codes, or estate directives..."
                value={form.secretContent}
                onChange={(e) => setForm({ ...form, secretContent: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                🔒 This content is encrypted with AES-256-GCM with a unique cryptographic IV before storage.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Encrypting & Saving...' : (editingAsset ? 'Update Asset' : 'Secure In Vault')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('ALL')}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
        >
          All Assets ({assets.length})
        </button>
        {CATEGORIES.map(c => {
          const count = assets.filter(a => a.category === c.value).length;
          return (
            <button
              key={c.value}
              className={`btn ${filter === c.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(c.value)}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
            >
              {c.label.split(' / ')[0]} ({count})
            </button>
          );
        })}
      </div>

      {/* Asset Content List / Empty State */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving encrypted vault assets from MySQL...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Vault Items Secured Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Your encrypted vault repository is currently empty. Secure your important digital documents, credentials, or personal directives now.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => handleOpenAdd(true)} className="btn btn-outline" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
              📎 Upload Document / File
            </button>
            <button onClick={() => handleOpenAdd(false)} className="btn btn-primary">
              + Secure New Digital Asset
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {filteredAssets.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {getFileIcon(item.fileName, item.category)}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.title}</h3>
                  </div>
                  <span className="badge badge-success">
                    {item.encrypted || item.hasFile ? 'AES-256 Encrypted' : 'Stored'}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  {item.description || 'No description provided.'}
                </p>

                {/* Attached Document File Box */}
                {item.hasFile && (
                  <div style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{getFileIcon(item.fileName, item.category)}</span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {item.fileName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatBytes(item.fileSizeBytes)} &bull; Encrypted at Rest
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(item)}
                      disabled={downloadingId === item.id}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                    >
                      {downloadingId === item.id ? 'Decrypting...' : '⬇ Download'}
                    </button>
                  </div>
                )}

                {item.secretContent && (
                  <div style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      DECRYPTED PAYLOAD:
                    </span>
                    <pre style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
                      {item.secretContent}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Added {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', borderColor: 'var(--accent-rose)', color: '#fca5a5' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
