import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import PersonNode from './PersonNode';
import { BloodEdge, SpouseEdge } from './FamilyEdge';
import { useTree } from '@/hooks/useTree';
import { TreeEventsProvider } from './TreeEventsContext';
import type { TreeNodeData } from '@/types/tree';
import {
  DownloadIcon,
  PaletteIcon,
  RefreshIcon,
  ImageIcon,
  FilePdfIcon,
  CheckIcon,
  TreeIcon,
} from '@/components/common/Icons';
import '@/styles/tree.css';

// Register custom node and edge types
const nodeTypes = { personNode: PersonNode };
const edgeTypes = { bloodEdge: BloodEdge, spouseEdge: SpouseEdge };

export type CanvasTheme = 'slate' | 'white' | 'parchment' | 'obsidian';

interface ThemeConfig {
  id: CanvasTheme;
  name: string;
  bgHex: string;
  gridColor: string;
  variant: BackgroundVariant;
  gap: number;
}

const THEMES: Record<CanvasTheme, ThemeConfig> = {
  slate: {
    id: 'slate',
    name: 'Arhiw Klasik (Archival Slate)',
    bgHex: '#131418',
    gridColor: '#21232b',
    variant: BackgroundVariant.Dots,
    gap: 22,
  },
  white: {
    id: 'white',
    name: 'Ak Tema (Kagyz / White)',
    bgHex: '#f5f6f8',
    gridColor: '#d5d9e0',
    variant: BackgroundVariant.Dots,
    gap: 22,
  },
  parchment: {
    id: 'parchment',
    name: 'Miras (Warm Walnut & Linen)',
    bgHex: '#171412',
    gridColor: '#28221c',
    variant: BackgroundVariant.Cross,
    gap: 24,
  },
  obsidian: {
    id: 'obsidian',
    name: 'Gijeki Syýa (Midnight Ink)',
    bgHex: '#0d0e10',
    gridColor: '#181a1e',
    variant: BackgroundVariant.Dots,
    gap: 20,
  },
};

interface TreeCanvasProps {
  treeId?: string;
  treeName?: string;
  highlightPersonId?: string | null;
  onAddParent?: (id: string) => void;
  onAddSpouse?: (id: string) => void;
  onAddChild?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  reloadTrigger?: number;
  isReadOnly?: boolean;
  theme?: CanvasTheme;
  onThemeChange?: (theme: CanvasTheme) => void;
}

