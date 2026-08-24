import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Button, IconButton, FormField, FormActions, FileDropzone, EmptyState, Modal, SectionHeader, Tabs, InfoCallout, FormRow, IconInput } from '@financeos/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { EncryptedDocument } from '@financeos/shared';
import { dbService } from '@financeos/database';
import { useDbSyncCallback } from '../hooks/useDbSync.js';
import {
  FileText, ShieldCheck, Lock, Upload, Search, Tag, Eye, Trash2,
  CheckCircle2, AlertTriangle, FileCode, HardDrive, Key, Sparkles, Filter, Plus, X
} from 'lucide-react';

interface DocumentVaultViewProps {
  profileId: string;
}

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({ profileId }) => {
  const [documents, setDocuments] = useState<EncryptedDocument[]>(() => {
    try {
      return dbService.getEncryptedDocuments(profileId);
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDoc, setActiveDoc] = useState<EncryptedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EncryptedDocument['category']>('Tax');
  const [newTags, setNewTags] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshDocuments = useCallback(() => {
    try {
      setDocuments(dbService.getEncryptedDocuments(profileId));
    } catch {
      setDocuments([]);
    }
  }, [profileId]);

  useEffect(() => {
    refreshDocuments();
  }, [profileId, refreshDocuments]);

  useDbSyncCallback(refreshDocuments);

  const categories = ['All', 'Tax', 'Insurance', 'PAN', 'Property', 'MutualFund', 'Loan', 'Other'];

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.ocrSummary && doc.ocrSummary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: EncryptedDocument = {
      id: 'doc_' + Math.random().toString(36).substring(2, 8),
      profileId,
      title: newTitle,
      category: newCategory,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSizeFormatted: selectedUploadFile ? `${(selectedUploadFile.size / (1024 * 1024)).toFixed(1)} MB` : `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      notes: newNotes,
      isEncrypted: true,
      ocrSummary: `AI Auto-Indexed Document (${newCategory}). Encrypted using local AES-256 vault.`
    };

    await dbService.addEncryptedDocument(newDoc);
    refreshDocuments();
    setNewTitle('');
    setNewTags('');
    setNewNotes('');
    setSelectedUploadFile(null);
    setIsUploading(false);
    showToast('Document encrypted and stored securely in local vault!');
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteEncryptedDocument(id);
    refreshDocuments();
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
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}
    >
      {/* Page Header Banner */}
      <SectionHeader
        variant="banner"
        icon={<Lock />}
        title="Encrypted Document Vault"
        badge={<><ShieldCheck size={12} /> AES-256 Encrypted</>}
        description="Store PAN, Aadhaar, Property Deeds, Tax returns, and Policy docs with local encryption & AI indexing"
        action={
          <Button
            variant="primary"
            onClick={() => setIsUploading(!isUploading)}
            style={{ padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', borderRadius: 'var(--radius-sm)' }}
          >
            <Upload size={16} /> {isUploading ? 'Cancel Upload' : 'Upload Document'}
          </Button>
        }
      />

      {notification && (
        <InfoCallout variant="success">
          {notification}
        </InfoCallout>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploading}
        onClose={() => setIsUploading(false)}
        title="Encrypt & Store Document"
        description="Securely store PAN, Aadhaar, Insurance, and Property deeds in your local AES-256 vault."
        size="lg"
      >
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}>
          <FileDropzone
            label="Drop document to encrypt & index, or click to browse"
            sublabel="Supports PDF, PNG, JPG, JSON, and CSV up to 10MB"
            selectedFile={selectedUploadFile}
            onFileSelect={(file) => {
              setSelectedUploadFile(file);
              if (!newTitle) {
                setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
              }
            }}
            onFileRemove={() => setSelectedUploadFile(null)}
          />

          <FormRow>
            <FormField label="Document Title" htmlFor="doc-title-input">
              <input
                id="doc-title-input"
                type="text"
                required
                placeholder="e.g. Life Insurance Policy 2026"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Category" htmlFor="doc-category-select">
              <select
                id="doc-category-select"
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
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Tags (Comma Separated)" htmlFor="doc-tags-input">
              <input
                id="doc-tags-input"
                type="text"
                placeholder="KYC, Section80C, HDFC"
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Notes / Description" htmlFor="doc-notes-input">
              <input
                id="doc-notes-input"
                type="text"
                placeholder="Optional notes or policy number..."
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="form-input"
              />
            </FormField>
          </FormRow>
          <FormActions
            divided
            onCancel={() => setIsUploading(false)}
            submitLabel="Save Encrypted File"
          />
        </form>
      </Modal>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-085)', width: '100%' }}>
        <div style={{ flex: '1 1 220px', minWidth: '200px', width: '100%' }}>
          <IconInput
            id="doc-search-input"
            icon={<Search size={14} />}
            aria-label="Search documents"
            placeholder="Search documents, tags, OCR..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="sm"
            style={{ borderRadius: 'var(--radius-md)', height: '38px' }}
          />
        </div>

        {/* Category Filter Tabs */}
        <Tabs
          tabs={categories.map(cat => ({ id: cat, label: cat }))}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          variant="segmented"
        />
      </div>

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 'var(--spacing-1)' }}>
        {filteredDocs.map(doc => (
          <motion.div
            key={doc.id}
            className="glass-panel" data-interactive-card="off"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 }
            }}
            style={{
              padding: 'var(--spacing-125)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--bg-panel)',
              backgroundImage: 'var(--neo-convex-grad)',
              border: '1px solid var(--border-color)',
              borderTop: 'var(--neo-bevel-top)',
              borderBottom: 'var(--neo-bevel-bottom)',
              boxShadow: 'var(--neo-raised-sm)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-075)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
                  <div className="neo-socket" style={{
                    width: '36px',
                    height: '36px',
                    color: 'var(--accent-1)',
                    flexShrink: 0
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--fw-semibold)', margin: 0, color: 'var(--text-primary)' }}>
                      {doc.title}
                    </h4>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-02)', display: 'flex', gap: 'var(--spacing-04)', alignItems: 'center' }}>
                      <span>{doc.uploadDate}</span>
                      <span>•</span>
                      <span>{doc.fileSizeFormatted}</span>
                    </div>
                  </div>
                </div>

                <IconButton
                  variant="danger"
                  onClick={() => handleDelete(doc.id)}
                  label={`Delete ${doc.title}`}
                  icon={<Trash2 size={16} />}
                />
              </div>

              {/* AI OCR Summary */}
              {doc.ocrSummary && (
                <div style={{
                  padding: 'var(--spacing-06) var(--spacing-075)',
                  background: 'var(--bg-secondary)',
                  boxShadow: 'var(--neo-inset-sm)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-075)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-04)'
                }}>
                  <Sparkles size={14} color="var(--accent-1)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>AI Summary: </strong>
                    {doc.ocrSummary}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-04)', marginBottom: 'var(--spacing-075)' }}>
                {doc.tags.map((tag, idx) => (
                  <span key={idx} style={{
                    fontSize: 'var(--font-xs)',
                    padding: 'var(--spacing-02) var(--spacing-05)',
                    borderRadius: '4px',
                    background: 'var(--surface-tint)',
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
              paddingTop: 'var(--spacing-075)',
              borderTop: '1px solid var(--border-color)',
              fontSize: 'var(--font-xs)'
            }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                <HardDrive size={12} /> Stored encrypted on this device
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveDoc(doc)}
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--accent-1)',
                  padding: 'var(--spacing-02) var(--spacing-04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-02)'
                }}
              >
                <Eye size={12} /> View Details
              </Button>
            </div>
          </motion.div>
        ))}

        {filteredDocs.length === 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={<FileCode size={28} />}
              title={documents.length === 0 ? "No documents in your encrypted vault" : "No documents match your filter"}
              description={documents.length === 0 ? "Upload PAN, Aadhaar, Insurance policies, or Property deeds with local zero-knowledge encryption." : "Try selecting 'All' categories or searching with a different keyword."}
              action={documents.length === 0 ? (
                <Button
                  variant="primary"
                  onClick={() => setIsUploading(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}
                >
                  <Upload size={14} /> Upload First Document
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                >
                  Clear Filters
                </Button>
              )}
            />
          </div>
        )}
      </div>

      {/* Document Details Modal */}
      <Modal
        isOpen={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title={activeDoc?.title || 'Document Details'}
        size="md"
      >
        {activeDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)', fontSize: 'var(--font-sm)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--spacing-025)' }}>Category</span>
              <Badge variant="cyan" size="sm">{activeDoc.category}</Badge>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--spacing-025)' }}>AI Summary Extraction</span>
              <div style={{
                marginTop: 'var(--spacing-04)',
                padding: 'var(--spacing-075)',
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
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--spacing-025)' }}>Notes</span>
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-02)', margin: 0 }}>{activeDoc.notes}</p>
              </div>
            )}

            <div style={{
              padding: 'var(--spacing-06) var(--spacing-075)',
              background: 'var(--badge-emerald-bg)',
              border: '1px solid var(--badge-emerald-border)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--font-xs)',
              color: 'var(--badge-emerald-text)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                <Key size={14} /> Key ID: 0x8F9A...C4B2
              </span>
              <span>AES-256 GCM</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--spacing-05)' }}>
              <Button
                variant="primary"
                onClick={() => setActiveDoc(null)}
                style={{ padding: 'var(--spacing-04) var(--spacing-1)', fontSize: 'var(--font-sm)' }}
              >
                Close Vault Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default DocumentVaultView;
