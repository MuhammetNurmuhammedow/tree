import React, { useState, useEffect, useCallback, useRef } from 'react';
import '@/styles/globals.css';
import TreeCanvas from '@/features/tree/TreeCanvas';
import { PersonModal } from '@/components/forms/PersonModal';
import { RelationshipModal } from '@/components/forms/RelationshipModal';
import { PersonDetailModal } from '@/features/person/PersonDetailModal';
import { CreateTreeModal } from '@/components/forms/CreateTreeModal';
import { treeService } from '@/services/treeService';
import type { TreeInfo, SearchResultItem } from '@/types/tree';
import api from '@/services/api';

const App: React.FC = () => {
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

  // Click outside to close search dropdown
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
    setCurrentTreeId(item.tree_id);
    setShowSearchDropdown(false);
    setSearchQuery('');
    // Optionally open that person's profile
    setProfilePersonId(item.person_id);
  };

  const handleTreeUpdated = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

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
        padding: '0 24px',
        background: 'linear-gradient(180deg, #121622 0%, #0d101a 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        flexShrink: 0,
        zIndex: 50,
        gap: 16,
      }}>
        {/* Brand & Tree Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 26, filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))' }}>🌳</span>

          {/* Tree Dropdown Selector */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={currentTreeId}
                onChange={(e) => setCurrentTreeId(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  color: '#f8fafc',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  maxWidth: 240,
                }}
              >
                {trees.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.is_owner ? '👑 ' : '👥 '} {t.name} ({t.member_count} üye)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsCreateTreeOpen(true)}
                title="Kendi yeni soy ağacınızı oluşturun"
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.12)',
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
                <span>+</span> Yeni Ağaç
              </button>
            </div>

            <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
              {isReadOnly ? '🔒 Başkasına Ait Ağaç (Salt Okunur)' : '✏️ Kendi Soy Ağacınız (Düzenlenebilir)'}
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: '#94a3b8', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Tüm ağaçlarda akraba veya kişi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              style={{
                width: '100%',
                padding: '7px 14px 7px 34px',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(255, 255, 255, 0.05)',
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
              top: 42,
              left: 0,
              right: 0,
              background: '#121622',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 14,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
              maxHeight: 320,
              overflowY: 'auto',
              zIndex: 100,
              padding: 6,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Bulunan Kişiler ({searchResults.length})
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.person_id}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: item.gender === 'female' ? '#ec4899' : '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white',
                    }}>
                      {item.full_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{item.full_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {item.years} {item.birth_place ? `• ${item.birth_place}` : ''}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: item.is_my_tree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: item.is_my_tree ? '#34d399' : '#60a5fa',
                    border: item.is_my_tree ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: 600,
                  }}>
                    {item.tree_name} {item.is_my_tree ? '(Benim)' : '(İncele)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* If viewing other tree, quick button to return to my tree */}
          {isReadOnly && (
            <button
              type="button"
              onClick={() => setCurrentTreeId('my-tree')}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🏠</span> Kendi Ağacıma Dön
            </button>
          )}

          {/* Seed Button */}
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seeding}
            title="Örnek aile ağaçlarını sıfırlayıp yeniden yükler"
            style={{
              padding: '7px 13px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🌱</span>
            <span>{seeding ? 'Yükleniyor…' : 'Örnek Verileri Yükle'}</span>
          </button>

          {/* Reload Tree Button */}
          <button
            type="button"
            onClick={handleTreeUpdated}
            title="Ağacı Yenile ve Otomatik Hizala"
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            🔄
          </button>

          {/* Add Person Button (Only active when in own tree) */}
          {!isReadOnly ? (
            <button
              type="button"
              onClick={() => setIsAddPersonOpen(true)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              <span>Yeni Kişi Ekle</span>
            </button>
          ) : (
            <div style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#facc15',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span>🔒</span> Salt Okunur
            </div>
          )}
        </div>
      </header>

      {/* ── Read-only Alert Bar if viewing someone else's tree ─────────────── */}
      {isReadOnly && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.5) 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#93c5fd',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>👁️</span>
            <span>
              <strong>{currentTree.name}</strong> ağacını görüntülüyorsunuz. Bu ağaç <strong>{currentTree.owner_name}</strong> tarafından oluşturulmuştur. Sadece inceleme yetkiniz bulunmaktadır.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTreeId('my-tree')}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Kendi Ağacıma Dön
          </button>
        </div>
      )}

      {/* ── Main Canvas ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TreeCanvas
          treeId={currentTreeId}
          reloadTrigger={reloadTrigger}
          isReadOnly={isReadOnly}
          onAddParent={handleAddParent}
          onAddSpouse={handleAddSpouse}
          onAddChild={handleAddChild}
          onViewProfile={handleViewProfile}
        />
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <PersonModal
        isOpen={isAddPersonOpen}
        treeId={currentTreeId}
        onClose={() => setIsAddPersonOpen(false)}
        onSuccess={handleTreeUpdated}
      />

      <RelationshipModal
        isOpen={relModalState.isOpen}
        treeId={currentTreeId}
        sourcePersonId={relModalState.sourcePersonId}
        defaultType={relModalState.defaultType}
        onClose={() => setRelModalState({ isOpen: false })}
        onSuccess={handleTreeUpdated}
      />

      <PersonDetailModal
        personId={profilePersonId}
        isReadOnly={isReadOnly}
        onClose={() => setProfilePersonId(null)}
        onDeleted={handleTreeUpdated}
      />

      <CreateTreeModal
        isOpen={isCreateTreeOpen}
        onClose={() => setIsCreateTreeOpen(false)}
        onCreated={(newTreeId) => {
          setCurrentTreeId(newTreeId);
          handleTreeUpdated();
        }}
      />
    </div>
  );
};

export default App;
