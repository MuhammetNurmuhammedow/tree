import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
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
  GulIcon,
  PlusIcon,
  MinusIcon,
  FitViewIcon,
  TargetIcon,
  InfoIcon,
  PrinterIcon,
} from '@/components/common/Icons';
import { NODE_WIDTH, NODE_HEIGHT } from './layoutEngine';
import { getFontEmbedCSS } from './fontEmbed';
import '@/styles/tree.css';

// Register custom node and edge types
const nodeTypes = { personNode: PersonNode };
const edgeTypes = { bloodEdge: BloodEdge, spouseEdge: SpouseEdge };

// Frame the whole tree, but never zoom in past 100% so small trees don't look blown up,
// and never out past 40% so cards stay readable on phones (the rest is a pan away).
const FIT_VIEW_OPTIONS = { padding: 0.15, maxZoom: 1, minZoom: 0.4 };

export type CanvasTheme = 'carpet' | 'night';

/** Older saved theme names (slate, white, …) fall back to the default carpet theme. */
export const normalizeTheme = (raw: string | null): CanvasTheme => (raw === 'night' ? 'night' : 'carpet');

interface ThemeConfig {
  id: CanvasTheme;
  /** Solid background used for PNG/PDF export (the on-screen canvas also has a göl pattern). */
  bgHex: string;
}

const THEMES: Record<CanvasTheme, ThemeConfig> = {
  carpet: { id: 'carpet', bgHex: '#f3e9d4' },
  night: { id: 'night', bgHex: '#131a2c' },
};

const MINIMAP_COLORS: Record<string, string> = {
  male: '#2f4a7a',
  female: '#a8323e',
};

