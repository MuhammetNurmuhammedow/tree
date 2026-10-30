import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { treeService } from '@/services/treeService';
import type { TreeInfo } from '@/types/tree';
import { TreeIcon, CloseIcon, ShieldIcon } from '@/components/common/Icons';

interface CreateTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTree: TreeInfo) => void;
}

export const CreateTreeModal: React.FC<CreateTreeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t('createTreeModal.errorRequired')); return; }
    try {
      setLoading(true); setError(null);
      const newTree = await treeService.createTree(name.trim(), description.trim() || undefined);
      onSuccess(newTree);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createTreeModal.errorGeneral'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(4,7,13,0.82)', backdropFilter: 'blur(16px)' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
        padding: '24px 28px', width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.75)', color: '#f1f5f9' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10b981', display: 'flex' }}><TreeIcon size={20} /></span>
              {t('createTreeModal.title')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>{t('createTreeModal.subtitle')}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}><CloseIcon size={16} /></button>
        </div>

        {error && <div style={errorBoxStyle}><ShieldIcon size={16} /> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('createTreeModal.treeName')} *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('createTreeModal.placeholderName')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('createTreeModal.description')}</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createTreeModal.placeholderDesc')} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>{t('createTreeModal.cancel')}</button>
            <button type="submit" disabled={loading}
              style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: '#10b981',
                color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
              {loading ? t('createTreeModal.submitting') : t('createTreeModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#f1f5f9', fontSize: 13, outline: 'none', colorScheme: 'dark' };
const closeButtonStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const errorBoxStyle: React.CSSProperties = { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 };
const cancelButtonStyle: React.CSSProperties = { padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 500 };
