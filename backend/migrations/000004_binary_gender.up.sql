-- 000004_binary_gender.up.sql
-- Only 'male' and 'female' are allowed. The enum type keeps its old labels
-- (Postgres cannot drop enum values), so a CHECK constraint enforces the rule.
-- Runs on every startup, so it must stay idempotent.

ALTER TABLE persons ALTER COLUMN gender DROP DEFAULT;

DO $$ BEGIN
    ALTER TABLE persons ADD CONSTRAINT persons_gender_binary CHECK (gender IN ('male', 'female'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