const TreeCanvas: React.FC<TreeCanvasProps> = ({
  treeId = 'my-tree',
  treeName = 'Soy Ağacı',
  highlightPersonId = null,
  onAddParent,
  onAddSpouse,
  onAddChild,
  onViewProfile,
  reloadTrigger = 0,
  isReadOnly = false,
  theme: controlledTheme,
  onThemeChange,
}) => {
  const { t } = useTranslation();
  const { nodes: initialNodes, edges: initialEdges, isLoading, error, reload, resetLayout } = useTree(treeId, reloadTrigger);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TreeNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<any>(null);

  // Canvas Theme
  const [internalTheme, setInternalTheme] = useState<CanvasTheme>(() => {
    const raw = localStorage.getItem('familytree_canvas_theme');
    if (raw === 'blueprint') return 'white';
    return (raw as CanvasTheme) || 'slate';
  });

  const theme = controlledTheme ?? internalTheme;
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync state when initial data loads
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Center & Highlight node when search selection or highlightPersonId changes
  useEffect(() => {
    if (!highlightPersonId) {
      setNodes((current) =>
        current.map((n) =>
          n.data?.isHighlighted ? { ...n, data: { ...n.data, isHighlighted: false } } : n
        )
      );
      return;
    }

    setNodes((current) =>
      current.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isHighlighted: n.id === highlightPersonId,
        },
      }))
    );

    const targetNode = nodes.find((n) => n.id === highlightPersonId);
    if (targetNode && rfInstance) {
      rfInstance.setCenter(targetNode.position.x + 118, targetNode.position.y + 55, {
        zoom: 1.2,
        duration: 900,
      });
    }
  }, [highlightPersonId, rfInstance]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Persist node position when dragged and released
  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      try {
        const storageKey = `familytree_positions_${treeId}`;
        const existingRaw = localStorage.getItem(storageKey);
        const positions = existingRaw ? JSON.parse(existingRaw) : {};
        positions[node.id] = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
        localStorage.setItem(storageKey, JSON.stringify(positions));
      } catch (err) {
        console.error('Konum kaydedilemedi:', err);
      }
    },
    [treeId]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSelectTheme = (tKey: CanvasTheme) => {
    setInternalTheme(tKey);
    localStorage.setItem('familytree_canvas_theme', tKey);
    onThemeChange?.(tKey);
    setShowThemeMenu(false);
    toast.success(`Tema: ${THEMES[tKey].name}`);
  };

  const handleResetLayout = () => {
    resetLayout();
    toast.success('Düğümler otomatik hiyerarşiye hizalandı');
  };

  // ── High Resolution Export to PNG ──────────────────────────────────────────
  const exportToPNG = async () => {
    setShowExportMenu(false);
    const viewportEl = canvasRef.current?.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportEl) {
      toast.error('Tuval bulunamadı');
      return;
    }

    try {
      setIsExporting(true);
      toast.loading('Yüksek çözünürlüklü PNG hazırlanıyor...', { id: 'export-toast' });

      const currentThemeConfig = THEMES[theme];
      const dataUrl = await toPng(viewportEl, {
        backgroundColor: currentThemeConfig.bgHex,
        pixelRatio: 2.5,
        quality: 1,
      });

      const safeName = treeName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const link = document.createElement('a');
      link.download = `soy_agaci_${safeName}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(t('toast.pngSuccess'), { id: 'export-toast' });
    } catch (err) {
      console.error('PNG export hatası:', err);
      toast.error(t('toast.pngError'), { id: 'export-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  // ── High Resolution Export to PDF ──────────────────────────────────────────
  const exportToPDF = async () => {
    setShowExportMenu(false);
    const viewportEl = canvasRef.current?.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportEl) {
      toast.error('Tuval bulunamadı');
      return;
    }

    try {
      setIsExporting(true);
      toast.loading(t('toolbar.exporting'), { id: 'export-toast' });

      const currentThemeConfig = THEMES[theme];
      const dataUrl = await toPng(viewportEl, {
        backgroundColor: currentThemeConfig.bgHex,
        pixelRatio: 2,
        quality: 0.95,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width * 0.75, img.height * 0.75],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width * 0.75, img.height * 0.75);
      const safeName = treeName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      pdf.save(`soy_agaci_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);

      toast.success(t('toast.pdfSuccess'), { id: 'export-toast' });
    } catch (err) {
      console.error('PDF export hatası:', err);
      toast.error(t('toast.pdfError'), { id: 'export-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  const eventsValue = useMemo(
    () => ({
      onAddParent,
      onAddSpouse,
      onAddChild,
      onViewProfile,
      isReadOnly,
    }),
    [onAddParent, onAddSpouse, onAddChild, onViewProfile, isReadOnly]
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex items-center justify-center`}>
        <div className="flex items-center gap-3 px-5 py-3 rounded-md border border-[#2d303b] bg-[#181a20] text-[#dedbd2] text-sm font-medium shadow-lg">
          <TreeIcon className="animate-spin text-[#c59b27]" size={20} />
          <span>Soy ağacı we nesil tertibi hasaplanýar...</span>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex flex-col items-center justify-center gap-4`}>
        <div className="px-6 py-4 rounded-md border border-[#4d252a] bg-[#231518] text-[#e0b0b8] text-sm flex flex-col items-center gap-3 max-w-md text-center">
          <span className="font-semibold">{error}</span>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 rounded bg-[#5c2a31] hover:bg-[#73353e] text-white font-medium text-xs transition"
          >
            Täzeden Synanyş
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!isLoading && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex flex-col items-center justify-center gap-4 text-[#9ea0a8]`}>
        <div className="p-4 rounded-full border border-dashed border-[#3a3e4c] bg-[#1a1c22]">
          <TreeIcon size={34} className="text-[#c59b27]" />
        </div>
        <div className="text-base font-semibold text-[#f5f2eb]">Agaç Entäk Boş</div>
        <div className="text-xs text-[#9e978e] max-w-sm text-center leading-relaxed">
          Bu agaçda entäk bellige alnan şahs ýok. Ýokarky panelden "+ Täze Maşgala Agzasy" düwmesine basyp ilkinji maşgala agzanyzy goşuň.
        </div>
      </div>
    );
  }

  const currentTheme = THEMES[theme];

  return (
    <TreeEventsProvider value={eventsValue}>
      <div
        ref={canvasRef}
        className={`tree-canvas-wrapper canvas-theme-${theme}`}
      >
        {/* Floating Canvas Control Toolbar */}
        <div className="tree-canvas-toolbar absolute top-4 right-4 z-30 flex items-center gap-2">
          {/* Reset Auto-Layout Button */}
          <button
            type="button"
            onClick={handleResetLayout}
            className="tree-toolbar-btn"
            title="Sürüklenmiş düğümleri otomatik hiyerarşik dizilime geri döndürür"
          >
            <RefreshIcon size={13} style={{ opacity: 0.8 }} />
            <span>{t('toolbar.resetLayout')}</span>
          </button>

          {/* Theme Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowExportMenu(false);
              }}
              className="tree-toolbar-btn"
              title="Tuval Arka Plan Temasını Değiştir"
            >
              <PaletteIcon size={13} style={{ color: 'var(--card-accent, #c59b27)' }} />
              <span>{t('toolbar.theme')}</span>
            </button>

            {showThemeMenu && (
              <div className="tree-toolbar-menu">
                <div className="tree-toolbar-menu-header">
                  {t('toolbar.theme')}
                </div>
                {(Object.keys(THEMES) as CanvasTheme[]).map((tKey) => {
                  const tObj = THEMES[tKey];
                  const isSelected = theme === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => handleSelectTheme(tKey)}
                      className={`tree-toolbar-menu-item ${isSelected ? 'active' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded border border-[#3b3f4f] flex-shrink-0"
                          style={{ backgroundColor: tObj.bgHex }}
                        />
                        <span>{t(`themes.${tKey}`)}</span>
                      </div>
                      {isSelected && <CheckIcon size={13} style={{ color: 'var(--card-accent, #c59b27)' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowThemeMenu(false);
              }}
              className="tree-toolbar-export-btn"
              title="Ağacı PNG veya PDF Olarak Dışa Aktar"
            >
              <DownloadIcon size={13} />
              <span>{t('toolbar.export')}</span>
            </button>

            {showExportMenu && (
              <div className="tree-toolbar-menu">
                <div className="tree-toolbar-menu-header">
                  {t('toolbar.export')}
                </div>
                <button
                  type="button"
                  onClick={exportToPNG}
                  className="tree-toolbar-menu-item"
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon size={14} style={{ color: 'var(--card-accent, #c59b27)' }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--header-text)' }}>PNG</div>
                      <div className="text-[10px]" style={{ color: 'var(--header-subtext)' }}>{t('toolbar.exportPng')}</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={exportToPDF}
                  className="tree-toolbar-menu-item"
                >
                  <div className="flex items-center gap-2.5">
                    <FilePdfIcon size={14} className="text-[#a8525e]" />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--header-text)' }}>PDF</div>
                      <div className="text-[10px]" style={{ color: 'var(--header-subtext)' }}>{t('toolbar.exportPdf')}</div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={setRfInstance}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.1}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={currentTheme.variant}
            gap={currentTheme.gap}
            size={currentTheme.variant === BackgroundVariant.Lines ? 1 : 1.5}
            color={currentTheme.gridColor}
          />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const gender = (n.data as TreeNodeData)?.person?.gender;
              const isLiving = (n.data as TreeNodeData)?.person?.is_living;
              if (isLiving === false) return '#64748b';
              const colors: Record<string, string> = {
                male: '#2563eb',
                female: '#db2777',
                other: '#7c3aed',
              };
              return colors[gender ?? ''] ?? '#64748b';
            }}
            maskColor="rgba(0,0,0,0.65)"
          />
        </ReactFlow>
      </div>
    </TreeEventsProvider>
  );
};

export default TreeCanvas;
