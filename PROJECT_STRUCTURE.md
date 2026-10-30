# 🌳 Aile Ağacı Uygulaması (Family Tree App) - Mimari & Proje Yapısı

Bu doküman, projenin güncel mimari yapısını, veritabanı modelini, teknoloji tercihlerini, görselleştirme motorunu ve çoklu ağaç yönetim stratejisini detaylandırmaktadır.

---

## 1. Güncel Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Backend** | **Go (Golang 1.22)** | Fiber v2 web framework, yüksek performanslı, temiz mimari (Clean Architecture: Domain, Repository, Service, Handler). |
| **Veritabanı Sürücüsü** | **jackc/pgx/v5 + pgxpool** | Go için en modern ve yüksek performanslı yerel PostgreSQL sürücüsü; bağlantı havuzlama (connection pooling), parametrik güvenli sorgular. |
| **Veritabanı** | **PostgreSQL (18 / Docker Compose)** | Hiyerarşik recursive CTE sorguları (`WITH RECURSIVE ancestors/descendants`), UUID birincil anahtarlar, çoklu ağaç (`tree_id`) indeksleri. |
| **Frontend** | **React 18 + Vite + TypeScript** | Hızlı SPA mimarisi, ReactFlow (`@xyflow/react`) tuval motoru. |
| **Graf & Düzen Motoru** | **ELK.js (Eclipse Layout Kernel)** | Hiyerarşik nesil hizalama algoritması; kuşaklar arası dikey akış (`layered`), yatay çift/kardeş mesafeleri. |
| **Stil & Tasarım** | **Dark Glassmorphic UI (Tailwind CSS + Custom CSS)** | Koyu tema zorunlu (`color-scheme: dark`), cam efektli kartlar, parıltılı bordürler, özel form alanları. |
| **Konteynerizasyon** | **Docker & Docker Compose** | Çok katmanlı backend, Vite frontend ve PostgreSQL 16 container servisleri. |

---

## 2. Çoklu Ağaç (Multi-Tree) & İzin Mimarisi

Kullanıcıların kendi aile ağaçlarını yönetirken başkalarının ağaçlarını keşfedebilmesi için sistem **Çoklu Ağaç İzolasyonu** ile çalışmaktadır:

1. **Ağaç Sahipliği (`is_owner`):**
   - **Kullanıcının Kendi Ağacı (`is_owner: true`):** Kişi ekleme, düzenleme, silme, ilişki kurma gibi tüm yetkiler açıktır.
   - **Başkalarının Ağacı (`is_owner: false`):** Sadece Okuma (Read-Only) modunda açılır. Kartlardaki düzenleme/ekleme butonları gizlenir, üst panelde "Sadece İnceleme Modu" ve "Kendi Ağacıma Dön" bildirimi gösterilir.
2. **Çapraz Ağaç Arama (Cross-Tree Global Search):**
   - Üst arama çubuğundan ad, soyad veya doğum yeri yazılarak tüm sistemdeki ağaçlar taranabilir.
   - Sonuç listesinde kişinin hangi ağaçta olduğu (`tree_name`) ve kullanıcının kendi ağacı olup olmadığı rozetlerle belirtilir. Tıklandığında doğrudan ilgili ağaca geçilir.
3. **Yeni Ağaç Oluşturma:**
   - Kullanıcı dilediğinde modal üzerinden bağımsız yeni soy ağaçları tanımlayabilir.

---

## 3. Güncel Dizin Yapısı

