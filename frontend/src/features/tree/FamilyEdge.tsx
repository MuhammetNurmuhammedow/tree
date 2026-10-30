import React from 'react';
import { useTranslation } from 'react-i18next';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

// ── Blood (parent-child) edge ─────────────────────────────────────────────────
export const BloodEdge: React.FC<EdgeProps> = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 12,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ stroke: 'var(--text-secondary)', strokeWidth: 2 }}
    />
  );
};

// ── Spouse edge ───────────────────────────────────────────────────────────────
export const SpouseEdge: React.FC<EdgeProps> = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, label,
}) => {
  const { t } = useTranslation();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
  });

  // Dynamically translate standard marriage/spouse labels according to active language
  const getDisplayLabel = (rawLabel: unknown): string => {
    if (!rawLabel || typeof rawLabel !== 'string') return '';
    const norm = rawLabel.trim().toLowerCase();
    if (
      norm === 'evli' ||
      norm === 'married' ||
      norm === 'в браке' ||
      norm === 'nika' ||
      norm === 'spouse' ||
      norm === 'nika (ýanýoldaş)' ||
      norm === 'married (spouse)' ||
      norm === 'в браке (супруги)'
    ) {
      return t('edges.married');
    }
    if (
      norm === 'eski eş' ||
      norm === 'former spouse' ||
      norm === 'divorced' ||
      norm === 'в разводе' ||
      norm === 'развод' ||
      norm === 'aýrylyşan' ||
      norm === 'öňki nika' ||
      norm === 'former_spouse' ||
      norm === 'öňki nika (aýrylyşan)' ||
      norm === 'divorced (ex-spouse)' ||
      norm === 'в разводе (бывший брак)'
    ) {
      return t('edges.formerSpouse');
    }
    return rawLabel;
  };

  const displayLabel = getDisplayLabel(label);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'var(--accent-gold)',
          strokeWidth: 2,
          strokeDasharray: '6 3',
        }}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 10.5,
              fontWeight: 600,
              color: '#facc15',
              background: '#0f172a',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              padding: '2px 7px',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

