import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/globals.css';
import TreeCanvas from '@/features/tree/TreeCanvas';
import '@/styles/theme-turkmen.css';
import { normalizeTheme, type CanvasTheme } from '@/features/tree/TreeCanvas';
import { PersonModal } from '@/components/forms/PersonModal';
import { RelationshipModal } from '@/components/forms/RelationshipModal';
import { PersonDetailModal, type PersonFamily } from '@/features/person/PersonDetailModal';
import type { Node as FlowNode, Edge } from '@xyflow/react';
import type { FamilyEdgeData, TreeNodeData } from '@/types/tree';
import { CreateTreeModal } from '@/components/forms/CreateTreeModal';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { treeService } from '@/services/treeService';
import type { TreeInfo, SearchResultItem } from '@/types/tree';
import api from '@/services/api';
import toast, { Toaster } from 'react-hot-toast';
import { formatLifespan } from '@/i18n/format';
import {
  GulIcon,
  MoreIcon,
  SearchIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  EditIcon,
  ArrowLeftIcon,
  EyeIcon,
  CloseIcon,
  UserIcon,
  MenuIcon,
} from '@/components/common/Icons';

const MATCH_FIELD_LABEL: Record<NonNullable<SearchResultItem['match_field']>, string> = {
  maiden_name: 'search.matchMaiden',
  birth_place: 'search.matchBirthPlace',
  death_place: 'search.matchDeathPlace',
  biography: 'search.matchBiography',
};

/** Derives a person's parents, spouses, siblings and children from the laid-out graph. */
function familyOf(personId: string, nodes: FlowNode<TreeNodeData>[], edges: Edge[]): PersonFamily {
  const byId = new Map(nodes.map((n) => [n.id, n.data.person]));
  const pick = (ids: Iterable<string>) =>
    [...new Set(ids)]
      .filter((id) => id !== personId && byId.has(id))
      .map((id) => byId.get(id)!)
      .sort((a, b) => (a.birth_date ?? '9999').localeCompare(b.birth_date ?? '9999'));

  // A child of a couple has one blood edge from one parent plus `partnerId` for the other.
  const parentsOf = (id: string) =>
    edges
      .filter((e) => e.type === 'bloodEdge' && e.target === id)
      .flatMap((e) => [e.source, (e.data as FamilyEdgeData | undefined)?.partnerId].filter(Boolean) as string[]);
  const childrenOf = (id: string) =>
    edges
      .filter((e) => e.type === 'bloodEdge' && (e.source === id || (e.data as FamilyEdgeData | undefined)?.partnerId === id))
      .map((e) => e.target);

  const parents = parentsOf(personId);
  return {
    parents: pick(parents),
    spouses: pick(
      edges
        .filter((e) => e.type === 'spouseEdge' && (e.source === personId || e.target === personId))
        .map((e) => (e.source === personId ? e.target : e.source))
    ),
    siblings: pick(parents.flatMap(childrenOf)),
    children: pick(childrenOf(personId)),
  };
}