```text
tree/
├── PROJECT_STRUCTURE.md             # Ana mimari ve başvuru dokümanı (bu dosya)
├── docker-compose.yml               # PostgreSQL, Go API ve React container orkestrasyonu
├── Makefile                         # up, down, migrate, test komutları
├── .env.example / .env              # Ortam yapılandırmaları
│
├── backend/                         # Golang Backend (Clean Architecture)
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Başlangıç noktası (Postgres havuzu & fallback in-memory)
│   ├── config/
│   │   └── config.go                # Ortam değişkenleri (.env)
│   ├── internal/
│   │   ├── domain/                  # Saf iş modelleri ve arayüzler
│   │   │   ├── person.go            # Person modeli & PersonRepository interface
│   │   │   ├── relationship.go      # Relationship modeli & RelationshipRepository interface
│   │   │   ├── tree.go              # Tree ve SearchResultItem modelleri
│   │   │   └── media.go             # Medya modelleri
│   │   ├── repository/              # Veri katmanı
│   │   │   ├── postgres/            # 🐘 PostgreSQL Yerel Repository'leri
│   │   │   │   ├── db.go            # pgxpool bağlantı havuzu
│   │   │   │   ├── person_repo.go   # persons tablosu CRUD + Search + Clear
│   │   │   │   ├── rel_repo.go      # relationships tablosu + WITH RECURSIVE CTE
│   │   │   │   └── tree_repo.go     # trees tablosu dinamik member_count sorgusu
│   │   │   ├── mem_person_repo.go   # In-memory Person repository
│   │   │   └── mem_rel_repo.go      # In-memory Relationship repository
│   │   ├── service/                 # İş mantığı katmanı
│   │   │   ├── person_service.go    # Kişi yönetimi kuralları
│   │   │   ├── relationship_service.go # İlişki yönetimi kuralları
│   │   │   ├── tree_service.go      # ReactFlow graf oluşturucu (nodes & edges)
│   │   │   ├── tree_meta_service.go # Ağaç listesi, ağaç oluşturma, çapraz arama
│   │   │   └── seed_service.go      # 3 farklı örnek demo aile ağacı yükleyici
│   │   └── handler/                 # HTTP API Controller'ları
│   │       ├── person_handler.go    # /api/v1/persons
│   │       ├── relationship_handler.go # /api/v1/relationships
│   │       ├── tree_handler.go      # /api/v1/tree?treeId=...
│   │       └── media_handler.go     # /api/v1/upload
│   ├── migrations/                  # PostgreSQL Göç Dosyaları
│   │   ├── 000001_create_persons_table.up.sql / .down.sql
│   │   ├── 000002_create_relationships_table.up.sql / .down.sql
│   │   └── 000003_create_trees_table.up.sql / .down.sql
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
│
├── frontend/                        # React 18 + Vite + TypeScript Frontend
│   ├── index.html                   # Kök HTML (Dark tema yapılandırmalı)
│   ├── src/
│   │   ├── components/
│   │   │   └── forms/               # Modal Formlar
│   │   │       ├── PersonModal.tsx       # Kişi Ekle / Düzenle (Glassmorphic)
│   │   │       ├── RelationshipModal.tsx # Anne, Baba, Eş, Çocuk Bağlantısı
│   │   │       └── CreateTreeModal.tsx   # Yeni Ağaç Tanımlama
│   │   ├── features/
│   │   │   ├── tree/                # 🌳 Soy Ağacı Görselleştirme
│   │   │   │   ├── TreeCanvas.tsx        # React Flow ana tuvali & kontroller
│   │   │   │   ├── PersonNode.tsx        # Kişi kartı (hover mikro-menü, rozetler)
│   │   │   │   ├── FamilyEdge.tsx        # Kan bağı & Evlilik çizgileri
│   │   │   │   ├── layoutEngine.ts       # ELK.js hiyerarşik nesil düzenleyici
│   │   │   │   └── TreeEventsContext.tsx # Titremeyi önleyen optimize Context yapısı
│   │   │   └── person/
│   │   │       └── PersonDetailModal.tsx # Detaylı profil kartı ve ilişkiler
│   │   ├── services/                # API İstemcileri
│   │   │   ├── api.ts               # Axios instance (CORS & Base URL)
│   │   │   ├── personService.ts
│   │   │   ├── relationshipService.ts
│   │   │   └── treeService.ts       # getTree, getAllTrees, createTree, searchAll
│   │   ├── styles/
│   │   │   ├── globals.css          # Dark scheme ve input stilleri
│   │   │   └── tree.css             # Glassmorphism, neon efektler, edge animasyonları
│   │   ├── types/                   # Tip tanımları
│   │   │   ├── person.ts
│   │   │   └── tree.ts              # TreeInfo, SearchResultItem, TreeGraph
│   │   ├── App.tsx                  # Üst navigasyon, ağaç seçici, arama & durum
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
```

---

## 4. Veritabanı Modeli (PostgreSQL)

```sql
-- 1. Ağaçlar Tablosu
CREATE TABLE trees (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    owner_name  VARCHAR(100) NOT NULL,
    is_owner    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Kişiler Tablosu
CREATE TABLE persons (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id      VARCHAR(50)   NOT NULL DEFAULT 'my-tree',
    first_name   VARCHAR(100)  NOT NULL,
    last_name    VARCHAR(100)  NOT NULL,
    maiden_name  VARCHAR(100),
    gender       gender_type   NOT NULL DEFAULT 'unknown',
    birth_date   DATE,
    birth_place  VARCHAR(150),
    death_date   DATE,
    death_place  VARCHAR(150),
    is_living    BOOLEAN       NOT NULL DEFAULT TRUE,
    avatar_url   TEXT,
    biography    TEXT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. İlişkiler Tablosu
CREATE TABLE relationships (
    id                UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_id           VARCHAR(50)      NOT NULL DEFAULT 'my-tree',
    person_id         UUID             NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    related_person_id UUID             NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    marriage_date     DATE,
    divorce_date      DATE,
    notes             VARCHAR(255),
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_relationship UNIQUE (person_id, related_person_id, relationship_type)
);
```

---

## 5. Aşama Durumu (Roadmap)

### ✅ Faz 1: Temel Mimari & Ağaç Graf Motoru (Tamamlandı)
- [x] Go + Fiber backend altyapısı ve RESTful API
- [x] React 18 + TypeScript + Vite + Tailwind CSS kurulumu
- [x] React Flow tuvali ve özel düğüm/kenar mimarisi
- [x] ELK.js nesil tabanlı otomatik hiyerarşik yerleşim
- [x] Titreme ve render döngülerinin giderilmesi (Context optimizasyonu)

### ✅ Faz 2: Çoklu Ağaç, Arama, UI İyileştirmeleri & PostgreSQL (Tamamlandı)
- [x] PostgreSQL 18 entegrasyonu (pgx/v5 & pgxpool)
- [x] SQL Göçleri (persons, relationships, trees)
- [x] Çoklu ağaç desteği (Kullanıcının kendi ağacı + başkalarının ağaçları)
- [x] Sadece İnceleme (Read-Only) koruması
- [x] Canlı genel arama çubuğu (Cross-Tree Search)
- [x] Dark Glassmorphic UI & form renk düzeltmeleri

### 🚀 Faz 3: İleri Düzey Özellikler (Sıradaki Adımlar)
- [ ] Yüksek çözünürlüklü PNG/PDF dışa aktarma (Ağaç indirme)
- [ ] Yaşam Kronolojisi (Life Timeline) görünümü
- [ ] Otomatik Akrabalık Hesaplayıcı (BFS/Graflar arası yol analizi)
- [ ] Fotoğraf ve aile albümü medya yükleme sistemi
