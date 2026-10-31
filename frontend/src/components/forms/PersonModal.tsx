import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreatePersonPayload, Gender } from '@/types/person';
import { personService } from '@/services/personService';
import { UserIcon, CloseIcon, ShieldIcon, CameraIcon } from '@/components/common/Icons';

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Surat ölçegi 10MB-dan uly bolmaly däl');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('personModal.errorRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let uploadedAvatarUrl: string | undefined = undefined;
      if (avatarFile) {
        try {
          const uploadRes = await personService.uploadPhoto(avatarFile);
          uploadedAvatarUrl = uploadRes.url;
        } catch (uploadErr) {
          console.error('Surat ýüklemekde säwlik:', uploadErr);
          setError('Surat ýüklenip bilinmedi: ' + (uploadErr instanceof Error ? uploadErr.message : String(uploadErr)));
          setLoading(false);
          return;
        }
      }

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
        avatar_url: uploadedAvatarUrl,
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
      padding: 12, boxSizing: 'border-box',
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
          {/* Round Avatar Upload Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0 8px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'relative',
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: avatarPreview ? '2px solid #c59b27' : '2px dashed #4b5563',
                background: avatarPreview ? 'transparent' : '#14161d',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
              title="Surat ýüklemek üçin basyň"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#9ca3af' }}>
                  <CameraIcon size={22} />
                  <span style={{ fontSize: 9, fontWeight: 500 }}>Surat</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#d4af37',
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {avatarPreview ? 'Suraty çalşyryň' : '+ Surat goşuň'}
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 11.5,
                    cursor: 'pointer',
                  }}
                >
                  Aýyryň
                </button>
              )}
            </div>
          </div>
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
