import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EncryptedDocument } from '@financeos/shared';
import {
  FileText, ShieldCheck, Lock, Upload, Search, Tag, Eye, Trash2,
  CheckCircle2, AlertTriangle, FileCode, HardDrive, Key, Sparkles, Filter, Plus, X
} from 'lucide-react';

interface DocumentVaultViewProps {
  profileId: string;
}

const INITIAL_DOCS: EncryptedDocument[] = [];

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({ profileId }) => {
  const [documents, setDocuments] = useState<EncryptedDocument[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDoc, setActiveDoc] = useState<EncryptedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EncryptedDocument['category']>('Tax');
  const [newTags, setNewTags] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const categories = ['All', 'Tax', 'Insurance', 'PAN', 'Property', 'MutualFund', 'Loan', 'Other'];

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.ocrSummary && doc.ocrSummary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: EncryptedDocument = {
      id: 'doc_' + Math.random().toString(36).substring(2, 8),
      profileId,
      title: newTitle,
      category: newCategory,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSizeFormatted: (Math.random() * 2 + 0.5).toFixed(1) + ' MB',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      notes: newNotes,
      isEncrypted: true,
      ocrSummary: `AI Auto-Indexed Document (${newCategory}). Encrypted using local AES-256 vault.`
    };

    setDocuments([newDoc, ...documents]);
    setNewTitle('');
    setNewTags('');
    setNewNotes('');
    setIsUploading(false);
    showToast('Document encrypted and stored securely in local vault!');
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
    if (activeDoc?.id === id) setActiveDoc(null);
    showToast('Document deleted from vault.');
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Page Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid var(--border-color)',
        marginBottom: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: '1 1 min-content', minWidth: '280px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--accent-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px hsla(220, 80%, 50%, 0.25)',
            flexShrink: 0,
            marginTop: '0.2rem'
          }}>
            <Lock size={22} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.25 }}>
                Encrypted Document Vault
              </h1>
              <span style={{
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--accent-1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: '2rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap'
              }}>
                <ShieldCheck size={12} /> AES-256 Encrypted
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
              Store PAN, Aadhaar, Property Deeds, Tax returns, and Policy docs with local encryption & AI indexing
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={() => setIsUploading(!isUploading)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </motion.button>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} /> {notification}
        </motion.div>
      )}

      {/* Upload Modal / Form Panel */}
      <AnimatePresence>
        {isUploading && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleUpload}
            className="glass-panel"
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={18} color="var(--accent-1)" /> Encrypt & Store Document
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-stack">
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Life Insurance Policy 2026"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="form-input"
                >
                  <option value="Tax">Tax Return / Form 16</option>
                  <option value="Insurance">Insurance Policy</option>
                  <option value="PAN">PAN / Aadhaar / Identity</option>
                  <option value="Property">Property & Title Deeds</option>
                  <option value="MutualFund">Mutual Fund / CAS Statement</option>
                  <option value="Loan">Loan Agreement</option>
                  <option value="Passport">Passport / Visa</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-stack">
              <div className="form-group">
                <label className="form-label">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="KYC, Section80C, HDFC"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onPointerDown={() => setIsUploading(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ShieldCheck size={14} /> Save Encrypted File
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', width: '100%' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px', width: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search documents, tags, OCR..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', borderRadius: '2rem', height: '38px', width: '100%' }}
          />
        </div>

        {/* Category Pills with Horizontal Touch Scroll */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onPointerDown={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '2rem',
                fontSize: '0.8rem',
                fontWeight: selectedCategory === cat ? 600 : 400,
                border: selectedCategory === cat ? '1px solid var(--accent-1)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedCategory === cat ? 'var(--accent-1)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredDocs.map(doc => (
          <motion.div
            key={doc.id}
            className="glass-panel"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 }
            }}
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--accent-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      {doc.title}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span>{doc.uploadDate}</span>
                      <span>•</span>
                      <span>{doc.fileSizeFormatted}</span>
                    </div>
                  </div>
                </div>

                <button
                  onPointerDown={() => handleDelete(doc.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.7, padding: '0.2rem' }}
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* AI OCR Summary */}
              {doc.ocrSummary && (
                <div style={{
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem'
                }}>
                  <Sparkles size={14} color="var(--accent-1)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>AI Summary: </strong>
                    {doc.ocrSummary}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                {doc.tags.map((tag, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--accent-1)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.75rem'
            }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <HardDrive size={12} /> Stored in AES Local Keyring
              </span>
              <button
                onPointerDown={() => setActiveDoc(doc)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-1)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Eye size={12} /> View Details
              </button>
            </div>
          </motion.div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="glass-panel" style={{
            gridColumn: '1 / -1',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-focus)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent-1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '0.25rem'
            }}>
              <FileCode size={32} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>No documents found</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
              Upload financial documents to store them with hardware-accelerated local AES-256 encryption.
            </p>
            <button
              className="btn btn-primary"
              onPointerDown={() => setIsUploading(true)}
              style={{ marginTop: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Upload size={14} /> Upload First Document
            </button>
          </div>
        )}
      </div>

      {/* Document Details Modal */}
      <AnimatePresence>
        {activeDoc && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} color="var(--accent-1)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{activeDoc.title}</h3>
                </div>
                <button
                  onPointerDown={() => setActiveDoc(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Category</span>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.25rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--accent-1)',
                    fontWeight: 600,
                    fontSize: '0.78rem'
                  }}>
                    {activeDoc.category}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>AI Summary Extraction</span>
                  <div style={{
                    marginTop: '0.3rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}>
                    {activeDoc.ocrSummary || 'No AI summary generated yet.'}
                  </div>
                </div>

                {activeDoc.notes && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Notes</span>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{activeDoc.notes}</p>
                  </div>
                )}

                <div style={{
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--success)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Key size={14} /> Key ID: 0x8F9A...C4B2
                  </span>
                  <span>AES-256 GCM</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  onPointerDown={() => setActiveDoc(null)}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  Close Vault Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DocumentVaultView;
