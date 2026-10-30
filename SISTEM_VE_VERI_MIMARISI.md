# 🌳 Aile Ağacı Uygulaması (Family Tree App)
# Sistem Durumu, İlerleme Özeti ve Veri Kaydetme Mimarisi

Bu doküman, projenin başlangıcından bu yana tamamlanan tüm aşamaları, sistemin uçtan uca nasıl çalıştığını, verilerin nasıl kaydedilip saklandığını ve Docker mimarisini kapsamlı olarak açıklamaktadır.

---

## 1. Şimdiye Kadar Neler Yapıldı? (Proje Durumu)

Proje iki ana aşama (Faz 1 ve Faz 2) halinde geliştirilmiş ve tüm bileşenleri Docker üzerine taşınmıştır:

### ✅ Faz 1: Temel Mimari & Ağaç Çizim Motoru
1. **Go (Golang 1.22) + Fiber RESTful API:**
   - Temiz Mimari (Clean Architecture: Domain, Repository, Service, Handler) kuruldu.
   - Düşük gecikmeli, eşzamanlı ve yüksek performanslı Fiber v2 çatısı yapılandırıldı.
2. **React 18 + Vite + TypeScript Frontend:**
   - ReactFlow (`@xyflow/react`) görselleştirme tuvali entegre edildi.
   - Otomatik nesil düzenlemesi için **ELK.js (Eclipse Layout Kernel)** algoritması devreye alındı (kuşaklar dikey hiyerarşide, kardeşler ve eşler yatayda otomatik hizalanır).
3. **Özel Düğümler ve Bağ Çizgileri:**
   - `PersonNode`: Cinsiyete göre renk bordürleri, doğum/ölüm yılları, yaş bilgisi ve üzerine gelindiğinde (hover) açılan mikro-menü (+Ebeveyn, +Eş, +Çocuk, Profili Gör).
   - `FamilyEdge`: Kan bağı (ebeveyn-çocuk) ve evlilik bağı (eş) çizgileri için özel SVG bağlantıları.
4. **Kararlılık & Performans Optimizasyonu:**
   - React Flow üzerindeki sonsuz render döngüleri ve ekran titremesi (flickering), callback'lerin düğüm verisinden çıkarılıp `TreeEventsContext` içine taşınmasıyla tamamen çözüldü.

---

### ✅ Faz 2: Çoklu Ağaç, Arama, UI İyileştirmeleri & PostgreSQL
1. **🐘 PostgreSQL 16 & Yerel Sürücü (`jackc/pgx/v5`):**
   - Uygulama geçici bellekten (in-memory) çıkarılıp gerçek ilişkisel veritabanına bağlandı.
   - Yüksek performanslı bağlantı havuzu (`pgxpool`) ile eşzamanlı istek yönetimi sağlandı.
2. **🌲 Çoklu Ağaç (Multi-Tree) Desteği:**
   - Kullanıcı kendi aile ağacını tam düzenleme yetkisiyle (`is_owner: true`) yönetebilir.
   - Başkalarının ağaçlarını "Sadece İnceleme (Read-Only)" modunda gezebilir.
   - Yeni bağımsız aile ağaçları tanımlanabilir (`CreateTreeModal`).
3. **🔍 Çapraz Ağaç Genel Arama (Global Cross-Tree Search):**
   - Üst bardaki canlı arama kutusu ile tüm sistemdeki kişiler ad, soyad ve doğum yerine göre anında taranır.
   - Tıklanan kişinin bulunduğu ağaca otomatik geçiş yapılır.
4. **🎨 Dark Glassmorphic Arayüz Düzeltmeleri:**
   - Tüm beyaz arka planlı standart input/select elemanları kaldırıldı, modern karanlık cam teması (`color-scheme: dark`) uygulandı.
5. **🐳 Tam Docker Entegrasyonu:**
   - `familytree_db` (PostgreSQL 16 Alpine), `familytree_api` (Go API) ve `familytree_web` (React SPA) servisleri `docker-compose.yml` ile tek komutla yönetilebilir hale getirildi.
   - Frontend için reverse-proxy mimarisi kurularak API çağrılarının Docker ağı içinde güvenle iletilmesi sağlandı.

