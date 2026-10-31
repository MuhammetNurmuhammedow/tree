import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatePersonPayload, Gender } from '@/types/person';
import { personService } from '@/services/personService';
import { UserIcon, CloseIcon, ShieldIcon } from '@/components/common/Icons';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  treeId?: string;
}

export const PersonModal: React.FC<PersonModalProps> = ({ isOpen, onClose, onSuccess, treeId = 'my-tree' }) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maidenName, setMaidenName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [biography, setBiography] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('personModal.errorRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload: CreatePersonPayload & { tree_id?: string } = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        maiden_name: maidenName.trim() || undefined,
        gender,
        birth_date: birthDate ? new Date(birthDate).toISOString() : undefined,
        birth_place: birthPlace.trim() || undefined,
        death_date: !isLiving && deathDate ? new Date(deathDate).toISOString() : undefined,
        death_place: !isLiving && deathPlace ? deathPlace.trim() : undefined,
        is_living: isLiving,
        biography: biography.trim() || undefined,
        tree_id: treeId,
      };

      await personService.create(payload as CreatePersonPayload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('personModal.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(10, 11, 14, 0.82)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#161820',
        border: '1px solid #2d303b',
        borderRadius: 12,
        padding: '24px 28px',
        width: '100%',
        maxWidth: 540,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        color: '#f5f2eb',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#c59b27', display: 'flex' }}><UserIcon size={20} /></span>
              {t('personModal.title')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a8a296' }}>
              {t('personModal.subtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <CloseIcon size={16} />
          </button>
        </div>

        {error && (
          <div style={errorBoxStyle}>
            <ShieldIcon size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ad & Soyad */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('personModal.firstName')} *</label>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('personModal.placeholderFirst')} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('personModal.lastName')} *</label>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder={t('personModal.placeholderLast')} style={inputStyle} />
            </div>
          </div>

          {/* Kızlık Soyadı & Cinsiyet */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('personModal.maidenName')}</label>
              <input type="text" value={maidenName} onChange={(e) => setMaidenName(e.target.value)}
                placeholder={t('personModal.placeholderMaiden')} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('personModal.gender')}</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} style={inputStyle}>
                <option value="male">{t('personModal.genderMale')}</option>
                <option value="female">{t('personModal.genderFemale')}</option>
                <option value="other">{t('personModal.genderOther')}</option>
                <option value="unknown">{t('personModal.genderUnknown')}</option>
              </select>
            </div>
          </div>

          {/* Doğum */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('personModal.birthDate')}</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('personModal.birthPlace')}</label>
              <input type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}
                placeholder={t('personModal.placeholderBirthPlace')} style={inputStyle} />
            </div>
          </div>

          {/* Hayatta mı */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: '#191b22', borderRadius: 8, border: '1px solid #2d303b' }}>
            <input type="checkbox" id="isLivingModal" checked={isLiving} onChange={(e) => setIsLiving(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#346850' }} />
            <label htmlFor="isLivingModal" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#f5f2eb' }}>
              {t('personModal.isLiving')}
            </label>
          </div>

          {/* Vefat */}
          {!isLiving && (
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{t('personModal.deathDate')}</label>
                <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{t('personModal.deathPlace')}</label>
                <input type="text" value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)}
                  placeholder={t('personModal.placeholderDeathPlace')} style={inputStyle} />
              </div>
            </div>
          )}

          {/* Biyografi */}
          <div>
            <label style={labelStyle}>{t('personModal.biography')}</label>
            <textarea rows={3} value={biography} onChange={(e) => setBiography(e.target.value)}
              placeholder={t('personModal.placeholderBio')} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>{t('personModal.cancel')}</button>
            <button type="submit" disabled={loading} style={submitButtonStyle('#254a37', '0 1px 4px rgba(0,0,0,0.3)')}>
              {loading ? t('personModal.submitting') : t('personModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#a8a296', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #2d303b',
  backgroundColor: '#121318',
  color: '#f5f2eb', fontSize: 13, outline: 'none', colorScheme: 'dark',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #2d303b',
  borderRadius: 6, width: 28, height: 28, color: '#a8a296',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const errorBoxStyle: React.CSSProperties = {
  background: 'rgba(160, 60, 70, 0.15)', border: '1px solid rgba(160, 60, 70, 0.35)',
  color: '#e0b0b8', padding: '10px 14px', borderRadius: 8, marginBottom: 18,
  fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6,
  border: '1px solid #2d303b',
  background: 'transparent', color: '#a8a296',
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
};

const submitButtonStyle = (bg: string, shadow: string): React.CSSProperties => ({
  padding: '8px 20px', borderRadius: 6, border: '1px solid #3a6850',
  background: bg, color: '#f5f2eb', fontWeight: 600,
  cursor: 'pointer', fontSize: 13, boxShadow: shadow,
});
