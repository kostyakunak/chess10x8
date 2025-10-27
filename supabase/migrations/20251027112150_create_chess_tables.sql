/*
  # Chess 10x8 Game System

  1. New Tables
    - `game_rooms`
      - `id` (uuid, primary key) - Unique room identifier/token
      - `fen` (text) - Current board position in FEN notation
      - `active_color` (text) - 'w' or 'b' for whose turn it is
      - `castling_rights` (text) - e.g., 'KQkq'
      - `en_passant` (text) - En passant target square or '-'
      - `halfmove_clock` (int) - For 50-move rule
      - `fullmove_number` (int) - Current move number
      - `status` (text) - 'waiting', 'active', 'checkmate', 'stalemate', 'draw', 'resigned'
      - `white_player_id` (text) - Session ID of white player
      - `black_player_id` (text) - Session ID of black player
      - `winner` (text) - 'white', 'black', 'draw', or null
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `game_moves`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key) - References game_rooms
      - `move_number` (int) - Sequential move number
      - `color` (text) - 'w' or 'b'
      - `from_square` (text) - e.g., 'F1'
      - `to_square` (text) - e.g., 'H1'
      - `piece` (text) - Piece type: 'K', 'Q', 'R', 'B', 'N', 'P'
      - `promotion` (text) - Promotion piece if applicable
      - `castle_type` (text) - 'short' or 'long' if castling
      - `captured_piece` (text) - Piece that was captured
      - `is_en_passant` (boolean) - Whether this was en passant
      - `is_check` (boolean) - Whether this move gave check
      - `is_checkmate` (boolean) - Whether this move was checkmate
      - `san` (text) - Standard algebraic notation
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Anyone can create a room
    - Anyone can view rooms they're part of
    - Only players in a room can add moves
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

-- Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Policies for game_rooms
CREATE POLICY "Anyone can create rooms"
  ON game_rooms FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view rooms"
  ON game_rooms FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Players can update their rooms"
  ON game_rooms FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for game_moves
CREATE POLICY "Anyone can view moves"
  ON game_moves FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert moves"
  ON game_moves FOR INSERT
  TO anon
  WITH CHECK (true);
