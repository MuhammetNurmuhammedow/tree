import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Person } from '@/types/person';
import { personService } from '@/services/personService';
import {
  CloseIcon,
  MapPinIcon,
  EyeIcon,
  RefreshIcon,
  CalendarIcon,
  UserIcon,
} from '@/components/common/Icons';

interface PersonDetailModalProps {
  personId: string | null;
  treeId?: string;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
  onAddRelative?: (type: 'parent' | 'child' | 'spouse') => void;
  isReadOnly?: boolean;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  personId,
  onClose,
  onDeleted,
  onUpdated,
  isReadOnly = false,
}) => {
  const { t } = useTranslation();
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
        onDeleted?.();
        onUpdated?.();
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
      backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 10,
        padding: '24px 28px',
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
        color: '#f1f5f9',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {loading || !person ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }} className="flex items-center justify-center gap-2">
            <RefreshIcon size={16} className="animate-spin text-slate-400" />
            <span>Kişi bilgileri alınıyor...</span>
          </div>
        ) : (
          <div>
            {/* Read-only banner */}
            {isReadOnly && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: '#0d2544',
                border: '1px solid #1e4d7e',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 12,
                color: '#7dd3fc',
              }}>
                <EyeIcon size={14} />
                <span>Bu profil başka bir kullanıcının ağacında yer aldığı için salt okunurdur.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 6,
                  background: person.gender === 'female' ? '#831843' : '#1e3a8a',
                  color: person.gender === 'female' ? '#fbcfe8' : '#93c5fd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700,
                  border: '1px solid #334155',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                }}>
                  {(person.first_name[0] + (person.last_name[0] || '')).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, margin: 0, color: '#f8fafc' }}>
                    {person.first_name} {person.last_name}
                  </h2>
                  {person.maiden_name && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      (Kızlık Soyadı: {person.maiden_name})
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <span style={{
                      fontSize: 10.5, padding: '2px 8px', borderRadius: 4,
                      background: person.is_living ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                      color: person.is_living ? '#4ade80' : '#94a3b8',
                      border: person.is_living ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                      fontWeight: 600,
                    }}>
                      {person.is_living ? t('node.living') : t('node.deceased')}
                    </span>
                    {calculateAge(person) !== null && (
                      <span style={{
                        fontSize: 10.5, padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8',
                        border: '1px solid #334155',
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  width: 30,
                  height: 30,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '14px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 16 }}>
              <div style={{
                padding: '10px 12px', background: '#1e293b',
                borderRadius: 6, border: '1px solid #334155',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>
                  <CalendarIcon size={12} />
                  <span>{t('detailModal.born')}</span>
                </div>
                <strong style={{ fontSize: 13.5, color: '#f8fafc' }}>
                  {person.birth_date ? new Date(person.birth_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                </strong>
                {person.birth_place && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11.5, marginTop: 4 }}>
                    <MapPinIcon size={11} />
                    <span>{person.birth_place}</span>
                  </div>
                )}
              </div>

              {!person.is_living ? (
                <div style={{
                  padding: '10px 12px', background: '#1e293b',
                  borderRadius: 6, border: '1px solid #334155',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>
                    <CalendarIcon size={12} />
                    <span>{t('detailModal.died')}</span>
                  </div>
                  <strong style={{ fontSize: 13.5, color: '#f8fafc' }}>
                    {person.death_date ? new Date(person.death_date).toLocaleDateString() : '—'}
                  </strong>
                  {person.death_place && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11.5, marginTop: 4 }}>
                      <MapPinIcon size={11} />
                      <span>{person.death_place}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '10px 12px', background: '#1e293b',
                  borderRadius: 6, border: '1px solid #334155',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>
                    <UserIcon size={12} />
                    <span>{t('personModal.gender')}</span>
                  </div>
                  <strong style={{ fontSize: 13.5, color: '#f8fafc' }}>
                    {person.gender === 'female' ? t('personModal.genderFemale') : person.gender === 'male' ? t('personModal.genderMale') : t('personModal.genderOther')}
                  </strong>
                </div>
              )}
            </div>

            {person.biography && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 5 }}>{t('detailModal.biography')}</span>
                <p style={{
                  fontSize: 12.5, lineHeight: 1.5, background: '#1e293b',
                  padding: 12, borderRadius: 6, border: '1px solid #334155',
                  margin: 0, color: '#e2e8f0',
                }}>
                  {person.biography}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              {!isReadOnly ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: '8px 14px', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  }}
                >
                  {deleting ? '…' : 'Ağaçtan Sil'}
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 20px', borderRadius: 6, border: '1px solid #334155',
                  background: '#1e293b', color: '#f1f5f9', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500,
                }}
              >
                {t('detailModal.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
