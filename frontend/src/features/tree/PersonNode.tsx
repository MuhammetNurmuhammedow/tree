import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { TreeNodeData } from '@/types/tree';
import type { Person } from '@/types/person';
import { useTreeEvents } from './TreeEventsContext';

// ── Helper ────────────────────────────────────────────────────────────────────

function getInitials(p: Person): string {
  const f = p.first_name ? p.first_name[0] : '?';
  const l = p.last_name ? p.last_name[0] : '';
  return (f + l).toUpperCase();
}

function getAvatarColor(gender: Person['gender']): string {
  const map: Record<string, string> = {
    male:    '#2563eb',
    female:  '#db2777',
    other:   '#7c3aed',
    unknown: '#6b7280',
  };
  return map[gender] ?? '#6b7280';
}

function formatYears(person: Person): string {
  const born = person.birth_date ? person.birth_date.slice(0, 4) : '?';
  if (!person.is_living && person.death_date) {
    return `${born} – ${person.death_date.slice(0, 4)}`;
  }
  return person.is_living ? `d. ${born}` : `d. ${born} – †`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type CustomPersonNode = Node<TreeNodeData, 'personNode'>;

const PersonNode: React.FC<NodeProps<CustomPersonNode>> = ({ data }) => {
  const { person } = data;
  const { onAddParent, onAddSpouse, onAddChild, onViewProfile, isReadOnly } = useTreeEvents();

  if (!person) return null;

  const isDead = !person.is_living;
  const gender = person.gender;

  const nodeClass = [
    'person-node',
    isDead ? 'dead' : gender,
  ].join(' ');

  return (
    <div className={nodeClass} onClick={() => onViewProfile?.(person.id)}>
      {/* React Flow handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        {person.avatar_url ? (
          <img
            src={person.avatar_url}
            alt={person.first_name}
            className="person-node__avatar"
          />
        ) : (
          <div
            className="person-node__avatar-placeholder"
            style={{ background: getAvatarColor(gender) }}
          >
            {getInitials(person)}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="person-node__name" title={`${person.first_name} ${person.last_name}`}>
            {person.first_name} {person.last_name}
            {person.maiden_name && (
              <span style={{ fontWeight: 400, opacity: 0.65 }}> ({person.maiden_name})</span>
            )}
          </div>
          <div className="person-node__years">{formatYears(person)}</div>
        </div>
      </div>

      {/* Hover micro-menu */}
      <div className="person-node__menu">
        {!isReadOnly && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); onAddParent?.(person.id); }}>+ Ebeveyn</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onAddSpouse?.(person.id); }}>+ Eş</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onAddChild?.(person.id); }}>+ Çocuk</button>
          </>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onViewProfile?.(person.id); }}>
          {isReadOnly ? '👁️ Detaylar' : 'Profil'}
        </button>
      </div>
    </div>
  );
};

export default memo(PersonNode);
