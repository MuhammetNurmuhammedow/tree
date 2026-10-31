import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Person, UpdatePersonPayload } from '@/types/person';
import { personService } from '@/services/personService';
import {
  CloseIcon,
  MapPinIcon,
  EyeIcon,
  RefreshIcon,
  CalendarIcon,
  UserIcon,
  EditIcon,
  CheckIcon,
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#121318',
  border: '1px solid #2d303b',
  borderRadius: 6,
  color: '#f5f2eb',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: '#a8a296',
  marginBottom: 4,
  fontWeight: 500,
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  marginBottom: 10,
};

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  personId,
  onClose,
  onDeleted,
  onUpdated,
  onAddRelative,
  isReadOnly = false,
}) => {
  const { t } = useTranslation();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdatePersonPayload>({});

  useEffect(() => {
    if (personId) {
      setLoading(true);
      setIsEditing(false);
      personService.getById(personId)
        .then(setPerson)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setPerson(null);
      setIsEditing(false);
    }
  }, [personId]);

  if (!personId) return null;

  const startEdit = () => {
    if (!person) return;
    setEditForm({
      first_name: person.first_name,
      last_name: person.last_name,
      maiden_name: person.maiden_name || '',
      gender: person.gender,
      birth_date: person.birth_date || '',
      birth_place: person.birth_place || '',
      death_date: person.death_date || '',
      death_place: person.death_place || '',
      is_living: person.is_living,
      biography: person.biography || '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!person) return;
    try {
      setSaving(true);
      const payload: UpdatePersonPayload = {
        ...editForm,
        birth_date: editForm.birth_date || undefined,
        death_date: editForm.is_living ? undefined : (editForm.death_date || undefined),
        death_place: editForm.is_living ? undefined : (editForm.death_place || undefined),
        maiden_name: editForm.maiden_name || undefined,
        birth_place: editForm.birth_place || undefined,
        biography: editForm.biography || undefined,
      };
      const updated = await personService.update(person.id, payload);
      setPerson(updated);
      setIsEditing(false);
      setEditForm({});
      toast.success(t('detailModal.updateSuccess'));
      onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ýalňyşlyk boldy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!person) return;
    if (window.confirm(t('detailModal.deleteConfirm'))) {
      try {
        setDeleting(true);
        await personService.delete(person.id);
        onDeleted?.();
        onUpdated?.();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Silinemedi');
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
      backgroundColor: 'rgba(10, 11, 14, 0.82)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#161820',
        border: '1px solid #2d313d',
        borderRadius: 10,
        padding: '24px 28px',
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        color: '#f5f2eb',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}>
        {loading || !person ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ea0a8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RefreshIcon size={16} className="animate-spin text-[#c59b27]" />
            <span>{t('detailModal.title')}…</span>
          </div>
        ) : (
          <div>
            {/* Read-only banner */}
            {isReadOnly && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: '#1c1e28',
                border: '1px solid #333849', borderRadius: 6,
                marginBottom: 16, fontSize: 12, color: '#adc4de',
              }}>
                <EyeIcon size={14} />
                <span>Bu profil başka bir kullanıcının ağacında yer aldığı için salt okunurdur.</span>
              </div>
            )}

            {/* Header: avatar + name + close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 8,
                  background: person.gender === 'female' ? '#2b191e' : '#192433',
                  color: person.gender === 'female' ? '#deb1b8' : '#a8c2de',
                  border: person.gender === 'female' ? '1px solid #4f2b33' : '1px solid #2b3b4f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  flexShrink: 0,
                }}>
                  {(person.first_name[0] + (person.last_name[0] || '')).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2, margin: 0, color: '#f5f2eb' }}>
                    {isEditing
                      ? `${editForm.first_name || ''} ${editForm.last_name || ''}`.trim() || t('detailModal.editTitle')
                      : `${person.first_name} ${person.last_name}`}
                  </h2>
                  {!isEditing && person.maiden_name && (
                    <span style={{ fontSize: 12, color: '#a8a296', fontStyle: 'italic', display: 'block', marginTop: 2 }}>
                      ({t('personModal.maidenName')}: {person.maiden_name})
                    </span>
                  )}
                  {!isEditing && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <span style={{
                        fontSize: 10.5, padding: '2px 8px', borderRadius: 4,
                        background: person.is_living ? 'rgba(82, 140, 110, 0.16)' : 'rgba(90, 86, 82, 0.20)',
                        color: person.is_living ? '#8db597' : '#b5aca1',
                        border: person.is_living ? '1px solid rgba(82, 140, 110, 0.35)' : '1px solid rgba(90, 86, 82, 0.35)',
                        fontWeight: 500,
                      }}>
                        {person.is_living ? t('node.living') : t('node.deceased')}
                      </span>
                      {calculateAge(person) !== null && (
                        <span style={{
                          fontSize: 10.5, padding: '2px 8px', borderRadius: 4,
                          background: '#1d202a', color: '#a8a296',
                          border: '1px solid #2d313f',
                        }}>
                          {calculateAge(person)} {t('detailModal.yearsOld')}
                          {!person.is_living ? ' (vefat)' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <span style={{ fontSize: 11, color: '#d4af37', marginTop: 4, display: 'block' }}>
                      {t('detailModal.editTitle')}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid #2d313d', borderRadius: 6,
                  width: 28, height: 28, color: '#a8a296', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #242733', margin: '14px 0' }} />

            {/* ===== VIEW MODE ===== */}
            {!isEditing && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 16 }}>
                  {/* Born */}
                  <div style={{ padding: '10px 12px', background: '#1c1f28', borderRadius: 6, border: '1px solid #2c303c' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8a867c', fontSize: 11, marginBottom: 2 }}>
                      <CalendarIcon size={12} />
                      <span>{t('detailModal.born')}</span>
                    </div>
                    <strong style={{ fontSize: 13.5, color: '#f5f2eb' }}>
                      {person.birth_date ? new Date(person.birth_date).toLocaleDateString() : '—'}
                    </strong>
                    {person.birth_place && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a8a296', fontSize: 11.5, marginTop: 4 }}>
                        <MapPinIcon size={11} />
                        <span>{person.birth_place}</span>
                      </div>
                    )}
                  </div>

                  {/* Died / Gender */}
                  {!person.is_living ? (
                    <div style={{ padding: '10px 12px', background: '#1c1f28', borderRadius: 6, border: '1px solid #2c303c' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8a867c', fontSize: 11, marginBottom: 2 }}>
                        <CalendarIcon size={12} />
                        <span>{t('detailModal.died')}</span>
                      </div>
                      <strong style={{ fontSize: 13.5, color: '#f5f2eb' }}>
                        {person.death_date ? new Date(person.death_date).toLocaleDateString() : '—'}
                      </strong>
                      {person.death_place && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a8a296', fontSize: 11.5, marginTop: 4 }}>
                          <MapPinIcon size={11} />
                          <span>{person.death_place}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', background: '#1c1f28', borderRadius: 6, border: '1px solid #2c303c' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8a867c', fontSize: 11, marginBottom: 2 }}>
                        <UserIcon size={12} />
                        <span>{t('personModal.gender')}</span>
                      </div>
                      <strong style={{ fontSize: 13.5, color: '#f5f2eb' }}>
                        {person.gender === 'female' ? t('personModal.genderFemale') : person.gender === 'male' ? t('personModal.genderMale') : t('personModal.genderOther')}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Biography */}
                {person.biography && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ color: '#8a867c', display: 'block', fontSize: 11, marginBottom: 5 }}>{t('detailModal.biography')}</span>
                    <p style={{
                      fontSize: 12.5, lineHeight: 1.6, background: '#1c1f28',
                      padding: 12, borderRadius: 6, border: '1px solid #2c303c',
                      margin: 0, color: '#dedbd2',
                    }}>
                      {person.biography}
                    </p>
                  </div>
                )}

                {/* Add relative buttons */}
                {!isReadOnly && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {(['parent', 'child', 'spouse'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { onAddRelative?.(type); onClose(); }}
                        style={{
                          flex: 1, padding: '7px 6px', borderRadius: 6,
                          border: '1px solid #2c303c', background: '#1c1f28',
                          color: '#dedbd2', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                          transition: 'background 0.12s ease',
                        }}
                      >
                        {type === 'parent' ? t('detailModal.addParent')
                          : type === 'child' ? t('detailModal.addChild')
                          : t('detailModal.addSpouse')}
                      </button>
                    ))}
                  </div>
                )}

                {/* View mode action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        padding: '8px 14px', borderRadius: 6,
                        border: '1px solid rgba(160, 60, 70, 0.4)',
                        background: 'rgba(160, 60, 70, 0.12)', color: '#d9828d',
                        cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}
                    >
                      {deleting ? '…' : t('detailModal.delete')}
                    </button>
                  ) : <div />}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={startEdit}
                        style={{
                          padding: '8px 16px', borderRadius: 6,
                          border: '1px solid #5a4722',
                          background: '#242018', color: '#d4af37',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <EditIcon size={13} />
                        {t('detailModal.edit')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        padding: '8px 20px', borderRadius: 6,
                        border: '1px solid #2d313d', background: '#1c1f28',
                        color: '#dedbd2', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}
                    >
                      {t('detailModal.close')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===== EDIT MODE ===== */}
            {isEditing && (
              <div>
                {/* Row 1: first_name + last_name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>{t('personModal.firstName')} *</label>
                    <input
                      style={inputStyle}
                      value={editForm.first_name || ''}
                      onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>{t('personModal.lastName')} *</label>
                    <input
                      style={inputStyle}
                      value={editForm.last_name || ''}
                      onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Row 2: maiden_name + gender */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>{t('personModal.maidenName')}</label>
                    <input
                      style={inputStyle}
                      value={editForm.maiden_name || ''}
                      onChange={e => setEditForm(f => ({ ...f, maiden_name: e.target.value }))}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>{t('personModal.gender')}</label>
                    <select
                      style={{ ...inputStyle, appearance: 'none' }}
                      value={editForm.gender || 'male'}
                      onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as any }))}
                    >
                      <option value="male">{t('personModal.genderMale')}</option>
                      <option value="female">{t('personModal.genderFemale')}</option>
                      <option value="other">{t('personModal.genderOther')}</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: birth_date + birth_place */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>{t('detailModal.born')}</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={editForm.birth_date ? editForm.birth_date.split('T')[0] : ''}
                      onChange={e => setEditForm(f => ({ ...f, birth_date: e.target.value }))}
                    />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>{t('detailModal.livedPlace')}</label>
                    <input
                      style={inputStyle}
                      value={editForm.birth_place || ''}
                      placeholder="Aşgabat, Türkmenistan"
                      onChange={e => setEditForm(f => ({ ...f, birth_place: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Living status toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: '#1c1f28',
                  border: '1px solid #2c303c', borderRadius: 6, marginBottom: 10,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                    <div
                      onClick={() => setEditForm(f => ({ ...f, is_living: !f.is_living }))}
                      style={{
                        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                        background: editForm.is_living ? '#346850' : '#45423e',
                        position: 'relative', transition: 'background 0.15s ease', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 2, left: editForm.is_living ? 18 : 2,
                        width: 16, height: 16, borderRadius: 8, background: '#f5f2eb',
                        transition: 'left 0.15s ease',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, color: '#f5f2eb', fontWeight: 500 }}>{t('detailModal.livingStatus')}</div>
                      <div style={{ fontSize: 11, color: '#a8a296' }}>{t('detailModal.isLivingDesc')}</div>
                    </div>
                  </label>
                </div>

                {/* Death fields (only if not living) */}
                {!editForm.is_living && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>{t('detailModal.died')}</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={editForm.death_date ? editForm.death_date.split('T')[0] : ''}
                        onChange={e => setEditForm(f => ({ ...f, death_date: e.target.value }))}
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>{t('personModal.deathPlace') || 'Aradan çykan ýeri'}</label>
                      <input
                        style={inputStyle}
                        value={editForm.death_place || ''}
                        placeholder="Aşgabat"
                        onChange={e => setEditForm(f => ({ ...f, death_place: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Biography */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>{t('detailModal.biography')}</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                    value={editForm.biography || ''}
                    placeholder={t('detailModal.noBiography')}
                    onChange={e => setEditForm(f => ({ ...f, biography: e.target.value }))}
                  />
                </div>

                {/* Edit mode action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    style={{
                      padding: '8px 16px', borderRadius: 6,
                      border: '1px solid #2d313d', background: 'transparent',
                      color: '#a8a296', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    }}
                  >
                    {t('detailModal.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !editForm.first_name || !editForm.last_name}
                    style={{
                      padding: '8px 20px', borderRadius: 6,
                      border: '1px solid #3f6850',
                      background: saving ? 'rgba(63, 104, 80, 0.2)' : '#254a37',
                      color: '#f5f2eb', cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5,
                      opacity: (!editForm.first_name || !editForm.last_name) ? 0.5 : 1,
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {saving ? (
                      <><RefreshIcon size={13} className="animate-spin" /> {t('detailModal.saving')}</>
                    ) : (
                      <><CheckIcon size={13} /> {t('detailModal.save')}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
