-- 000001_create_persons_table.up.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS persons (
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

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_persons_fulltext ON persons
    USING GIN (to_tsvector('turkish', first_name || ' ' || last_name));

CREATE INDEX IF NOT EXISTS idx_persons_tree_id     ON persons (tree_id);
CREATE INDEX IF NOT EXISTS idx_persons_birth_date  ON persons (birth_date);
CREATE INDEX IF NOT EXISTS idx_persons_is_living   ON persons (is_living);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS persons_updated_at ON persons;
CREATE TRIGGER persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