const App: React.FC = () => {
  const { t: tl } = useTranslation();

  // Theme state – synced with TreeCanvas localStorage key
  const [theme, setTheme] = useState<CanvasTheme>(() => normalizeTheme(localStorage.getItem('familytree_canvas_theme')));
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Trees state
  const [trees, setTrees] = useState<TreeInfo[]>([]);
  const [currentTreeId, setCurrentTreeId] = useState<string>('my-tree');
  const [isCreateTreeOpen, setIsCreateTreeOpen] = useState(false);

  // Search state & scope
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightPersonId, setHighlightPersonId] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal states
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [relModalState, setRelModalState] = useState<{
    isOpen: boolean;
    sourcePersonId?: string;
    defaultType?: 'parent' | 'child' | 'spouse';
  }>({ isOpen: false });

  const [profilePersonId, setProfilePersonId] = useState<string | null>(null);
  const [graph, setGraph] = useState<{ nodes: FlowNode<TreeNodeData>[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const handleGraphChange = useCallback((nodes: FlowNode<TreeNodeData>[], edges: Edge[]) => setGraph({ nodes, edges }), []);
  const profileFamily = React.useMemo(
    () => (profilePersonId ? familyOf(profilePersonId, graph.nodes, graph.edges) : undefined),
    [profilePersonId, graph]
  );
  const [reloadTrigger, setReloadTrigger] = useState(1);
  const [seeding, setSeeding] = useState(false);

  // Fetch available trees
  const loadTrees = useCallback(async () => {
    try {
      const data = await treeService.getAllTrees();
      if (Array.isArray(data)) {
        setTrees(data);
      }
    } catch (err) {
      console.error('Failed to load tree list:', err);
    }
  }, []);

  useEffect(() => {
    loadTrees();
  }, [loadTrees, reloadTrigger]);

  // Current tree info
  const currentTree = (Array.isArray(trees) ? trees.find((t) => t.id === currentTreeId) : undefined) || {
    id: currentTreeId,
    name: '',
    is_owner: true,
    owner_name: '',
    member_count: 0,
    created_at: '',
  };

  const isReadOnly = !currentTree.is_owner;

  // Search debouncing with tree scope
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const filterTreeId = searchScope === 'current' ? currentTreeId : undefined;
        const results = await treeService.searchAll(searchQuery, filterTreeId);
        if (Array.isArray(results)) {
          setSearchResults(results);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, searchScope, currentTreeId]);

  // Click outside search container to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const inDesktop = searchContainerRef.current?.contains(e.target as Node);
      const inMobile = mobileSearchRef.current?.contains(e.target as Node);
      if (!inDesktop && !inMobile) {
        setShowSearchDropdown(false);
      }
      if (!moreMenuRef.current?.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (item: SearchResultItem, openProfileModal = false) => {
    setShowSearchDropdown(false);
    if (item.tree_id !== currentTreeId) {
      setCurrentTreeId(item.tree_id);
    }
    setHighlightPersonId(item.person_id);
    if (openProfileModal) {
      setProfilePersonId(item.person_id);
    }
    // Auto-clear highlight after 6 seconds
    setTimeout(() => {
      setHighlightPersonId((prev) => (prev === item.person_id ? null : prev));
    }, 6000);
  };

  const handleTreeUpdated = () => {
    setReloadTrigger((v) => v + 1);
  };

  const handleTreeCreated = (newTree: TreeInfo) => {
    setTrees((prev) => [...prev, newTree]);
    setCurrentTreeId(newTree.id);
    handleTreeUpdated();
  };

  // Handlers for Canvas hover menu actions
  const handleAddParent = useCallback((id: string) => {
    setRelModalState({ isOpen: true, sourcePersonId: id, defaultType: 'parent' });
  }, []);

  const handleAddSpouse = useCallback((id: string) => {
    setRelModalState({ isOpen: true, sourcePersonId: id, defaultType: 'spouse' });
  }, []);

  const handleAddChild = useCallback((id: string) => {
    setRelModalState({ isOpen: true, sourcePersonId: id, defaultType: 'child' });
  }, []);

  const handleViewProfile = useCallback((id: string) => {
    setProfilePersonId(id);
  }, []);

  const handleSeedDemo = async () => {
    // Re-seeding wipes every person and relationship, so always ask first.
    if (!window.confirm(tl('tree.sampleDataConfirm'))) return;
    try {
      setSeeding(true);
      await api.post('/seed');
      handleTreeUpdated();
    } catch (err) {
      console.error('Seeding failed:', err);
      toast.error(tl('tree.sampleDataError'));
    } finally {
      setSeeding(false);
    }
  };

  const renderSearchDropdown = () => {
    if (!showSearchDropdown || searchResults.length === 0) return null;
    return (
      <div className="app-search-dropdown">
        <div className="app-search-dropdown-header">
          <span>{tl('search.foundCount')}</span>
          <span>{searchResults.length}</span>
        </div>
        {searchResults.map((item) => (
          <div key={item.person_id} className="app-search-item">
            <div
              onClick={() => handleSelectSearchResult(item, false)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}
            >
              <div className={`family-chip__avatar avatar-${item.gender}`} style={{ width: 28, height: 28 }} aria-hidden="true">
                {item.full_name.charAt(0)}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--header-text)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  <span>{item.full_name}</span>
                  {item.match_field && item.match_context && (
                    <span style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'color-mix(in srgb, var(--card-accent) 10%, transparent)',
                      color: 'var(--card-accent)',
                      border: '1px solid color-mix(in srgb, var(--card-accent) 30%, transparent)',
                      fontWeight: 500,
                    }}>
                      {tl(MATCH_FIELD_LABEL[item.match_field])}: {item.match_context}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--header-subtext)' }}>
                  {formatLifespan(tl, item.birth_year, item.death_year, item.is_living)}
                  {item.birth_place ? ` • ${item.birth_place}` : ''}
                  {searchScope === 'all' ? ` • ${item.tree_name}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, flexShrink: 0 }}>
              <button
                type="button"
                title={tl('search.focusOnTree')}
                onClick={() => handleSelectSearchResult(item, false)}
                className="app-secondary-btn"
                style={{ padding: '3px 7px', fontSize: 10.5, whiteSpace: 'nowrap' }}
              >
                {tl('search.focusOnTree')}
              </button>

              <button
                type="button"
                title={tl('search.openProfile')}
                onClick={() => handleSelectSearchResult(item, true)}
                className="app-secondary-btn"
                style={{ padding: '3px 7px', fontSize: 10.5, whiteSpace: 'nowrap' }}
              >
                <UserIcon size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`canvas-theme-${theme}`} style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--canvas-bg)', color: 'var(--header-text)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      {/* ── Top Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        {/* DESKTOP HEADER MODE (Large Screens) */}
        <div className="desktop-header-mode">
          <div className="ui-container">
            <div className="ui-row" style={{ alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
              {/* Col Left: Brand & Tree Selector */}
              <div className="ui-col-auto app-header-left">
                <div className="app-brand-box" title={tl('app.title')}>
                  <GulIcon size={22} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <select
                    value={currentTreeId}
                    onChange={(e) => setCurrentTreeId(e.target.value)}
                    className="app-tree-select"
                    aria-label={tl('tree.select')}
                  >
                    {trees.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {isReadOnly ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--header-newtree-text, #d4a359)', fontWeight: 500 }}>
                        <ShieldIcon size={10} />
                        <span>{tl('tree.readOnly')}</span>
                      </span>
                    ) : (
                      <span className="app-editable-badge">
                        <EditIcon size={10} />
                        <span>{tl('tree.editable')}</span>
                      </span>
                    )}
                    {trees.length > 0 && (
                      <span className="app-member-count">· {tl('tree.memberCount', { count: currentTree.member_count })}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Col Center: Search Bar with Scope */}
              <div className="ui-col-fill app-header-center" ref={searchContainerRef}>
                <div className="app-search-container">
                  <div className="app-scope-switcher">
                    <button
                      type="button"
                      onClick={() => setSearchScope('current')}
                      title={tl('search.scopeCurrent')}
                      className={`app-scope-btn ${searchScope === 'current' ? 'active' : ''}`}
                    >
                      {tl('search.scopeCurrent')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchScope('all')}
                      title={tl('search.scopeAll')}
                      className={`app-scope-btn ${searchScope === 'all' ? 'active' : ''}`}
                    >
                      {tl('search.scopeAll')}
                    </button>
                  </div>

                  <span style={{ color: 'var(--header-subtext)', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
                    <SearchIcon size={14} />
                  </span>

                  <input
                    type="text"
                    placeholder={searchScope === 'current' ? tl('search.placeholderCurrent') : tl('search.placeholderAll')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                    className="app-search-input"
                  />

                  {searchQuery && !isSearching && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchDropdown(false);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--header-subtext)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, marginLeft: 4 }}
                    >
                      <CloseIcon size={12} />
                    </button>
                  )}
                  {isSearching && (
                    <span style={{ fontSize: 11, color: 'var(--card-accent)', marginLeft: 4, flexShrink: 0 }}>…</span>
                  )}
                </div>

                {renderSearchDropdown()}
              </div>

              {/* Col Right: Action Buttons */}
              <div className="ui-col-auto app-header-right">
                {isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setCurrentTreeId('my-tree')}
                    className="app-secondary-btn"
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    <ArrowLeftIcon size={13} />
                    <span>{tl('tree.backToMyTree')}</span>
                  </button>
                )}

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsAddPersonOpen(true)}
                    className="app-primary-btn"
                  >
                    <PlusIcon size={14} />
                    <span>{tl('toolbar.addPerson')}</span>
                  </button>
                )}

                <LanguageSwitcher compact />

                <div ref={moreMenuRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen((v) => !v)}
                    className="app-icon-btn"
                    title={tl('tree.menu')}
                    aria-label={tl('tree.menu')}
                    aria-haspopup="menu"
                    aria-expanded={isMoreMenuOpen}
                  >
                    <MoreIcon size={16} />
                  </button>
                  {isMoreMenuOpen && (
                    <div className="app-more-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setIsCreateTreeOpen(true); setIsMoreMenuOpen(false); }}
                      >
                        <PlusIcon size={14} />
                        <span>{tl('tree.newTree')}</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={seeding}
                        title={tl('tree.sampleDataHint')}
                        onClick={() => { setIsMoreMenuOpen(false); handleSeedDemo(); }}
                      >
                        <RefreshIcon size={14} className={seeding ? 'animate-spin' : ''} />
                        <span>{seeding ? tl('tree.loading') : tl('toolbar.sampleData')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE HEADER MODE (Phones & Small Tablets) */}
        <div className="mobile-header-mode">
          <div className="ui-container">
            {/* Mobile Row 1: Brand + Tree Select + Actions */}
            <div className="ui-row" style={{ alignItems: 'center', padding: '8px 0', gap: 6 }}>
              <div className="app-brand-box" style={{ flexShrink: 0 }}>
                <GulIcon size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <select
                  value={currentTreeId}
                  onChange={(e) => setCurrentTreeId(e.target.value)}
                  className="app-tree-select"
                  style={{ width: '100%', maxWidth: '100%', fontSize: 12, padding: '4px 6px' }}
                >
                  {trees.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {tl('tree.memberCount', { count: t.member_count })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsAddPersonOpen(true)}
                    className="app-primary-btn"
                    style={{ padding: '5px 9px', fontSize: 11.5 }}
                    title={tl('toolbar.addPerson')}
                    aria-label={tl('toolbar.addPerson')}
                  >
                    <PlusIcon size={13} />
                  </button>
                )}

                <LanguageSwitcher compact />

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="app-secondary-btn"
                  style={{ padding: '5px 8px' }}
                  title={tl('tree.menu')}
                  aria-label={tl('tree.menu')}
                >
                  <MenuIcon size={15} />
                </button>
              </div>
            </div>

            {/* Mobile Row 2: Search Bar with Dual-Tab Scope */}
            <div className="ui-row" style={{ paddingBottom: 8 }}>
              <div className="ui-col-12" ref={mobileSearchRef} style={{ position: 'relative' }}>
                <div className="mobile-scope-toggle">
                  <button
                    type="button"
                    onClick={() => setSearchScope('current')}
                    className={searchScope === 'current' ? 'active' : ''}
                  >
                    {tl('search.scopeCurrent')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchScope('all')}
                    className={searchScope === 'all' ? 'active' : ''}
                  >
                    {tl('search.scopeAll')}
                  </button>
                </div>

                <div className="app-search-container" style={{ width: '100%' }}>
                  <span style={{ color: 'var(--header-subtext)', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
                    <SearchIcon size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder={searchScope === 'current' ? tl('search.placeholderCurrent') : tl('search.placeholderAll')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                    className="app-search-input"
                  />
                  {searchQuery && !isSearching && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchDropdown(false);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--header-subtext)', cursor: 'pointer', padding: 2 }}
                    >
                      <CloseIcon size={12} />
                    </button>
                  )}
                  {isSearching && (
                    <span style={{ fontSize: 11, color: 'var(--card-accent)', marginLeft: 4 }}>…</span>
                  )}
                </div>

                {renderSearchDropdown()}
              </div>
            </div>

            {/* Mobile Row 3: Collapsible Menu Drawer */}
            {isMobileMenuOpen && (
              <div className="mobile-drawer-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setIsCreateTreeOpen(true); setIsMobileMenuOpen(false); }}
                    className="app-newtree-btn"
                    style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
                  >
                    <PlusIcon size={13} />
                    <span>{tl('tree.newTree')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleSeedDemo(); setIsMobileMenuOpen(false); }}
                    disabled={seeding}
                    className="app-secondary-btn"
                    style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
                  >
                    <RefreshIcon size={13} className={seeding ? 'animate-spin' : ''} />
                    <span>{seeding ? tl('tree.loading') : tl('toolbar.sampleData')}</span>
                  </button>
                </div>

                {isReadOnly && (
                  <button
                    type="button"
                    onClick={() => { setCurrentTreeId('my-tree'); setIsMobileMenuOpen(false); }}
                    className="app-secondary-btn"
                    style={{ justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
                  >
                    <ArrowLeftIcon size={13} />
                    <span>{tl('tree.backToMyTree')}</span>
                  </button>
                )}

                <div style={{ fontSize: 11, textAlign: 'center', opacity: 0.8, paddingTop: 2 }}>
                  {isReadOnly ? (
                    <span style={{ color: 'var(--header-newtree-text, #d4a359)' }}>{tl('tree.readOnly')} ({currentTree.owner_name})</span>
                  ) : (
                    <span className="app-editable-badge" style={{ justifyContent: 'center' }}>
                      <EditIcon size={11} /> {tl('tree.editable')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Read-only Alert Bar if viewing someone else's tree ─────────────── */}
      {isReadOnly && (
        <div className="app-readonly-bar">
          <div className="ui-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <EyeIcon size={14} style={{ color: 'var(--card-accent)' }} />
              <span>
                {tl('tree.readOnlyBanner', { name: currentTree.name })}{' '}
                ({tl('tree.owner')}: {currentTree.owner_name})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTreeId('my-tree')}
              className="app-secondary-btn"
              style={{
                padding: '3px 10px',
                fontSize: 11,
              }}
            >
              {tl('tree.backToMyTree')}
            </button>
          </div>
        </div>
      )}

      {/* ── Main Canvas View ───────────────────────────────────────────────────── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TreeCanvas
          treeId={currentTreeId}
          treeName={currentTree.name}
          highlightPersonId={highlightPersonId}
          selectedPersonId={profilePersonId}
          onGraphChange={handleGraphChange}
          onAddParent={handleAddParent}
          onAddSpouse={handleAddSpouse}
          onAddChild={handleAddChild}
          onViewProfile={handleViewProfile}
          reloadTrigger={reloadTrigger}
          isReadOnly={isReadOnly}
          theme={theme}
          onThemeChange={setTheme}
        />

        {profilePersonId && (
          <PersonDetailModal
            personId={profilePersonId}
            treeId={currentTreeId}
            isReadOnly={isReadOnly}
            family={profileFamily}
            onSelectPerson={setProfilePersonId}
            onClose={() => setProfilePersonId(null)}
            onUpdated={handleTreeUpdated}
            onAddRelative={(type) => {
              const pid = profilePersonId;
              setProfilePersonId(null);
              setRelModalState({ isOpen: true, sourcePersonId: pid, defaultType: type });
            }}
          />
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {isAddPersonOpen && (
        <PersonModal
          isOpen={isAddPersonOpen}
          treeId={currentTreeId}
          onClose={() => setIsAddPersonOpen(false)}
          onSuccess={() => {
            setIsAddPersonOpen(false);
            handleTreeUpdated();
          }}
        />
      )}

      {relModalState.isOpen && relModalState.sourcePersonId && (
        <RelationshipModal
          isOpen={relModalState.isOpen}
          treeId={currentTreeId}
          sourcePersonId={relModalState.sourcePersonId}
          defaultType={relModalState.defaultType}
          onClose={() => setRelModalState({ isOpen: false })}
          onSuccess={() => {
            setRelModalState({ isOpen: false });
            handleTreeUpdated();
          }}
        />
      )}

      {isCreateTreeOpen && (
        <CreateTreeModal
          isOpen={isCreateTreeOpen}
          onClose={() => setIsCreateTreeOpen(false)}
          onSuccess={handleTreeCreated}
        />
      )}

      {/* Rendered inside the themed root so toasts pick up the theme's colors */}
      <Toaster position="bottom-center" toastOptions={{ className: 'app-toast', duration: 3500 }} />
    </div>
  );
};

export default App;
