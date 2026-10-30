-- 000003_create_trees_table.up.sql

CREATE TABLE IF NOT EXISTS trees (
    id          VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    owner_name  VARCHAR(100) NOT NULL,
    is_owner    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed initial trees into database
INSERT INTO trees (id, name, description, owner_name, is_owner)
VALUES
    ('my-tree', 'Kaya Ailesi Soy Ağacı', 'Benim kendi aile ağacım (Tam Düzenleme Yetkisi)', 'Ben (Ahmet Kaya)', TRUE),
    ('tree-demir', 'Demir Ailesi Soy Ağacı', 'Zeynep Demir''in anne tarafı sülalesi (Başkasının Ağacı - Sadece İnceleme)', 'Süleyman Demir', FALSE),
    ('tree-yilmaz', 'Yılmaz Ailesi Soy Ağacı', 'Fatma Yılmaz''ın ata soy ağacı (Başkasının Ağacı - Sadece İnceleme)', 'Kemal Yılmaz', FALSE)
ON CONFLICT (id) DO NOTHING;
