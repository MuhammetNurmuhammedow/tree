-- 000002_create_relationships_table.up.sql

DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM (
        'parent',
        'child',
        'spouse',
        'former_spouse',
        'adoptive_parent',
        'adoptive_child'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS relationships (
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

    -- Prevent duplicate relationships
    CONSTRAINT unique_relationship UNIQUE (person_id, related_person_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_relationships_tree_id           ON relationships (tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person_id         ON relationships (person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_person_id ON relationships (related_person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type              ON relationships (relationship_type);

DROP TRIGGER IF EXISTS relationships_updated_at ON relationships;
CREATE TRIGGER relationships_updated_at
    BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
