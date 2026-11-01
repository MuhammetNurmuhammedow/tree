-- 000004_binary_gender.down.sql

ALTER TABLE persons DROP CONSTRAINT IF EXISTS persons_gender_binary;
ALTER TABLE persons ALTER COLUMN gender SET DEFAULT 'unknown';
