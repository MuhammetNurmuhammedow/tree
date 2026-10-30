import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/globals.css';
import TreeCanvas from '@/features/tree/TreeCanvas';
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
} from '@/components/common/Icons';

const App: React.FC = () => {
  const { t: tl } = useTranslation();
  // Trees state
  const [trees, setTrees] = useState<TreeInfo[]>([]);
  const [currentTreeId, setCurrentTreeId] = useState<string>('my-tree');
  const [isCreateTreeOpen, setIsCreateTreeOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
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

  // Search debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await treeService.searchAll(searchQuery);
        if (Array.isArray(results)) {
          setSearchResults(results);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Arama hatası:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleSelectSearchResult = (item: SearchResultItem) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (item.tree_id !== currentTreeId) {
      setCurrentTreeId(item.tree_id);
    }
    setProfilePersonId(item.person_id);
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* ── Top Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: '#0d131f',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
        zIndex: 50,
        gap: 16,
      }}>
        {/* Brand & Tree Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="flex items-center justify-center w-8 h-8 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
            <TreeIcon size={20} />
          </div>

          {/* Tree Dropdown Selector */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={currentTreeId}
                onChange={(e) => setCurrentTreeId(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#f8fafc',
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
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                <PlusIcon size={12} />
                <span>{tl('tree.newTree')}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {isReadOnly ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                  <ShieldIcon size={10} />
                  <span>{tl('tree.readOnly')}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <EditIcon size={10} />
                  <span>{tl('tree.editable')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 11, color: '#64748b', pointerEvents: 'none' }}>
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder={tl('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              style={{
                width: '100%',
                padding: '6px 14px 6px 32px',
                borderRadius: 6,
                border: '1px solid #334155',
                background: '#111827',
                color: '#f8fafc',
                fontSize: 12,
                outline: 'none',
              }}
            />
            {isSearching && (
              <span style={{ position: 'absolute', right: 12, fontSize: 11, color: '#94a3b8' }}>…</span>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 38,
              left: 0,
              right: 0,
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
              maxHeight: 320,
              overflowY: 'auto',
              zIndex: 100,
              padding: 4,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {tl('search.foundCount')} ({searchResults.length})
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.person_id}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 4,
                      background: item.gender === 'female' ? '#831843' : '#1e3a8a',
                      color: item.gender === 'female' ? '#fbcfe8' : '#93c5fd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {item.full_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f8fafc' }}>{item.full_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {item.years} {item.birth_place ? `• ${item.birth_place}` : ''}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                    background: item.is_my_tree ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: item.is_my_tree ? '#34d399' : '#60a5fa',
                    border: item.is_my_tree ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: 600,
                  }}>
                    {item.tree_name}
                  </span>
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
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                fontSize: 12,
                fontWeight: 600,
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
            style={{
              padding: '6px 11px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
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
              style={{
                padding: '7px 15px',
                borderRadius: 6,
                border: '1px solid #2563eb',
                background: '#2563eb',
                color: 'white',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <PlusIcon size={14} />
              <span>{tl('toolbar.addPerson')}</span>
            </button>
          ) : (
            <div style={{
              padding: '5px 10px',
              borderRadius: 6,
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#facc15',
              fontSize: 11.5,
              fontWeight: 600,
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
        <div style={{
          background: '#0d1e38',
          borderBottom: '1px solid #1e3a8a',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#93c5fd',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <EyeIcon size={14} className="text-blue-400" />
            <span>
              Şu anda <strong>"{currentTree.name}"</strong> {tl('tree.readOnly')}.
              ({tl('tree.owner')}: {currentTree.owner_name})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTreeId('my-tree')}
            style={{
              background: '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
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
          onAddParent={handleAddParent}
          onAddSpouse={handleAddSpouse}
          onAddChild={handleAddChild}
          onViewProfile={handleViewProfile}
          reloadTrigger={reloadTrigger}
          isReadOnly={isReadOnly}
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
