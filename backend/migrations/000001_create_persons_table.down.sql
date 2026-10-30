-- 000001_create_persons_table.down.sql

DROP TRIGGER IF EXISTS persons_updated_at ON persons;
DROP FUNCTION IF EXISTS update_updated_at();
DROP INDEX IF EXISTS idx_persons_fulltext;
DROP INDEX IF EXISTS idx_persons_birth_date;
DROP INDEX IF EXISTS idx_persons_is_living;
DROP TABLE IF EXISTS persons;
DROP TYPE IF EXISTS gender_type;

