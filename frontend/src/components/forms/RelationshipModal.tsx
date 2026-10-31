import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Person } from '@/types/person';
import { personService } from '@/services/personService';
import { relationshipService, type CreateRelationshipPayload } from '@/services/relationshipService';
import { RingIcon, CloseIcon, ShieldIcon, UserIcon, HeartIcon, BabyIcon } from '@/components/common/Icons';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourcePersonId?: string;
  defaultType?: 'parent' | 'child' | 'spouse';
  treeId?: string;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sourcePersonId,
  defaultType = 'spouse',
  treeId = 'my-tree',
}) => {
  const { t } = useTranslation();
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [baseCategory, setBaseCategory] = useState<'spouse' | 'parent' | 'child'>(defaultType);
  const [relType, setRelType] = useState<CreateRelationshipPayload['relationship_type']>(defaultType);
  const [customLabel, setCustomLabel] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persons in the tree
  useEffect(() => {
    if (isOpen) {
      personService.getAll().then((data) => {
        const filtered = data.filter((p) => p.id !== sourcePersonId &&
          ((p as unknown as { tree_id?: string }).tree_id === treeId || !(p as unknown as { tree_id?: string }).tree_id));
        setPersons(filtered);
        if (filtered.length > 0) setSelectedTargetId(filtered[0].id);
      }).catch(console.error);

      if (defaultType) {
        setBaseCategory(defaultType);
        setRelType(defaultType);
        if (defaultType === 'spouse') setCustomLabel(t('relationModal.spouseGeneral'));
        else if (defaultType === 'parent') setCustomLabel(t('relationModal.parentGeneral'));
        else if (defaultType === 'child') setCustomLabel(t('relationModal.childGeneral'));
      }
    }
  }, [isOpen, sourcePersonId, defaultType, treeId, t]);

  // When base category changes, set default underlying type and suggested label
  const handleCategoryChange = (cat: 'spouse' | 'parent' | 'child') => {
    setBaseCategory(cat);
    if (cat === 'spouse') {
      setRelType('spouse');
      setCustomLabel(t('relationModal.spouseGeneral'));
    } else if (cat === 'parent') {
      setRelType('parent');
      setCustomLabel(t('relationModal.parentGeneral'));
    } else if (cat === 'child') {
      setRelType('child');
      setCustomLabel(t('relationModal.childGeneral'));
    }
  };

  const handlePresetSelect = (type: CreateRelationshipPayload['relationship_type'], labelText: string) => {
    setRelType(type);
    setCustomLabel(labelText);
  };

  if (!isOpen || !sourcePersonId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setError(t('relationModal.errorSelect'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await relationshipService.create({
        person_id: sourcePersonId,
        related_person_id: selectedTargetId,
        relationship_type: relType,
        marriage_date: (relType === 'spouse' || relType === 'former_spouse') && marriageDate
          ? new Date(marriageDate).toISOString()
          : undefined,
        notes: customLabel.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('relationModal.errorGeneral'));
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
        maxWidth: 500,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        color: '#f5f2eb',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#c59b27', display: 'flex' }}><RingIcon size={20} /></span>
              {t('relationModal.title')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a8a296' }}>
              {t('relationModal.subtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <CloseIcon size={14} />
          </button>
        </div>

        {error && (
          <div style={errorBoxStyle}>
            <ShieldIcon size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Category Tabs */}
          <div>
            <label style={labelStyle}>{t('relationModal.bondCategory')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <button
                type="button"
                onClick={() => handleCategoryChange('spouse')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: baseCategory === 'spouse' ? '1px solid #6b521e' : '1px solid #2d303b',
                  background: baseCategory === 'spouse' ? '#2c2518' : '#191b22',
                  color: baseCategory === 'spouse' ? '#d4af37' : '#a8a296',
                  transition: 'all 0.12s',
                }}
              >
                <HeartIcon size={13} />
                <span>Nika / Ýanýoldaş</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('parent')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: baseCategory === 'parent' ? '1px solid #364861' : '1px solid #2d303b',
                  background: baseCategory === 'parent' ? '#1a2432' : '#191b22',
                  color: baseCategory === 'parent' ? '#a8c2de' : '#a8a296',
                  transition: 'all 0.12s',
                }}
              >
                <UserIcon size={13} />
                <span>Ene-Ata</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('child')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: baseCategory === 'child' ? '1px solid #365742' : '1px solid #2d303b',
                  background: baseCategory === 'child' ? '#192a20' : '#191b22',
                  color: baseCategory === 'child' ? '#9ec2a8' : '#a8a296',
                  transition: 'all 0.12s',
                }}
              >
                <BabyIcon size={13} />
                <span>Çaga</span>
              </button>
            </div>
          </div>

          {/* Quick Presets based on Category */}
          <div>
            <label style={labelStyle}>{t('relationModal.bondType')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {baseCategory === 'spouse' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.spouseGeneral'))} style={presetChipStyle(customLabel === t('relationModal.spouseGeneral'))}>
                    {t('relationModal.spouseGeneral')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.spouseHusband'))} style={presetChipStyle(customLabel === t('relationModal.spouseHusband'))}>
                    {t('relationModal.spouseHusband')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.spouseWife'))} style={presetChipStyle(customLabel === t('relationModal.spouseWife'))}>
                    {t('relationModal.spouseWife')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('former_spouse', t('relationModal.formerSpouse'))} style={presetChipStyle(customLabel === t('relationModal.formerSpouse'))}>
                    {t('relationModal.formerSpouse')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.fiance'))} style={presetChipStyle(customLabel === t('relationModal.fiance'))}>
                    {t('relationModal.fiance')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.inLawFather'))} style={presetChipStyle(customLabel === t('relationModal.inLawFather'))}>
                    {t('relationModal.inLawFather')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.inLawMother'))} style={presetChipStyle(customLabel === t('relationModal.inLawMother'))}>
                    {t('relationModal.inLawMother')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.inLawSon'))} style={presetChipStyle(customLabel === t('relationModal.inLawSon'))}>
                    {t('relationModal.inLawSon')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('spouse', t('relationModal.inLawDaughter'))} style={presetChipStyle(customLabel === t('relationModal.inLawDaughter'))}>
                    {t('relationModal.inLawDaughter')}
                  </button>
                </>
              )}

              {baseCategory === 'parent' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('parent', t('relationModal.parentFather'))} style={presetChipStyle(customLabel === t('relationModal.parentFather'))}>
                    {t('relationModal.parentFather')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('parent', t('relationModal.parentMother'))} style={presetChipStyle(customLabel === t('relationModal.parentMother'))}>
                    {t('relationModal.parentMother')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('adoptive_parent', t('relationModal.adoptiveParent'))} style={presetChipStyle(customLabel === t('relationModal.adoptiveParent'))}>
                    {t('relationModal.adoptiveParent')}
                  </button>
                </>
              )}

              {baseCategory === 'child' && (
                <>
                  <button type="button" onClick={() => handlePresetSelect('child', t('relationModal.childSon'))} style={presetChipStyle(customLabel === t('relationModal.childSon'))}>
                    {t('relationModal.childSon')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('child', t('relationModal.childDaughter'))} style={presetChipStyle(customLabel === t('relationModal.childDaughter'))}>
                    {t('relationModal.childDaughter')}
                  </button>
                  <button type="button" onClick={() => handlePresetSelect('adoptive_child', t('relationModal.adoptiveChild'))} style={presetChipStyle(customLabel === t('relationModal.adoptiveChild'))}>
                    {t('relationModal.adoptiveChild')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Editable Custom Kinship Label Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={labelStyle}>{t('relationModal.customTitleLabel')} *</label>
              <span style={{ fontSize: 11, color: '#38bdf8' }}>Üstüne ýazyp üýtgedip bilersiňiz</span>
            </div>
            <input
              type="text"
              required
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={t('relationModal.customTitlePlaceholder')}
              style={{
                ...inputStyle,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Target Person Selector */}
          <div>
            <label style={labelStyle}>{t('relationModal.targetPerson')}</label>
            {persons.length === 0 ? (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                border: '1px dashed #334155',
                fontSize: 13,
                color: '#94a3b8',
              }}>
                {t('relationModal.noPersons')}
              </div>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                style={inputStyle}
              >
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.gender === 'female' ? t('relationModal.female') : t('relationModal.male')})
                    {p.birth_date ? ` • ${t('node.born')} ${p.birth_date.slice(0, 4)}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Marriage Date (Only if spouse/marriage) */}
          {baseCategory === 'spouse' && (
            <div>
              <label style={labelStyle}>{t('relationModal.marriageDate')}</label>
              <input
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>
              {t('relationModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || persons.length === 0}
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: '1px solid #3a6850',
                background: '#254a37',
                color: '#f5f2eb',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12.5,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                opacity: persons.length === 0 ? 0.5 : 1,
              }}
            >
              {loading ? t('relationModal.submitting') : t('relationModal.submit')}
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
  color: '#a8a296',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #2d303b',
  backgroundColor: '#121318',
  color: '#f5f2eb',
  fontSize: 13,
  outline: 'none',
  colorScheme: 'dark',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #2d303b',
  borderRadius: 6,
  width: 28,
  height: 28,
  color: '#a8a296',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorBoxStyle: React.CSSProperties = {
  background: 'rgba(160, 60, 70, 0.15)',
  border: '1px solid rgba(160, 60, 70, 0.35)',
  color: '#e0b0b8',
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #2d303b',
  background: 'transparent',
  color: '#a8a296',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
};

const presetChipStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '5px 10px',
  borderRadius: 6,
  border: isSelected ? '1px solid #6b521e' : '1px solid #2d303b',
  background: isSelected ? '#282318' : '#191b22',
  color: isSelected ? '#d4af37' : '#dedbd2',
  fontSize: 11.5,
  fontWeight: isSelected ? 600 : 400,
  cursor: 'pointer',
  transition: 'all 0.12s',
});