interface TreeCanvasProps {
  treeId?: string;
  treeName?: string;
  highlightPersonId?: string | null;
  /** Person whose profile panel is open; their card is outlined and kept in view. */
  selectedPersonId?: string | null;
  /** Reports the laid-out graph so the app can derive relatives for the profile panel. */
  onGraphChange?: (nodes: Node<TreeNodeData>[], edges: Edge[]) => void;
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
  treeName,
  highlightPersonId = null,
  selectedPersonId = null,
  onGraphChange,
  onAddParent,
  onAddSpouse,
  onAddChild,
  onViewProfile,
  reloadTrigger = 0,
  isReadOnly = false,
  theme: controlledTheme,
  onThemeChange,
}) => {
  const { t, i18n } = useTranslation();
  const displayName = treeName || t('tree.fallbackName');
  const { nodes: initialNodes, edges: initialEdges, isLoading, error, reload, resetLayout } = useTree(treeId, reloadTrigger);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TreeNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<any>(null);

  // Canvas Theme
  const [internalTheme, setInternalTheme] = useState<CanvasTheme>(() =>
    normalizeTheme(localStorage.getItem('familytree_canvas_theme'))
  );

  const theme = controlledTheme ?? internalTheme;
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync state when initial data loads, then frame the whole tree at a readable zoom
  useEffect(() => {
    setNodes(initialNodes);
    if (rfInstance && initialNodes.length > 0) {
      requestAnimationFrame(() => rfInstance.fitView(FIT_VIEW_OPTIONS));
    }
  }, [initialNodes, setNodes, rfInstance]);

  // Center a card, leaving room for the profile panel (right side on desktop,
  // bottom sheet on phones) so the card is not hidden underneath it.
  const centerOn = useCallback(
    (personId: string) => {
      const target = rfInstance?.getNode(personId);
      if (!rfInstance || !target) return;
      const zoom = Math.max(rfInstance.getZoom(), 0.85);
      const isPhone = window.innerWidth <= 640;
      const panelOffsetX = !isPhone && selectedPersonId ? 200 / zoom : 0;
      const panelOffsetY = isPhone && selectedPersonId ? (window.innerHeight * 0.25) / zoom : 0;
      rfInstance.setCenter(
        target.position.x + NODE_WIDTH / 2 + panelOffsetX,
        target.position.y + NODE_HEIGHT / 2 + panelOffsetY,
        { zoom, duration: 600 }
      );
    },
    [rfInstance, selectedPersonId]
  );

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

    centerOn(highlightPersonId);
  }, [highlightPersonId, rfInstance]);

  // Outline the person whose profile panel is open and bring their card into view
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => {
        const isSelected = n.id === selectedPersonId;
        return Boolean(n.data?.isSelected) === isSelected ? n : { ...n, data: { ...n.data, isSelected } };
      })
    );
    if (selectedPersonId) centerOn(selectedPersonId);
  }, [selectedPersonId, rfInstance]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    onGraphChange?.(initialNodes, initialEdges);
  }, [initialNodes, initialEdges, onGraphChange]);

  const ariaLabelConfig = useMemo(
    () => ({
      'node.a11yDescription.default': t('canvas.a11yNode'),
      'node.a11yDescription.keyboardDisabled': t('canvas.a11yNode'),
      'node.a11yDescription.ariaLiveMessage': () => t('canvas.a11yMoved'),
      'edge.a11yDescription.default': t('canvas.a11yEdge'),
      'controls.ariaLabel': t('canvas.a11yControls'),
      'minimap.ariaLabel': t('canvas.minimap'),
      'handle.ariaLabel': t('canvas.a11yHandle'),
    }),
    [t]
  );

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
        console.error('Failed to save node position:', err);
      }
    },
    [treeId]
  );

  const handleSelectTheme = (tKey: CanvasTheme) => {
    setInternalTheme(tKey);
    localStorage.setItem('familytree_canvas_theme', tKey);
    onThemeChange?.(tKey);
    setShowThemeMenu(false);
    toast.success(t('canvas.themeChanged', { name: t(`themes.${tKey}`) }));
  };

  const handleResetLayout = () => {
    resetLayout();
    toast.success(t('canvas.layoutReset'));
  };

  // ── Whole-tree image (used by PNG, PDF and print) ───────────────────────────
  // Renders every card at 100% scale regardless of the current pan/zoom, so
  // exports and printouts always contain the full tree, not just what's on screen.
  const renderTreeImage = async (backgroundColor: string, pixelRatio: number) => {
    const viewportEl = canvasRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewportEl || !rfInstance || nodes.length === 0) throw new Error('nothing to render');

    const padding = 48;
    const bounds = rfInstance.getNodesBounds(nodes);
    const width = Math.ceil(bounds.width + padding * 2);
    const height = Math.ceil(bounds.height + padding * 2);
    // Keep the bitmap under ~8k px on its long side; browsers refuse larger canvases.
    const ratio = Math.min(pixelRatio, 8000 / Math.max(width, height));

    const fontEmbedCSS = await getFontEmbedCSS();
    const dataUrl = await toPng(viewportEl, {
      backgroundColor,
      // Pass our own font CSS (or skip fonts entirely) so the library never tries
      // to read the cross-origin Google Fonts stylesheet, which crashes it.
      ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
      width,
      height,
      pixelRatio: ratio,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${padding - bounds.x}px, ${padding - bounds.y}px) scale(1)`,
      },
    });
    return { dataUrl, width, height };
  };

  const fileBaseName = () => {
    const safeName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    return `family_tree_${safeName}_${new Date().toISOString().slice(0, 10)}`;
  };

  const exportToPNG = async () => {
    setShowExportMenu(false);
    try {
      setIsExporting(true);
      toast.loading(t('canvas.exportingPng'), { id: 'export-toast' });
      const { dataUrl } = await renderTreeImage(THEMES[theme].bgHex, 2.5);
      const link = document.createElement('a');
      link.download = `${fileBaseName()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t('toast.pngSuccess'), { id: 'export-toast' });
    } catch (err) {
      console.error('PNG export failed:', err);
      toast.error(t('toast.pngError'), { id: 'export-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setShowExportMenu(false);
    try {
      setIsExporting(true);
      toast.loading(t('toolbar.exporting'), { id: 'export-toast' });
      const { dataUrl, width, height } = await renderTreeImage(THEMES[theme].bgHex, 2);
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`${fileBaseName()}.pdf`);
      toast.success(t('toast.pdfSuccess'), { id: 'export-toast' });
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error(t('toast.pdfError'), { id: 'export-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Print ───────────────────────────────────────────────────────────────────
  // Prints a dedicated page (title, member count, date + the whole tree fitted
  // to one sheet) from a hidden iframe, instead of the interactive screen.
  const printTree = async () => {
    setShowExportMenu(false);
    try {
      setIsExporting(true);
      toast.loading(t('canvas.preparingPrint'), { id: 'print-toast' });
      // White ground saves ink; cards and branches keep their colours.
      const { dataUrl, width, height } = await renderTreeImage('#ffffff', 2);

      const escape = (text: string) =>
        text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
      const date = new Date().toLocaleDateString(i18n.resolvedLanguage);
      const meta = `${t('tree.memberCount', { count: nodes.length })} · ${t('canvas.printedOn', { date })}`;
      const orientation = width >= height ? 'landscape' : 'portrait';

      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(`<!doctype html>
<html lang="${i18n.resolvedLanguage ?? 'tk'}">
<head>
<meta charset="utf-8">
<title>${escape(displayName)}</title>
<style>
  @page { size: A4 ${orientation}; margin: 12mm; }
  html, body { margin: 0; height: 100%; }
  body { display: flex; flex-direction: column; color: #2b1d14; font-family: 'PT Serif', Georgia, serif; }
  header { display: flex; justify-content: space-between; align-items: baseline; gap: 12mm;
           border-bottom: 2px solid #9e2a2b; padding-bottom: 3mm; margin-bottom: 5mm; }
  h1 { font-size: 18pt; font-weight: 700; margin: 0; }
  .meta { font-family: 'PT Sans', Arial, sans-serif; font-size: 9pt; color: #735f4a; white-space: nowrap; }
  main { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
</style>
</head>
<body>
  <header><h1>${escape(displayName)}</h1><div class="meta">${escape(meta)}</div></header>
  <main><img src="${dataUrl}" alt=""></main>
</body>
</html>`);
      doc.close();

      const win = iframe.contentWindow!;
      const img = doc.querySelector('img')!;
      await (img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; }));
      toast.dismiss('print-toast');

      const cleanup = () => setTimeout(() => iframe.remove(), 500);
      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();
      // Some browsers never fire afterprint for iframes; don't leave it behind.
      setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);
    } catch (err) {
      console.error('Printing failed:', err);
      toast.error(t('errors.generic'), { id: 'print-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  // Ctrl/Cmd+P prints the tree page instead of a screenshot of the app UI
  const printRef = useRef(printTree);
  printRef.current = printTree;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        printRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        <div className="canvas-state-card">
          <GulIcon className="canvas-state-icon animate-spin-slow" size={22} />
          <span>{t('canvas.loading')}</span>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex flex-col items-center justify-center gap-4`}>
        <div className="canvas-state-card flex-col max-w-md text-center">
          <span className="font-semibold">{t('canvas.error')}</span>
          <button type="button" onClick={reload} className="app-primary-btn">
            {t('canvas.retry')}
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!isLoading && nodes.length === 0) {
    return (
      <div className={`tree-canvas-wrapper canvas-theme-${theme} flex flex-col items-center justify-center gap-3`}>
        <GulIcon size={56} className="canvas-state-icon" />
        <div className="canvas-state-title">{t('canvas.empty')}</div>
        <div className="canvas-state-hint">
          {t('canvas.emptyHint')}
        </div>
      </div>
    );
  }

  return (
    <TreeEventsProvider value={eventsValue}>
      <div
        ref={canvasRef}
        className={`tree-canvas-wrapper canvas-theme-${theme}`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={setRfInstance}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodesConnectable={false}
          deleteKeyCode={null}
          ariaLabelConfig={ariaLabelConfig}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
          minZoom={0.1}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Panel position="bottom-left" className="canvas-dock" style={{ margin: 16 }}>
            {showLegend && (
              <div className="canvas-legend" role="note">
                <div className="canvas-legend__title">{t('legend.title')}</div>
                <span className="legend-swatch" style={{ '--swatch': '#52759c' } as React.CSSProperties} />
                <span>{t('legend.male')}</span>
                <span className="legend-swatch" style={{ '--swatch': '#a35a69' } as React.CSSProperties} />
                <span>{t('legend.female')}</span>
                <span className="legend-swatch" style={{ opacity: 0.55 }} />
                <span>{t('legend.deceased')}</span>
                <span className="legend-line" style={{ '--line-color': 'var(--spouse-color)' } as React.CSSProperties} />
                <span>{t('legend.married')}</span>
                <span className="legend-line" style={{ '--line-color': 'var(--edge-color)', borderTopStyle: 'dashed' } as React.CSSProperties} />
                <span>{t('legend.divorced')}</span>
                <span className="legend-line is-branch" />
                <span>{t('legend.parentChild')}</span>
              </div>
            )}
            <div className="canvas-controls" role="toolbar" aria-label={t('canvas.a11yControls')}>
              <button type="button" onClick={() => rfInstance?.zoomIn({ duration: 200 })} title={t('canvas.zoomIn')} aria-label={t('canvas.zoomIn')}>
                <PlusIcon size={15} />
              </button>
              <button type="button" onClick={() => rfInstance?.zoomOut({ duration: 200 })} title={t('canvas.zoomOut')} aria-label={t('canvas.zoomOut')}>
                <MinusIcon size={15} />
              </button>
              <button type="button" onClick={() => rfInstance?.fitView({ ...FIT_VIEW_OPTIONS, duration: 400 })} title={t('canvas.fitView')} aria-label={t('canvas.fitView')}>
                <FitViewIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => selectedPersonId && centerOn(selectedPersonId)}
                disabled={!selectedPersonId}
                title={t('canvas.focusSelected')}
                aria-label={t('canvas.focusSelected')}
              >
                <TargetIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setShowLegend((v) => !v)}
                aria-pressed={showLegend}
                title={t('canvas.showLegend')}
                aria-label={t('canvas.showLegend')}
              >
                <InfoIcon size={15} />
              </button>
              <span className="canvas-controls__divider" aria-hidden="true" />
              <button type="button" onClick={handleResetLayout} title={t('canvas.resetLayoutHint')} aria-label={t('toolbar.resetLayout')}>
                <RefreshIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => { setShowThemeMenu((v) => !v); setShowExportMenu(false); }}
                aria-pressed={showThemeMenu}
                aria-haspopup="menu"
                title={t('canvas.themeHint')}
                aria-label={t('toolbar.theme')}
              >
                <PaletteIcon size={15} />
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => { setShowExportMenu((v) => !v); setShowThemeMenu(false); }}
                aria-pressed={showExportMenu}
                aria-haspopup="menu"
                title={t('canvas.exportHint')}
                aria-label={t('toolbar.export')}
              >
                <DownloadIcon size={15} />
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={printTree}
                title={t('canvas.printHint')}
                aria-label={t('canvas.print')}
              >
                <PrinterIcon size={15} />
              </button>
            </div>

            {showThemeMenu && (
              <div className="canvas-menu" role="menu">
                <div className="canvas-menu__header">{t('toolbar.theme')}</div>
                {(Object.keys(THEMES) as CanvasTheme[]).map((tKey) => (
                  <button
                    key={tKey}
                    type="button"
                    role="menuitemradio"
                    aria-checked={theme === tKey}
                    onClick={() => handleSelectTheme(tKey)}
                    className="canvas-menu__item"
                  >
                    <span className="canvas-menu__swatch" style={{ backgroundColor: THEMES[tKey].bgHex }} />
                    <span>{t(`themes.${tKey}`)}</span>
                    {theme === tKey && <CheckIcon size={13} className="canvas-menu__check" />}
                  </button>
                ))}
              </div>
            )}

            {showExportMenu && (
              <div className="canvas-menu" role="menu">
                <div className="canvas-menu__header">{t('toolbar.export')}</div>
                <button type="button" role="menuitem" onClick={exportToPNG} className="canvas-menu__item">
                  <ImageIcon size={15} />
                  <span>{t('toolbar.exportPng')}</span>
                </button>
                <button type="button" role="menuitem" onClick={exportToPDF} className="canvas-menu__item">
                  <FilePdfIcon size={15} />
                  <span>{t('toolbar.exportPdf')}</span>
                </button>
                <button type="button" role="menuitem" onClick={printTree} className="canvas-menu__item">
                  <PrinterIcon size={15} />
                  <span>{t('canvas.print')}</span>
                </button>
              </div>
            )}
          </Panel>
          <MiniMap
            nodeColor={(n) => {
              const person = (n.data as TreeNodeData)?.person;
              if (person?.is_living === false) return '#9a8a74';
              return MINIMAP_COLORS[person?.gender ?? ''] ?? '#9a8a74';
            }}
            maskColor={theme === 'night' ? 'rgba(5, 8, 16, 0.6)' : 'rgba(120, 90, 50, 0.18)'}
            style={{ width: 168, height: 112 }}
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </TreeEventsProvider>
  );
};

export default TreeCanvas;
