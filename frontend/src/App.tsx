import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/globals.css';
import TreeCanvas from '@/features/tree/TreeCanvas';
import type { CanvasTheme } from '@/features/tree/TreeCanvas';
import { PersonModal } from '@/components/forms/PersonModal';
import { RelationshipModal } from '@/components/forms/RelationshipModal';
import { PersonDetailModal } from '@/features/person/PersonDetailModal';
import { CreateTreeModal } from '@/components/forms/CreateTreeModal';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { treeService } from '@/services/treeService';
import type { TreeInfo, SearchResultItem } from '@/types/tree';
import api from '@/services/api';
import {
  TreeIcon,
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

const App: React.FC = () => {
  const { t: tl } = useTranslation();

  // Theme state – synced with TreeCanvas localStorage key
  const [theme, setTheme] = useState<CanvasTheme>(() => {
    const raw = localStorage.getItem('familytree_canvas_theme');
    if (raw === 'blueprint') return 'white';
    const valid: CanvasTheme[] = ['slate', 'white', 'parchment', 'obsidian'];
    return valid.includes(raw as CanvasTheme) ? (raw as CanvasTheme) : 'slate';
  });

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
      console.error('Ağaç listesi alınamadı:', err);
    }
  }, []);

  useEffect(() => {
    loadTrees();
  }, [loadTrees, reloadTrigger]);

  // Current tree info
  const currentTree = (Array.isArray(trees) ? trees.find((t) => t.id === currentTreeId) : undefined) || {
    id: currentTreeId,
    name: 'Kaya Ailesi Soy Ağacı',
    is_owner: true,
    owner_name: 'Ben',
    member_count: 9,
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
        console.error('Arama hatası:', err);
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
    try {
      setSeeding(true);
      await api.post('/seed');
      handleTreeUpdated();
    } catch (err) {
      alert('Demo aileler yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : String(err)));
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
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: item.gender === 'female' ? '#2b191e' : '#192433',
                color: item.gender === 'female' ? '#deb1b8' : '#a8c2de',
                border: item.gender === 'female' ? '1px solid #4f2b33' : '1px solid #2b3b4f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>
                {item.full_name.charAt(0)}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--header-text)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  <span>{item.full_name}</span>
                  {item.match_context && (
                    <span style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(197, 155, 39, 0.15)',
                      color: '#d4af37',
                      border: '1px solid rgba(197, 155, 39, 0.3)',
                      fontWeight: 500,
                    }}>
                      {item.match_context}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--header-subtext)' }}>
                  {item.years} {item.birth_place ? `• ${item.birth_place}` : ''}
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
                <div className="app-brand-box">
                  <TreeIcon size={18} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <select
                      value={currentTreeId}
                      onChange={(e) => setCurrentTreeId(e.target.value)}
                      className="app-tree-select"
                    >
                      {trees.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.member_count} {tl('tree.members')})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCreateTreeOpen(true)}
                      title="Kendi yeni soy ağacınızı oluşturun"
                      className="app-newtree-btn"
                    >
                      <PlusIcon size={12} />
                      <span>{tl('tree.newTree')}</span>
                    </button>
                  </div>

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

                  <span style={{ color: '#8a867c', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
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
                      style={{ background: 'transparent', border: 'none', color: '#9ea0a8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, marginLeft: 4 }}
                    >
                      <CloseIcon size={12} />
                    </button>
                  )}
                  {isSearching && (
                    <span style={{ fontSize: 11, color: '#d4af37', marginLeft: 4, flexShrink: 0 }}>…</span>
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

                <button
                  type="button"
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  title="Örnek aile ağaçlarını sıfırlayıp yeniden yükler"
                  className="app-secondary-btn"
                >
                  <RefreshIcon size={13} className={seeding ? 'animate-spin' : ''} />
                  <span>{seeding ? tl('tree.loading') : tl('toolbar.sampleData')}</span>
                </button>

                {!isReadOnly ? (
                  <button
                    type="button"
                    onClick={() => setIsAddPersonOpen(true)}
                    className="app-primary-btn"
                  >
                    <PlusIcon size={14} />
                    <span>{tl('toolbar.addPerson')}</span>
                  </button>
                ) : (
                  <div style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: 'var(--header-newtree-bg)',
                    border: '1px solid var(--header-newtree-border)',
                    color: 'var(--header-newtree-text)',
                    fontSize: 11.5,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    <ShieldIcon size={13} />
                    <span>{tl('tree.readOnly')}</span>
                  </div>
                )}

                <LanguageSwitcher compact />
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
                <TreeIcon size={18} />
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
                      {t.name} ({t.member_count} {tl('tree.members')})
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
                  >
                    <PlusIcon size={13} />
                    <span>{tl('toolbar.addPerson')}</span>
                  </button>
                )}

                <LanguageSwitcher compact />

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="app-secondary-btn"
                  style={{ padding: '5px 8px' }}
                  title="Menýu"
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
                  <span style={{ color: '#8a867c', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
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
                      style={{ background: 'transparent', border: 'none', color: '#9ea0a8', cursor: 'pointer', padding: 2 }}
                    >
                      <CloseIcon size={12} />
                    </button>
                  )}
                  {isSearching && (
                    <span style={{ fontSize: 11, color: '#d4af37', marginLeft: 4 }}>…</span>
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
              <EyeIcon size={14} className="text-[#a8c2de]" />
              <span>
                Şu anda <strong>"{currentTree.name}"</strong> {tl('tree.readOnly')}.
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
          onAddParent={handleAddParent}
          onAddSpouse={handleAddSpouse}
          onAddChild={handleAddChild}
          onViewProfile={handleViewProfile}
          reloadTrigger={reloadTrigger}
          isReadOnly={isReadOnly}
          theme={theme}
          onThemeChange={setTheme}
        />
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

      {profilePersonId && (
        <PersonDetailModal
          personId={profilePersonId}
          treeId={currentTreeId}
          isReadOnly={isReadOnly}
          onClose={() => setProfilePersonId(null)}
          onUpdated={handleTreeUpdated}
          onAddRelative={(type) => {
            const pid = profilePersonId;
            setProfilePersonId(null);
            setRelModalState({ isOpen: true, sourcePersonId: pid, defaultType: type });
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
    </div>
  );
};

export default App;
