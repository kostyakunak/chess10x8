-- Fix Realtime synchronization issues
-- This migration fixes postgres_changes not firing

-- 1) Ensure PRIMARY KEY exists (should already be there from original migration)
-- We skip this because PRIMARY KEY was already added in the create table statement

-- 2) Set REPLICA IDENTITY FULL for correct UPDATE/DELETE events
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;

-- 3) Add table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;

-- 4) Ensure anon has SELECT privileges
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.game_rooms TO anon;

-- 5) Add updated_at column with trigger for versioning
CREATE EXTENSION IF NOT EXISTS moddatetime;

ALTER TABLE public.game_rooms 
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.game_rooms 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at ON public.game_rooms;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime (updated_at);

-- 6) Update existing rows to have updated_at
UPDATE public.game_rooms 
SET updated_at = created_at 
WHERE updated_at IS NULL OR updated_at = created_at;

