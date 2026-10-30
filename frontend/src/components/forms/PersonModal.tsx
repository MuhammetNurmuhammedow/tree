import React, { useState } from 'react';
import type { CreatePersonPayload, Gender } from '@/types/person';
import { personService } from '@/services/personService';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  treeId?: string;
}

export const PersonModal: React.FC<PersonModalProps> = ({ isOpen, onClose, onSuccess, treeId = 'my-tree' }) => {
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
      setError('Ad ve Soyad alanları zorunludur');
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
      setError(err instanceof Error ? err.message : 'Kişi eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(4, 7, 13, 0.82)', backdropFilter: 'blur(16px)',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #121724 0%, #0c101a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: '28px 32px',
        width: '100%',
        maxWidth: 540,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(59, 130, 246, 0.1)',
        color: '#f1f5f9',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👤</span> Yeni Aile Üyesi Ekle
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Soy ağacınıza yeni bir fert kaydedin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              width: 32,
              height: 32,
              color: '#94a3b8',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 18,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ad & Soyad */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ad *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Örn: Ahmet"
                style={darkInputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Soyad *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Örn: Kaya"
                style={darkInputStyle}
              />
            </div>
          </div>

          {/* Kızlık Soyadı & Cinsiyet */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Kızlık Soyadı (Opsiyonel)</label>
              <input
                type="text"
                value={maidenName}
                onChange={(e) => setMaidenName(e.target.value)}
                placeholder="Varsa önceki soyadı"
                style={darkInputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cinsiyet</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                style={darkInputStyle}
              >
                <option value="male">👨 Erkek</option>
                <option value="female">👩 Kadın</option>
                <option value="other">⚧ Diğer</option>
                <option value="unknown">❔ Bilinmiyor</option>
              </select>
            </div>
          </div>

          {/* Doğum Tarihi & Yeri */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Doğum Tarihi</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={darkInputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Doğum Yeri</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Şehir veya Ülke"
                style={darkInputStyle}
              />
            </div>
          </div>

          {/* Hayatta mı Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}>
            <input
              type="checkbox"
              id="isLivingModal"
              checked={isLiving}
              onChange={(e) => setIsLiving(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <label htmlFor="isLivingModal" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#f1f5f9' }}>
              Bu aile üyesi hayatta
            </label>
          </div>

          {/* Vefat Bilgileri (Sadece vefat etmişse) */}
          {!isLiving && (
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Vefat Tarihi</label>
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  style={darkInputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Vefat Yeri</label>
                <input
                  type="text"
                  value={deathPlace}
                  onChange={(e) => setDeathPlace(e.target.value)}
                  placeholder="Vefat şehri"
                  style={darkInputStyle}
                />
              </div>
            </div>
          )}

          {/* Biyografi */}
          <div>
            <label style={labelStyle}>Biyografi / Hatıralar</label>
            <textarea
              rows={3}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Kişi hakkında anılar, mesleği veya önemli yaşam detayları..."
              style={{ ...darkInputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              {loading ? 'Kaydediliyor…' : 'Aileye Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: 6,
};

const darkInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.12)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  color: '#f1f5f9',
  fontSize: 13,
  outline: 'none',
  colorScheme: 'dark',
};
