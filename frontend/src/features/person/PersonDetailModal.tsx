import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Gender, Person, UpdatePersonPayload } from '@/types/person';
import { personService } from '@/services/personService';
import { formatLifespan, yearOf } from '@/i18n/format';
import {
  CloseIcon,
  MapPinIcon,
  EyeIcon,
  RefreshIcon,
  CalendarIcon,
  UserIcon,
  EditIcon,
  CheckIcon,
  CameraIcon,
} from '@/components/common/Icons';

export interface PersonFamily {
  parents: Person[];
  spouses: Person[];
  siblings: Person[];
  children: Person[];
}

interface PersonDetailModalProps {
  personId: string | null;
  /** Relatives derived from the loaded tree; each entry is clickable. */
  family?: PersonFamily;
  onSelectPerson?: (id: string) => void;
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
  background: 'var(--surface-input)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--text-muted)',
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
  family,
  onSelectPerson,
  isReadOnly = false,
}) => {
  const { t, i18n } = useTranslation();
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(i18n.resolvedLanguage);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdatePersonPayload>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const avatarUploadRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !person) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('photo.tooLarge'));
      return;
    }

    try {
      setUploadingPhoto(true);
      toast.loading(t('photo.uploading'), { id: 'avatar-upload' });
      const updatedPerson = await personService.updateAvatar(person.id, file);
      setPerson(updatedPerson);
      toast.success(t('photo.uploadSuccess'), { id: 'avatar-upload' });
      onUpdated?.();
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error(t('photo.uploadError'), { id: 'avatar-upload' });
    } finally {
      setUploadingPhoto(false);
      if (avatarUploadRef.current) avatarUploadRef.current.value = '';
    }
  };

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

  // Escape closes the panel (unless a form field is being edited)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isEditing, onClose]);

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
      console.error('Saving person failed:', err);
      toast.error(t('errors.generic'));
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
        console.error('Deleting person failed:', err);
        toast.error(t('errors.generic'));
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
    <aside
      className="person-panel"
      role="dialog"
      aria-label={person ? `${person.first_name} ${person.last_name}` : t('detailModal.title')}
    >
      <div>
        {loading || !person ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RefreshIcon size={16} className="animate-spin text-[var(--card-accent)]" />
            <span>{t('detailModal.title')}…</span>
          </div>
        ) : (
          <div>
            {/* Read-only banner */}
            {isReadOnly && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: 'var(--surface-2)',
                border: '1px solid var(--line)', borderRadius: 6,
                marginBottom: 16, fontSize: 12, color: 'var(--text-muted)',
              }}>
                <EyeIcon size={14} />
                <span>{t('detailModal.readOnlyNotice')}</span>
              </div>
            )}

            {/* Header: avatar + name + close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.first_name}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--card-accent)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div className={`avatar-${person.gender}`} style={{
                      width: 58, height: 58, borderRadius: '50%',
                      border: '2px solid var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 600,
                    }}>
                      {(person.first_name[0] + (person.last_name[0] || '')).toUpperCase()}
                    </div>
                  )}

                  {!isReadOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => avatarUploadRef.current?.click()}
                        disabled={uploadingPhoto}
                        title={t('photo.change')}
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--surface-2)',
                          border: '1.5px solid var(--card-accent)',
                          color: 'var(--card-accent)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                          transition: 'transform 0.1s ease',
                        }}
                      >
                        <CameraIcon size={12} />
                      </button>
                      <input
                        type="file"
                        ref={avatarUploadRef}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={handleAvatarUpload}
                      />
                    </>
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2, margin: 0, color: 'var(--text)' }}>
                    {isEditing
                      ? `${editForm.first_name || ''} ${editForm.last_name || ''}`.trim() || t('detailModal.editTitle')
                      : `${person.first_name} ${person.last_name}`}
                  </h2>
                  {!isEditing && person.maiden_name && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', marginTop: 2 }}>
                      ({t('search.matchMaiden')}: {person.maiden_name})
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
                          background: 'var(--surface-2)', color: 'var(--text-muted)',
                          border: '1px solid var(--line)',
                        }}>
                          {t('detailModal.age', { count: calculateAge(person) })}
                        </span>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <span style={{ fontSize: 11, color: 'var(--card-accent)', marginTop: 4, display: 'block' }}>
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
                  border: '1px solid var(--line)', borderRadius: 6,
                  width: 28, height: 28, color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '14px 0' }} />

            {/* ===== VIEW MODE ===== */}
            {!isEditing && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 16 }}>
                  {/* Born */}
                  <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
                      <CalendarIcon size={12} />
                      <span>{t('detailModal.born')}</span>
                    </div>
                    <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>
                      {person.birth_date ? formatDate(person.birth_date) : '—'}
                    </strong>
                    {person.birth_place && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4 }}>
                        <MapPinIcon size={11} />
                        <span>{person.birth_place}</span>
                      </div>
                    )}
                  </div>

                  {/* Died / Gender */}
                  {!person.is_living ? (
                    <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
                        <CalendarIcon size={12} />
                        <span>{t('detailModal.died')}</span>
                      </div>
                      <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>
                        {person.death_date ? formatDate(person.death_date) : '—'}
                      </strong>
                      {person.death_place && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4 }}>
                          <MapPinIcon size={11} />
                          <span>{person.death_place}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
                        <UserIcon size={12} />
                        <span>{t('personModal.gender')}</span>
                      </div>
                      <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>
                        {person.gender === 'female' ? t('personModal.genderFemale') : t('personModal.genderMale')}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Biography */}
                {person.biography && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11, marginBottom: 5 }}>{t('detailModal.biography')}</span>
                    <p style={{
                      fontSize: 12.5, lineHeight: 1.6, background: 'var(--surface-2)',
                      padding: 12, borderRadius: 6, border: '1px solid var(--line)',
                      margin: 0, color: 'var(--text)',
                    }}>
                      {person.biography}
                    </p>
                  </div>
                )}

                {/* Immediate family */}
                {family && (
                  <section style={{ marginBottom: 16 }}>
                    <h3 className="panel-section-title">{t('family.title')}</h3>
                    <FamilyGroup label={t('family.parents')} people={family.parents} onSelect={onSelectPerson} />
                    <FamilyGroup label={t('family.spouses')} people={family.spouses} onSelect={onSelectPerson} />
                    <FamilyGroup label={t('family.siblings')} people={family.siblings} onSelect={onSelectPerson} />
                    <FamilyGroup label={t('family.children')} people={family.children} onSelect={onSelectPerson} />
                    {family.parents.length + family.spouses.length + family.siblings.length + family.children.length === 0 && (
                      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>{t('family.none')}</p>
                    )}
                  </section>
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
                          border: '1px solid var(--line)', background: 'var(--surface-2)',
                          color: 'var(--text)', cursor: 'pointer', fontSize: 11, fontWeight: 500,
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
                        background: 'rgba(160, 60, 70, 0.12)', color: 'var(--card-accent)',
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
                          border: '1px solid var(--header-newtree-border)',
                          background: 'var(--header-newtree-bg)', color: 'var(--card-accent)',
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
                        border: '1px solid var(--line)', background: 'var(--surface-2)',
                        color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
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
                      onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as Gender }))}
                    >
                      <option value="male">{t('personModal.genderMale')}</option>
                      <option value="female">{t('personModal.genderFemale')}</option>
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
                      placeholder={t('detailModal.placeholderPlace')}
                      onChange={e => setEditForm(f => ({ ...f, birth_place: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Living status toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'var(--surface-2)',
                  border: '1px solid var(--line)', borderRadius: 6, marginBottom: 10,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                    <div
                      onClick={() => setEditForm(f => ({ ...f, is_living: !f.is_living }))}
                      style={{
                        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                        background: editForm.is_living ? 'var(--header-primary-bg)' : 'var(--line)',
                        position: 'relative', transition: 'background 0.15s ease', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 2, left: editForm.is_living ? 18 : 2,
                        width: 16, height: 16, borderRadius: 8, background: 'var(--text)',
                        transition: 'left 0.15s ease',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{t('detailModal.livingStatus')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('detailModal.isLivingDesc')}</div>
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
                      <label style={labelStyle}>{t('personModal.deathPlace')}</label>
                      <input
                        style={inputStyle}
                        value={editForm.death_place || ''}
                        placeholder={t('personModal.placeholderDeathPlace')}
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
                      border: '1px solid var(--line)', background: 'transparent',
                      color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
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
                      border: '1px solid var(--header-primary-border)',
                      background: saving ? 'rgba(63, 104, 80, 0.2)' : 'var(--header-primary-bg)',
                      color: 'var(--header-primary-text)', cursor: saving ? 'not-allowed' : 'pointer',
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
    </aside>
  );
};

const FamilyGroup: React.FC<{
  label: string;
  people: Person[];
  onSelect?: (id: string) => void;
}> = ({ label, people, onSelect }) => {
  const { t } = useTranslation();
  if (people.length === 0) return null;
  return (
    <div>
      <div className="family-group-label">{label}</div>
      {people.map((p) => (
        <button key={p.id} type="button" className="family-chip" onClick={() => onSelect?.(p.id)}>
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="family-chip__avatar" />
          ) : (
            <span className={`family-chip__avatar avatar-${p.gender}`} aria-hidden="true">
              {(p.first_name[0] + (p.last_name[0] || '')).toUpperCase()}
            </span>
          )}
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.first_name} {p.last_name}
          </span>
          <span className="family-chip__years">
            {formatLifespan(t, yearOf(p.birth_date), yearOf(p.death_date), p.is_living)}
          </span>
        </button>
      ))}
    </div>
  );
};
