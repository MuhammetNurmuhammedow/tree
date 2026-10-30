import React, { useState, useEffect } from 'react';
import type { Person } from '@/types/person';
import { personService } from '@/services/personService';
import { relationshipService, type CreateRelationshipPayload } from '@/services/relationshipService';

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
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [relType, setRelType] = useState<CreateRelationshipPayload['relationship_type']>(defaultType);
  const [marriageDate, setMarriageDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      personService.getAll().then((data) => {
        // Only show persons in the current tree
        const filtered = data.filter((p) => p.id !== sourcePersonId && ((p as unknown as { tree_id?: string }).tree_id === treeId || !(p as unknown as { tree_id?: string }).tree_id));
        setPersons(filtered);
        if (filtered.length > 0) {
          setSelectedTargetId(filtered[0].id);
        }
      }).catch(console.error);

      if (defaultType) {
        setRelType(defaultType);
      }
    }
  }, [isOpen, sourcePersonId, defaultType, treeId]);

  if (!isOpen || !sourcePersonId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setError('Lütfen bir aile üyesi seçin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await relationshipService.create({
        person_id: sourcePersonId,
        related_person_id: selectedTargetId,
        relationship_type: relType,
        marriage_date: marriageDate ? new Date(marriageDate).toISOString() : undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlişki eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = (t: string) => {
    switch (t) {
      case 'parent': return 'Ebeveyni Yap (Anne / Baba)';
      case 'child': return 'Çocuğu Yap (Evlat)';
      case 'spouse': return 'Eş / Partner (Evlilik Bağı)';
      case 'former_spouse': return 'Eski Eş (Boşanmış)';
      default: return t;
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
        maxWidth: 480,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(234, 179, 8, 0.1)',
        color: '#f1f5f9',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔗</span> Aile Bağı Oluştur
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              İki aile üyesi arasında ebeveyn, eş veya çocuk bağı kurun
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
            marginBottom: 16,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Bağ Türü</label>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as CreateRelationshipPayload['relationship_type'])}
              style={darkInputStyle}
            >
              <option value="spouse">{getTypeName('spouse')}</option>
              <option value="parent">{getTypeName('parent')}</option>
              <option value="child">{getTypeName('child')}</option>
              <option value="former_spouse">{getTypeName('former_spouse')}</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Bağlanacak Aile Üyesi</label>
            {persons.length === 0 ? (
              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 10,
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                fontSize: 13,
                color: '#94a3b8',
              }}>
                Ağaçta bağlanacak başka bir üye bulunamadı. Önce yeni bir kişi ekleyin.
              </div>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                style={darkInputStyle}
              >
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} {p.gender === 'female' ? '(Kadın)' : '(Erkek)'} {p.birth_date ? `• d. ${p.birth_date.slice(0, 4)}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {(relType === 'spouse' || relType === 'former_spouse') && (
            <div>
              <label style={labelStyle}>Evlilik Tarihi (Opsiyonel)</label>
              <input
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                style={darkInputStyle}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
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
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || persons.length === 0}
              style={{
                padding: '9px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                color: '#0b0f19',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 13,
                boxShadow: '0 4px 14px rgba(234, 179, 8, 0.35)',
                opacity: persons.length === 0 ? 0.5 : 1,
              }}
            >
              {loading ? 'Kaydediliyor…' : 'Bağı Tamamla'}
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
