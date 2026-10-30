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

type CanvasTheme = 'slate' | 'blueprint' | 'parchment' | 'obsidian';

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
    name: 'Koyu Taş (Slate)',
    bgHex: '#0f172a',
    gridColor: '#334155',
    variant: BackgroundVariant.Dots,
    gap: 22,
  },
  blueprint: {
    id: 'blueprint',
    name: 'Mavi Plan (Blueprint)',
    bgHex: '#091a2f',
    gridColor: '#1e4d7e',
    variant: BackgroundVariant.Lines,
    gap: 28,
  },
  parchment: {
    id: 'parchment',
    name: 'Antik Parşömen (Heritage)',
    bgHex: '#1c1815',
    gridColor: '#3d342a',
    variant: BackgroundVariant.Cross,
    gap: 24,
  },
  obsidian: {
    id: 'obsidian',
    name: 'Derin Obsidyen (Minimal)',
    bgHex: '#09090b',
    gridColor: '#27272a',
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
}) => {
  const { t } = useTranslation();
  const { nodes: initialNodes, edges: initialEdges, isLoading, error, reload, resetLayout } = useTree(treeId, reloadTrigger);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TreeNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<any>(null);

  // Canvas Theme
  const [theme, setTheme] = useState<CanvasTheme>(() => {
    return (localStorage.getItem('familytree_canvas_theme') as CanvasTheme) || 'slate';
  });
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

  const handleSelectTheme = (t: CanvasTheme) => {
    setTheme(t);
    localStorage.setItem('familytree_canvas_theme', t);
    setShowThemeMenu(false);
    toast.success(`Tema değiştirildi: ${THEMES[t].name}`);
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
        <div className="flex items-center gap-3 px-5 py-3 rounded-md border border-slate-700 bg-slate-800/80 text-slate-300 text-sm font-medium shadow-lg">
          <TreeIcon className="animate-spin text-slate-400" size={20} />
          <span>Soy ağacı ve nesil dizilimi hesaplanıyor...</span>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex flex-col items-center justify-center gap-4`}>
        <div className="px-6 py-4 rounded-md border border-rose-800/50 bg-rose-950/40 text-rose-300 text-sm flex flex-col items-center gap-3 max-w-md text-center">
          <span className="font-semibold">{error}</span>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 rounded bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs transition"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!isLoading && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex flex-col items-center justify-center gap-4 text-slate-400`}>
        <div className="p-4 rounded-full border-2 border-dashed border-slate-700 bg-slate-800/50">
          <TreeIcon size={36} className="text-slate-500" />
        </div>
        <div className="text-base font-semibold text-slate-200">Ağaç Henüz Boş</div>
        <div className="text-xs text-slate-400 max-w-sm text-center">
          Bu ağaçta henüz kayıtlı birey bulunmuyor. Üst panelden "+ Yeni Kişi Ekle" butonuna tıklayarak ilk aile üyenizi ekleyin.
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
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {/* Reset Auto-Layout Button */}
          <button
            type="button"
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold shadow-lg backdrop-blur transition active:scale-95"
            title="Sürüklenmiş düğümleri otomatik hiyerarşik dizilime geri döndürür"
          >
            <RefreshIcon size={14} className="text-slate-400" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold shadow-lg backdrop-blur transition active:scale-95"
              title="Tuval Arka Plan Temasını Değiştir"
            >
              <PaletteIcon size={14} className="text-slate-400" />
              <span>{t('toolbar.theme')}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-md border border-slate-700 bg-slate-900 shadow-2xl p-1.5 z-50 flex flex-col gap-1">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
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
                      className={`flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition text-left ${
                        isSelected
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded border border-slate-600 flex-shrink-0"
                          style={{ backgroundColor: tObj.bgHex }}
                        />
                        <span>{t(`themes.${tKey}`)}</span>
                      </div>
                      {isSelected && <CheckIcon size={14} className="text-emerald-400" />}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700/60 text-emerald-300 text-xs font-semibold shadow-lg backdrop-blur transition active:scale-95"
              title="Ağacı PNG veya PDF Olarak Dışa Aktar"
            >
              <DownloadIcon size={14} />
              <span>{t('toolbar.export')}</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-md border border-slate-700 bg-slate-900 shadow-2xl p-1.5 z-50 flex flex-col gap-1">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                  {t('toolbar.export')}
                </div>
                <button
                  type="button"
                  onClick={exportToPNG}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-slate-200 hover:bg-slate-800 transition text-left"
                >
                  <ImageIcon size={15} className="text-sky-400" />
                  <div>
                    <div className="font-semibold">PNG</div>
                    <div className="text-[10px] text-slate-400">{t('toolbar.exportPng')}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={exportToPDF}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-slate-200 hover:bg-slate-800 transition text-left"
                >
                  <FilePdfIcon size={15} className="text-rose-400" />
                  <div>
                    <div className="font-semibold">PDF</div>
                    <div className="text-[10px] text-slate-400">{t('toolbar.exportPdf')}</div>
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
