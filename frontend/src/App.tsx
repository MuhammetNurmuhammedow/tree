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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
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

  return (
    <div className={`canvas-theme-${theme}`} style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--canvas-bg)', color: 'var(--header-text)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      {/* ── Top Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header" style={{
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 50,
        gap: 16,
      }}>
        {/* Brand & Tree Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="app-brand-box">
            <TreeIcon size={18} />
          </div>

          {/* Tree Dropdown Selector */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={currentTreeId}
                onChange={(e) => setCurrentTreeId(e.target.value)}
                className="app-tree-select"
                style={{
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  maxWidth: 240,
                }}
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

        {/* Unified Sleek Search Bar */}
        <div ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: 460 }}>
          <div className="app-search-container" style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 7,
            padding: '3px 8px 3px 4px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
            transition: 'border-color 0.15s',
          }}>
            {/* Integrated Scope Switcher */}
            <div className="app-scope-switcher" style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 5,
              padding: '2px',
              marginRight: 8,
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => setSearchScope('current')}
                title={tl('search.scopeCurrent')}
                className={`app-scope-btn ${searchScope === 'current' ? 'active' : ''}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: searchScope === 'current' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                🌳 {tl('search.scopeCurrent')}
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('all')}
                title={tl('search.scopeAll')}
                className={`app-scope-btn ${searchScope === 'all' ? 'active' : ''}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: searchScope === 'all' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                🌐 {tl('search.scopeAll')}
              </button>
            </div>

            {/* Search Icon */}
            <span style={{ color: '#8a867c', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
              <SearchIcon size={14} />
            </span>

            {/* Input Field */}
            <input
              type="text"
              placeholder={searchScope === 'current' ? tl('search.placeholderCurrent') : tl('search.placeholderAll')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              className="app-search-input"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                outline: 'none',
                padding: '4px 0',
                minWidth: 100,
              }}
            />

            {/* Clear or loading indicator */}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ea0a8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                  marginLeft: 4,
                }}
              >
                <CloseIcon size={12} />
              </button>
            )}
            {isSearching && (
              <span style={{ fontSize: 11, color: '#d4af37', marginLeft: 4, flexShrink: 0 }}>…</span>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="app-search-dropdown">
              <div className="app-search-dropdown-header">
                <span>{tl('search.foundCount')}</span>
                <span>{searchResults.length}</span>
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.person_id}
                  className="app-search-item"
                >
                  <div
                    onClick={() => handleSelectSearchResult(item, false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}
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
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--header-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: item.is_my_tree ? 'rgba(82, 140, 110, 0.16)' : 'rgba(82, 117, 156, 0.16)',
                      color: item.is_my_tree ? '#8db597' : '#9cb8d9',
                      border: item.is_my_tree ? '1px solid rgba(82, 140, 110, 0.30)' : '1px solid rgba(82, 117, 156, 0.30)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}>
                      {item.tree_name}
                    </span>

                    <button
                      type="button"
                      title={tl('search.focusOnTree')}
                      onClick={() => handleSelectSearchResult(item, false)}
                      className="app-secondary-btn"
                      style={{
                        padding: '3px 7px',
                        fontSize: 10.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📍 {tl('search.focusOnTree')}
                    </button>

                    <button
                      type="button"
                      title={tl('search.openProfile')}
                      onClick={() => handleSelectSearchResult(item, true)}
                      className="app-secondary-btn"
                      style={{
                        padding: '3px 7px',
                        fontSize: 10.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <UserIcon size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick return to my tree */}
          {isReadOnly && (
            <button
              type="button"
              onClick={() => setCurrentTreeId('my-tree')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid #455268',
                background: '#1d2736',
                color: '#adc4de',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ArrowLeftIcon size={13} />
              <span>{tl('tree.backToMyTree')}</span>
            </button>
          )}

          {/* Seed Button */}
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seeding}
            title="Örnek aile ağaçlarını sıfırlayıp yeniden yükler"
            className="app-secondary-btn"
            style={{
              padding: '6px 11px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.12s ease',
            }}
          >
            <RefreshIcon size={13} className={seeding ? 'animate-spin' : ''} />
            <span>{seeding ? tl('tree.loading') : tl('toolbar.sampleData')}</span>
          </button>

          {/* Add Person Button */}
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

          {/* Language Switcher */}
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* ── Read-only Alert Bar if viewing someone else's tree ─────────────── */}
      {isReadOnly && (
        <div className="app-readonly-bar">
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
