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
    ('my-tree', 'Berdiýewler Maşgala Agajy', 'Meniň maşgala nesil agajym (Doly redaktirleme rugsady bar)', 'Merdan Berdiýew', TRUE),
    ('tree-amanow', 'Amanowlar Maşgala Agajy', 'Mary welaýatynyň taryhy sülalesi (Gözden geçirme)', 'Serdar Amanow', FALSE),
    ('tree-gurbanow', 'Gurbanowlar Maşgala Agajy', 'Daşoguz welaýatyndan bolan ata-babalarymyzyň agajy (Gözden geçirme)', 'Röwşen Gurbanow', FALSE),
    ('tree-myradow', 'Myradowlar Maşgala Agajy', 'Balkan welaýatynyň Hazar ýakasy nesil agajy (Gözden geçirme)', 'Şöhrat Myradow', FALSE)
ON CONFLICT (id) DO NOTHING;
