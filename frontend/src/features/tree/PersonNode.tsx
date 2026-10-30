import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { TreeNodeData } from '@/types/tree';
import type { Person } from '@/types/person';
import { useTreeEvents } from './TreeEventsContext';
import { UserIcon, HeartIcon, BabyIcon, EyeIcon, CalendarIcon, MapPinIcon } from '@/components/common/Icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(p: Person): string {
  const f = p.first_name ? p.first_name[0] : '?';
  const l = p.last_name ? p.last_name[0] : '';
  return (f + l).toUpperCase();
}

function formatYears(person: Person): string {
  const born = person.birth_date ? person.birth_date.slice(0, 4) : '?';
  if (!person.is_living && person.death_date) {
    return `${born} – ${person.death_date.slice(0, 4)}`;
  }
  return person.is_living ? `d. ${born}` : `d. ${born} – vefat`;
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

  const nodeClass = [
    'person-node',
    isDead ? 'node-dead' : `node-${gender}`,
    data.isHighlighted ? 'node-highlighted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={nodeClass} onClick={() => onViewProfile?.(person.id)}>
      {/* React Flow handles for connectors */}
      <Handle type="target" position={Position.Top} className="custom-flow-handle" />
      <Handle type="source" position={Position.Bottom} className="custom-flow-handle" />

      {/* Header Badge */}
      <div className="person-node__topbar">
        <span className={`gender-tag gender-${gender}`}>
          {gender === 'male' ? t('personModal.genderMale') : gender === 'female' ? t('personModal.genderFemale') : t('personModal.genderOther')}
        </span>
        {isDead ? (
          <span className="status-tag status-dead">{t('node.deceased')}</span>
        ) : (
          <span className="status-tag status-living">{t('node.living')}</span>
        )}
      </div>

      {/* Main Content */}
      <div className="person-node__body">
        {/* Avatar */}
        {person.avatar_url ? (
          <img
            src={person.avatar_url}
            alt={person.first_name}
            className="person-node__avatar"
          />
        ) : (
          <div className={`person-node__avatar-placeholder avatar-${gender}`}>
            {getInitials(person)}
          </div>
        )}

        {/* Identity & Dates */}
        <div className="person-node__meta">
          <h4 className="person-node__fullname" title={`${person.first_name} ${person.last_name}`}>
            {person.first_name} <strong>{person.last_name}</strong>
          </h4>

          {person.maiden_name && (
            <div className="person-node__maiden">
              Kızlık: <em>{person.maiden_name}</em>
            </div>
          )}

          <div className="person-node__row">
            <CalendarIcon size={12} className="meta-icon" />
            <span>{formatYears(person)}</span>
          </div>

          {person.birth_place && (
            <div className="person-node__row">
              <MapPinIcon size={12} className="meta-icon" />
              <span className="truncate">{person.birth_place}</span>
            </div>
          )}
        </div>
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
