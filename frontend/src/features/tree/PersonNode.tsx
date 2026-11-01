import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { TreeNodeData } from '@/types/tree';
import type { Person } from '@/types/person';
import { useTreeEvents } from './TreeEventsContext';
import { formatLifespan, yearOf } from '@/i18n/format';
import { SPOUSE_ANCHOR_Y } from './layoutEngine';
import { UserIcon, HeartIcon, BabyIcon, EyeIcon } from '@/components/common/Icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(p: Person): string {
  const f = p.first_name ? p.first_name[0] : '?';
  const l = p.last_name ? p.last_name[0] : '';
  return (f + l).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

type CustomPersonNode = Node<TreeNodeData, 'personNode'>;

const PersonNode: React.FC<NodeProps<CustomPersonNode>> = ({ data }) => {
  const { t } = useTranslation();
  const { person } = data;
  const { onAddParent, onAddSpouse, onAddChild, onViewProfile, isReadOnly } = useTreeEvents();

  if (!person) return null;

  const isDead = !person.is_living;
  const gender = person.gender;
  const genderLabel = gender === 'female' ? t('personModal.genderFemale') : t('personModal.genderMale');
  const lifespan = formatLifespan(t, yearOf(person.birth_date), yearOf(person.death_date), person.is_living);

  const nodeClass = [
    'person-node',
    `node-${gender}`,
    isDead ? 'is-deceased' : '',
    data.isSelected ? 'node-selected' : '',
    data.isHighlighted ? 'node-highlighted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={nodeClass}
      onClick={() => onViewProfile?.(person.id)}
      aria-label={`${person.first_name} ${person.last_name}, ${genderLabel}, ${isDead ? t('node.deceased') : t('node.living')}, ${lifespan}`}
    >
      {/* React Flow handles for connectors */}
      <Handle id="top" type="target" position={Position.Top} className="custom-flow-handle" isConnectable={false} />
      <Handle id="bottom" type="source" position={Position.Bottom} className="custom-flow-handle" isConnectable={false} />
      <Handle id="spouse-left" type="target" position={Position.Left} className="spouse-handle" style={{ top: SPOUSE_ANCHOR_Y }} isConnectable={false} />
      <Handle id="spouse-right" type="source" position={Position.Right} className="spouse-handle" style={{ top: SPOUSE_ANCHOR_Y }} isConnectable={false} />

      {person.avatar_url ? (
        <img src={person.avatar_url} alt="" className="person-node__avatar" />
      ) : (
        <div className={`person-node__avatar-placeholder avatar-${gender}`} aria-hidden="true">
          {getInitials(person)}
        </div>
      )}

      <div className="person-node__meta">
        <h4 className="person-node__fullname" title={`${person.first_name} ${person.last_name}`}>
          {person.first_name} <strong>{person.last_name}</strong>
        </h4>
        <div className="person-node__row" title={person.birth_place}>
          {isDead && <span className="person-node__cross" aria-hidden="true">†</span>}
          {lifespan}
          {person.birth_place ? ` · ${person.birth_place}` : ''}
        </div>
        {person.maiden_name && (
          <div className="person-node__maiden">
            {t('search.matchMaiden')}: {person.maiden_name}
          </div>
        )}
      </div>

      {/* Tactical Hover Menu */}
      <div className="person-node__actions">
        {!isReadOnly && (
          <>
            <button
              type="button"
              className="action-btn"
              title={t('node.addParent')}
              onClick={(e) => {
                e.stopPropagation();
                onAddParent?.(person.id);
              }}
            >
              <UserIcon size={13} />
              <span>{t('node.addParent')}</span>
            </button>

            <button
              type="button"
              className="action-btn"
              title={t('node.addSpouse')}
              onClick={(e) => {
                e.stopPropagation();
                onAddSpouse?.(person.id);
              }}
            >
              <HeartIcon size={13} />
              <span>{t('node.addSpouse')}</span>
            </button>

            <button
              type="button"
              className="action-btn"
              title={t('node.addChild')}
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.(person.id);
              }}
            >
              <BabyIcon size={13} />
              <span>{t('node.addChild')}</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="action-btn action-view"
          title={t('node.viewProfile')}
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile?.(person.id);
          }}
        >
          <EyeIcon size={13} />
          <span>{t('node.viewProfile')}</span>
        </button>
      </div>
    </div>
  );
};

export default memo(PersonNode);
