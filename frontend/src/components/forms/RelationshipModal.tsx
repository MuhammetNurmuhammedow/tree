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
  const [sourcePerson, setSourcePerson] = useState<Person | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [baseCategory, setBaseCategory] = useState<'spouse' | 'parent' | 'child'>(defaultType);
  const [relType, setRelType] = useState<CreateRelationshipPayload['relationship_type']>(defaultType);
  const [customLabel, setCustomLabel] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [detectedSpouse, setDetectedSpouse] = useState<{ id: string; name: string } | null>(null);
  const [linkSpouseAsWell, setLinkSpouseAsWell] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persons in the tree
  useEffect(() => {
    if (isOpen) {
      personService.getAll().then((data) => {
        const currentSrc = data.find((p) => p.id === sourcePersonId) || null;
        setSourcePerson(currentSrc);

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

  // Check for spouse of the parent when linking parent/child
  useEffect(() => {
    if (!isOpen || persons.length === 0) return;

    const personToCheckSpouse = baseCategory === 'parent' ? selectedTargetId : (baseCategory === 'child' ? sourcePersonId : null);
    if (!personToCheckSpouse) {
      setDetectedSpouse(null);
      return;
    }

    relationshipService.getByPersonId(personToCheckSpouse).then((rels: Array<{ person_id: string; related_person_id: string; relationship_type: string }>) => {
      const spouseRel = rels.find((r) => r.relationship_type === 'spouse');
      if (spouseRel) {
        const spouseId = spouseRel.person_id === personToCheckSpouse ? spouseRel.related_person_id : spouseRel.person_id;
        const spouseObj = persons.find((p) => p.id === spouseId) || (sourcePerson?.id === spouseId ? sourcePerson : null);
        if (spouseObj && spouseObj.id !== sourcePersonId && spouseObj.id !== selectedTargetId) {
          setDetectedSpouse({ id: spouseObj.id, name: `${spouseObj.first_name} ${spouseObj.last_name}` });
          setLinkSpouseAsWell(true);
          return;
        }
      }
      setDetectedSpouse(null);
    }).catch(() => {
      setDetectedSpouse(null);
    });
  }, [isOpen, baseCategory, selectedTargetId, sourcePersonId, persons, sourcePerson]);

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

      if (baseCategory === 'parent') {
        // Source is CHILD, Target is PARENT.
        // Database rule: person_id is Parent, related_person_id is Child.
        await relationshipService.create({
          person_id: selectedTargetId,
          related_person_id: sourcePersonId,
          relationship_type: 'parent',
          notes: customLabel.trim() || undefined,
        });

        // If primary parent has a married spouse and user kept the option checked:
        if (linkSpouseAsWell && detectedSpouse) {
          try {
            await relationshipService.create({
              person_id: detectedSpouse.id,
              related_person_id: sourcePersonId,
              relationship_type: 'parent',
              notes: 'Ene-ata',
            });
          } catch (spouseErr) {
            console.warn('Spouse parent link note:', spouseErr);
          }
        }
      } else if (baseCategory === 'child') {
        // Source is PARENT, Target is CHILD.
        // Database rule: person_id is Parent, related_person_id is Child.
        await relationshipService.create({
          person_id: sourcePersonId,
          related_person_id: selectedTargetId,
          relationship_type: 'parent',
          notes: customLabel.trim() || undefined,
        });

        // If source parent has a married spouse and user kept the option checked:
        if (linkSpouseAsWell && detectedSpouse) {
          try {
            await relationshipService.create({
              person_id: detectedSpouse.id,
              related_person_id: selectedTargetId,
              relationship_type: 'parent',
              notes: 'Ene-ata',
            });
          } catch (spouseErr) {
            console.warn('Spouse parent link note:', spouseErr);
          }
        }
      } else {
        // Spouse relationship
        await relationshipService.create({
          person_id: sourcePersonId,
          related_person_id: selectedTargetId,
          relationship_type: relType,
          marriage_date: (relType === 'spouse' || relType === 'former_spouse') && marriageDate
            ? new Date(marriageDate).toISOString()
            : undefined,
          notes: customLabel.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Creating relationship failed:', err);
      setError(t('relationModal.errorGeneral'));
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
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '24px 28px',
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        color: 'var(--text)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--card-accent)', display: 'flex' }}><RingIcon size={20} /></span>
              {t('relationModal.title')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {sourcePerson ? (
                <span>
                  Esasy şahs: <strong style={{ color: 'var(--text)' }}>{sourcePerson.first_name} {sourcePerson.last_name}</strong>
                </span>
              ) : t('relationModal.subtitle')}
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
                  border: baseCategory === 'spouse' ? '1px solid var(--card-accent)' : '1px solid var(--line)',
                  background: baseCategory === 'spouse' ? 'var(--header-active-bg)' : 'var(--surface-2)',
                  color: baseCategory === 'spouse' ? 'var(--card-accent)' : 'var(--text-muted)',
                  transition: 'all 0.12s',
                }}
              >
                <HeartIcon size={13} />
                <span>{t('relationModal.catSpouse')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('parent')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: baseCategory === 'parent' ? '1px solid var(--card-accent)' : '1px solid var(--line)',
                  background: baseCategory === 'parent' ? 'var(--header-active-bg)' : 'var(--surface-2)',
                  color: baseCategory === 'parent' ? 'var(--card-accent)' : 'var(--text-muted)',
                  transition: 'all 0.12s',
                }}
              >
                <UserIcon size={13} />
                <span>{t('relationModal.catParent')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('child')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: baseCategory === 'child' ? '1px solid var(--card-accent)' : '1px solid var(--line)',
                  background: baseCategory === 'child' ? 'var(--header-active-bg)' : 'var(--surface-2)',
                  color: baseCategory === 'child' ? 'var(--card-accent)' : 'var(--text-muted)',
                  transition: 'all 0.12s',
                }}
              >
                <BabyIcon size={13} />
                <span>{t('relationModal.catChild')}</span>
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
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('relationModal.editableHint')}</span>
            </div>
            <input
              type="text"
              required
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={t('relationModal.customTitlePlaceholder')}
              style={{
                ...inputStyle,
                borderColor: 'var(--card-accent)',
                backgroundColor: 'var(--surface-input)',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Target Person Selector */}
          <div>
            <label style={labelStyle}>
              {baseCategory === 'parent'
                ? 'Ene-atasy boljak şahs'
                : baseCategory === 'child'
                ? 'Çagasy boljak şahs'
                : t('relationModal.targetPerson')}
            </label>
            {persons.length === 0 ? (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                border: '1px dashed var(--line)',
                fontSize: 13,
                color: 'var(--text-muted)',
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

          {/* Spouse Dual-Link Detection Card */}
          {detectedSpouse && (baseCategory === 'parent' || baseCategory === 'child') && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 8,
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
            }}>
              <input
                type="checkbox"
                id="linkSpouseCheck"
                checked={linkSpouseAsWell}
                onChange={(e) => setLinkSpouseAsWell(e.target.checked)}
                style={{ marginTop: 2, cursor: 'pointer', accentColor: 'var(--card-accent)' }}
              />
              <label htmlFor="linkSpouseCheck" style={{ fontSize: 12.5, color: 'var(--text)', cursor: 'pointer', margin: 0, lineHeight: 1.4 }}>
                Ýanýoldaşy <strong style={{ color: 'var(--card-accent)' }}>{detectedSpouse.name}</strong> hem çaganyň ata-enesi hökmünde goşulsyn.
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  (Şeýlelikde agaçda şaha gös-göni ene-atanyň nika halkasyndan çaga tarap gaçyrlar)
                </div>
              </label>
            </div>
          )}

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
                border: '1px solid var(--header-primary-border)',
                background: 'var(--header-primary-bg)',
                color: 'var(--header-primary-text)',
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
  color: 'var(--text-muted)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  backgroundColor: 'var(--surface-input)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  colorScheme: 'dark',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--line)',
  borderRadius: 6,
  width: 28,
  height: 28,
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorBoxStyle: React.CSSProperties = {
  background: 'rgba(160, 60, 70, 0.15)',
  border: '1px solid rgba(160, 60, 70, 0.35)',
  color: 'var(--card-accent)',
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
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
};

const presetChipStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '5px 10px',
  borderRadius: 6,
  border: isSelected ? '1px solid var(--card-accent)' : '1px solid var(--line)',
  background: isSelected ? 'var(--header-active-bg)' : 'var(--surface-2)',
  color: isSelected ? 'var(--card-accent)' : 'var(--text)',
  fontSize: 11.5,
  fontWeight: isSelected ? 600 : 400,
  cursor: 'pointer',
  transition: 'all 0.12s',
});
