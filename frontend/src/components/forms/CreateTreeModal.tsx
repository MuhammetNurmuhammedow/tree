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
      backgroundColor: 'rgba(10, 11, 14, 0.82)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#161820', border: '1px solid #2d303b', borderRadius: 12,
        padding: '24px 28px', width: '100%', maxWidth: 480, boxShadow: '0 20px 50px rgba(0,0,0,0.7)', color: '#f5f2eb' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#c59b27', display: 'flex' }}><TreeIcon size={20} /></span>
              {t('createTreeModal.title')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a8a296' }}>{t('createTreeModal.subtitle')}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}><CloseIcon size={14} /></button>
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
              style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #3a6850', background: '#254a37',
                color: '#f5f2eb', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              {loading ? t('createTreeModal.submitting') : t('createTreeModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#a8a296', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #2d303b', backgroundColor: '#121318', color: '#f5f2eb', fontSize: 13, outline: 'none', colorScheme: 'dark' };
const closeButtonStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #2d303b', borderRadius: 6, width: 28, height: 28, color: '#a8a296', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const errorBoxStyle: React.CSSProperties = { background: 'rgba(160, 60, 70, 0.15)', border: '1px solid rgba(160, 60, 70, 0.35)', color: '#e0b0b8', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 };
const cancelButtonStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: '1px solid #2d303b', background: 'transparent', color: '#a8a296', cursor: 'pointer', fontSize: 13, fontWeight: 500 };