---

## 2. Veri Kaydetme ve Kalıcılık Mimarisi (Data Persistence)

Sistemde verinin kullanıcı arayüzünden veritabanı diskine kadar olan yolculuğu şu şekildedir:

### 2.1. Uçtan Uca Veri Akış Şeması

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        KULLANICI TARAYICISI                           │
│  [Kişi / İlişki Ekleme Formu] ──(Kullanıcı Girişi: Ad, Doğum, vb.)────│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON Payload (POST / PUT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             FRONTEND DOCKER KONTEYNERİ (familytree_web:5173)           │
│  - server.mjs Reverse Proxy: /api/* isteklerini tespit eder.           │
│  - İsteği Docker ağı üzerinden backend servisine iletir.               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP Proxy -> http://backend:8080
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             BACKEND DOCKER KONTEYNERİ (familytree_api:8080)            │
│  1. Handler (Controller): Gelen JSON gövdesini parse & validate eder.  │
│  2. Service (İş Mantığı): Aile kurallarını ve UUID atamalarını yapar.  │
│  3. Repository (pgxpool): Parametrik SQL sorgusunu hazırlar.          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PostgreSQL Protokolü (Port 5432)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            VERİTABANI DOCKER KONTEYNERİ (familytree_db:5432)           │
│  - PostgreSQL 16 Engine sorguyu çalıştırır (INSERT / UPDATE).         │
│  - Veri RAM'den kalıcı diske yazılır.                                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Disk Yazma (I/O)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  DOCKER DİSK VOLUMÜ (tree_postgres_data)               │
│  Konteynerler kapansa, silinse veya yeniden başlatılsa bile           │
│  bütün aile verileri bu kalıcı fiziksel alanda saklanır.              │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2. Veritabanı Tablo Yapısı ve Modeller

PostgreSQL üzerinde **Graf-İlişkisel (Graph-Relational)** model kullanılmıştır:

#### 1. `trees` (Ağaç Üst Verileri)
Her soy ağacının ana kimliğidir:
| Kolon | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `id` | `VARCHAR(50)` (PK) | Ağacın benzersiz kodu (Örn: `my-tree`, `tree-demir`) |
| `name` | `VARCHAR(150)` | Ağacın başlığı (Örn: `Kaya Ailesi Soy Ağacı`) |
| `description` | `TEXT` | Açıklama ve sülale notu |
| `owner_name` | `VARCHAR(100)` | Ağaç sahibinin adı |
| `is_owner` | `BOOLEAN` | Oturum açan kullanıcının kendi ağacı mı? (`true` ise tam yetki, `false` ise salt okunur) |
| `created_at` | `TIMESTAMPTZ` | Oluşturulma tarihi |

#### 2. `persons` (Kişiler Tablosu)
Ailedeki bireyleri temsil eder:
| Kolon | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Bireyin benzersiz kimliği (`uuid_generate_v4()`) |
| `tree_id` | `VARCHAR(50)` (İndeksli) | Kişinin hangi ağaca ait olduğu |
| `first_name` | `VARCHAR(100)` | Adı |
| `last_name` | `VARCHAR(100)` | Soyadı |
| `maiden_name` | `VARCHAR(100)` | Kızlık soyadı (kadınlar için) |
| `gender` | `ENUM` | `male`, `female`, `other`, `unknown` |
| `birth_date` | `DATE` | Doğum tarihi |
| `birth_place` | `VARCHAR(150)` | Doğum yeri |
| `death_date` | `DATE` | Vefat tarihi |
| `death_place` | `VARCHAR(150)` | Vefat yeri |
| `is_living` | `BOOLEAN` | Hayatta mı? (Varsayılan: `true`) |
| `avatar_url` | `TEXT` | Fotoğraf yolu |
| `biography` | `TEXT` | Yaşam hikayesi |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Otomatik trigger ile güncellenen zaman damgası |

#### 3. `relationships` (İlişkiler & Graf Kenarları Tablosu)
Kişiler arasındaki tüm bağlar yönlü graf kenarları (directed edges) olarak tutulur:
| Kolon | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | İlişki kimliği |
| `tree_id` | `VARCHAR(50)` (İndeksli) | Ağaç kimliği |
| `person_id` | `UUID` (FK -> persons.id) | İlişkinin öznesi (Örn: Ebeveyn veya 1. Eş) |
| `related_person_id` | `UUID` (FK -> persons.id) | İlişkili kişi (Örn: Çocuk veya 2. Eş) |
| `relationship_type` | `ENUM` | `parent`, `child`, `spouse`, `former_spouse`, `adoptive_parent`, `adoptive_child` |
| `marriage_date` | `DATE` | Evlilik tarihi (eşler için) |
| `divorce_date` | `DATE` | Boşanma tarihi |
| `notes` | `VARCHAR(255)` | Özel ilişki notları |

> **Tekillik Garantisi (Unique Constraint):** `(person_id, related_person_id, relationship_type)` üçlüsü benzersizdir; aynı iki kişi arasında mükerrer ilişki kaydı oluşturulamaz.

---

### 2.3. Akıllı Graf ve Soy Ağacı Oluşturma Algoritması

1. **Graf Düğümleri (Nodes):**
   Backend, istenen `tree_id` parametresine göre `persons` tablosundaki tüm bireyleri çeker ve her birini ReactFlow düğüm formatına dönüştürür.
2. **Graf Kenarları (Edges):**
   `relationships` tablosundaki veriler taranır:
   - `parent` ilişkileri -> `bloodEdge` (Yukarıdan aşağıya inen soy çizgisi)
   - `spouse` ilişkileri -> `spouseEdge` (Yatay evlilik çizgisi, 'evli' etiketiyle)
   - Çift yönlü ilişkiler otomatik tekilleştirilir (`deduplicateEdges`).
3. **ELK.js ile Nesil Yerleşimi (Layout):**
   Frontend, düğüm ve kenar listesini aldığında ELK.js motorunu çalıştırır:
   - Büyük ebeveynler en üst kuşağa (Layer 0), anne/babalar orta kuşağa (Layer 1), çocuklar en alt kuşağa (Layer 2) otomatik atanır.
   - Çizgilerin birbirini kesmemesi için düğüm koordinatları (`x`, `y`) milisaniyeler içinde matematiksel olarak hesaplanır.

---

### 2.4. Rekürsif Soy Sorguları (PostgreSQL `WITH RECURSIVE` CTE)

PostgreSQL repo katmanında hazır bulunan rekürsif sorgular sayesinde tek sorguda tüm sülale taranabilir:
- **`GetAncestors(personId)`:** Kişiden başlayarak ebeveynleri, dedeleri ve onların atalarını sınırsız derinlikte yukarı doğru bulur.
- **`GetDescendants(personId)`:** Kişiden başlayarak tüm çocukları, torunları ve torun çocuklarını aşağı doğru bulur.

---

## 3. Docker ile Yönetim Komutları

Artık sistemin tamamı Docker konteynerleri üzerinden izole çalışmaktadır:

```bash
# 1. Bütün sistemi arka planda başlatma
docker compose up -d

# 2. Servislerin durumunu ve portları görme
docker compose ps

# 3. Canlı logları izleme
docker compose logs -f

# 4. Sadece belirli bir servisin loglarına bakma
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# 5. Sistemi tamamen durdurma (veriler korunur)
docker compose down

# 6. Veritabanını sıfırlayıp baştan başlatmak gerekirse (Volume silme)
docker compose down -v
docker compose up -d
```

---

## 4. Güncel Canlı Adresler

- 🌐 **Web Arayüzü:** [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend REST API:** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- 🐘 **PostgreSQL Veritabanı:** `localhost:5432` *(Veritabanı: `familytree`, Kullanıcı: `familytree`)*
