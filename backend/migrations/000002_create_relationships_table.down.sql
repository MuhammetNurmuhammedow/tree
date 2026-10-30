-- 000002_create_relationships_table.down.sql

DROP TRIGGER IF EXISTS relationships_updated_at ON relationships;
DROP INDEX IF EXISTS idx_relationships_person_id;
DROP INDEX IF EXISTS idx_relationships_related_person_id;
DROP INDEX IF EXISTS idx_relationships_type;
DROP TABLE IF EXISTS relationships;
DROP TYPE IF EXISTS relationship_type;

