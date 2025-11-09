/*
  # Chess 10x8 Game System - Railway PostgreSQL Migration

  This migration creates the necessary tables for the chess game.
  Removed Supabase-specific features (RLS, anon role, realtime publications).
*/

-- Game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/10/10/10/10/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  active_color text NOT NULL DEFAULT 'w',
  castling_rights text NOT NULL DEFAULT 'KQkq',
  en_passant text NOT NULL DEFAULT '-',
  halfmove_clock int NOT NULL DEFAULT 0,
  fullmove_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting',
  game_started boolean DEFAULT false,
  white_player_id text,
  black_player_id text,
  winner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Game moves table
CREATE TABLE IF NOT EXISTS game_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  move_number int NOT NULL,
  color text NOT NULL,
  from_square text NOT NULL,
  to_square text NOT NULL,
  piece text NOT NULL,
  promotion text,
  castle_type text,
  captured_piece text,
  is_en_passant boolean DEFAULT false,
  is_check boolean DEFAULT false,
  is_checkmate boolean DEFAULT false,
  san text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_created_at ON game_moves(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON game_rooms;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

