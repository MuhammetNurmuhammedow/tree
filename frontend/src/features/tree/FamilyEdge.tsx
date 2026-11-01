import React from 'react';
import { useTranslation } from 'react-i18next';
import { BaseEdge, EdgeLabelRenderer, useInternalNode } from '@xyflow/react';
import type { EdgeProps, Edge } from '@xyflow/react';
import type { FamilyEdgeData } from '@/types/tree';
import { GulIcon } from '@/components/common/Icons';
import { SPOUSE_ANCHOR_Y } from './layoutEngine';
import { buildBranch } from './branchPath';

type FamilyEdge = Edge<FamilyEdgeData>;

// ── Blood (parent-child) edge, drawn as a tapering tree branch ───────────────
// For a child of a couple the branch starts at the middle of the marriage line,
// read live from both parents so it follows when either card is dragged.
// Sibling branches share that start point and merge into a trunk there.
export const BloodEdge: React.FC<EdgeProps<FamilyEdge>> = ({
  id, source, sourceX, sourceY, targetX, targetY, data,
}) => {
  const parent = useInternalNode(source);
  const partner = useInternalNode(data?.partnerId ?? '');

  let startX = sourceX;
  let startY = sourceY;
  if (parent && partner) {
    const center = (n: typeof parent) => ({
      x: n.internals.positionAbsolute.x + (n.measured.width ?? 0) / 2,
      y: n.internals.positionAbsolute.y + SPOUSE_ANCHOR_Y,
    });
    const a = center(parent);
    const b = center(partner);
    startX = (a.x + b.x) / 2;
    startY = (a.y + b.y) / 2;
  }

  const branch = buildBranch(id, { x: startX, y: startY }, { x: targetX, y: targetY });

  return (
    <g className="family-branch">
      <path d={branch.outline} className="family-branch__wood" />
      <path d={branch.spine} className="family-branch__grain" />
      {branch.leaves.map((leaf, i) => (
        <path
          key={i}
          d={LEAF_PATH}
          className="family-branch__leaf"
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle}) scale(${leaf.scale})`}
        />
      ))}
    </g>
  );
};

// Almond-shaped leaf with its stem at the origin, pointing along +x.
const LEAF_PATH = 'M0,0 C3,-4.5 9,-5 13,0 C9,5 3,4.5 0,0 Z';

// ── Spouse edge ───────────────────────────────────────────────────────────────

// Labels saved before the UI language could change are mapped back to the
// localized default so they follow the active language.
const MARRIED_ALIASES = new Set([
  'evli', 'married', 'в браке', 'nika', 'spouse', 'nika (ýanýoldaş)', 'married (spouse)', 'в браке (супруги)',
]);
const FORMER_ALIASES = new Set([
  'eski eş', 'former spouse', 'divorced', 'в разводе', 'развод', 'aýrylyşan', 'öňki nika',
  'former_spouse', 'öňki nika (aýrylyşan)', 'divorced (ex-spouse)', 'в разводе (бывший брак)',
]);

export const SpouseEdge: React.FC<EdgeProps<FamilyEdge>> = ({
  id, sourceX, sourceY, targetX, targetY, label, data,
}) => {
  const { t } = useTranslation();
  const isFormer = data?.relationshipType === 'former_spouse';

  const raw = typeof label === 'string' ? label.trim() : '';
  const norm = raw.toLowerCase();
  let title: string;
  if (!raw || MARRIED_ALIASES.has(norm) || FORMER_ALIASES.has(norm)) {
    title = FORMER_ALIASES.has(norm) || isFormer ? t('edges.formerSpouse') : t('edges.married');
  } else {
    title = raw;
  }

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`family-edge family-edge--spouse${isFormer ? ' is-former' : ''}`}
      />
      <EdgeLabelRenderer>
        <div
          className={`spouse-badge nodrag nopan${isFormer ? ' is-former' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)` }}
          title={title}
          aria-label={title}
          role="img"
        >
          <GulIcon size={14} />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
