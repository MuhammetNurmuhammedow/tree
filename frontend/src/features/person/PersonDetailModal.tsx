import React, { useState, useEffect } from 'react';
import type { Person } from '@/types/person';
import { personService } from '@/services/personService';

interface PersonDetailModalProps {
  personId: string | null;
  onClose: () => void;
  onDeleted: () => void;
  isReadOnly?: boolean;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  personId,
  onClose,
  onDeleted,
  isReadOnly = false,
}) => {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (personId) {
      setLoading(true);
      personService.getById(personId)
        .then(setPerson)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setPerson(null);
    }
  }, [personId]);

  if (!personId) return null;

  const handleDelete = async () => {
    if (!person) return;
    if (window.confirm(`${person.first_name} ${person.last_name} kişisini ağaçtan silmek istediğinizden emin misiniz?`)) {
      try {
        setDeleting(true);
        await personService.delete(person.id);
        onDeleted();
        onClose();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Silinemedi');
      } finally {
        setDeleting(false);
      }
    }
  };

  const calculateAge = (p: Person) => {
    if (!p.birth_date) return null;
    const birth = new Date(p.birth_date);
    const end = p.death_date ? new Date(p.death_date) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
        maxWidth: 500,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
        color: '#f1f5f9',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {loading || !person ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <span>⏳ Bilgiler yükleniyor…</span>
          </div>
        ) : (
          <div>
            {/* Read-only banner if viewing someone else's tree */}
            {isReadOnly && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 12,
                color: '#60a5fa',
              }}>
                <span>👁️</span> Bu profil başka bir kullanıcının ağacında yer aldığı için salt okunurdur.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: person.gender === 'female' ? '#ec4899' : '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                }}>
                  {(person.first_name[0] + (person.last_name[0] || '')).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                    {person.first_name} {person.last_name}
                  </h2>
                  {person.maiden_name && (
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>
                      (Kızlık Soyadı: {person.maiden_name})
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: person.is_living ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: person.is_living ? '#34d399' : '#f87171',
                      border: person.is_living ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      fontWeight: 600,
                    }}>
                      {person.is_living ? '🟢 Hayatta' : '⚪ Vefat Etmiş'}
                    </span>
                    {calculateAge(person) !== null && (
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20,
                        background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        {calculateAge(person)} Yaşında {person.is_living ? '' : ' (vefat)'}
                      </span>
                    )}
                  </div>
                </div>
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
                }}
              >
                ✕
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13, marginBottom: 18 }}>
              <div style={{
                padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 2 }}>Doğum</span>
                <strong style={{ fontSize: 14 }}>{person.birth_date ? new Date(person.birth_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</strong>
                {person.birth_place && <span style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginTop: 2 }}>📍 {person.birth_place}</span>}
              </div>

              {!person.is_living ? (
                <div style={{
                  padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 2 }}>Vefat</span>
                  <strong style={{ fontSize: 14 }}>{person.death_date ? new Date(person.death_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</strong>
                  {person.death_place && <span style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginTop: 2 }}>📍 {person.death_place}</span>}
                </div>
              ) : (
                <div style={{
                  padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 2 }}>Cinsiyet</span>
                  <strong style={{ fontSize: 14 }}>
                    {person.gender === 'female' ? 'Kadın' : person.gender === 'male' ? 'Erkek' : 'Diğer'}
                  </strong>
                </div>
              )}
            </div>

            {person.biography && (
              <div style={{ marginBottom: 20 }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 6 }}>Biyografi & Anılar</span>
                <p style={{
                  fontSize: 13, lineHeight: 1.6, background: 'rgba(255, 255, 255, 0.03)',
                  padding: 14, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)',
                  margin: 0,
                }}>
                  {person.biography}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              {!isReadOnly ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  }}
                >
                  {deleting ? 'Siliniyor…' : '🗑️ Ağaçtan Sil'}
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 24px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.08)', color: '#f1f5f9', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
