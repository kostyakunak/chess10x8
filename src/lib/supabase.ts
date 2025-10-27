import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GameRoom {
  id: string;
  fen: string;
  active_color: string;
  castling_rights: string;
  en_passant: string;
  halfmove_clock: number;
  fullmove_number: number;
  status: string;
  game_started: boolean;
  white_player_id: string | null;
  black_player_id: string | null;
  winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameMove {
  id: string;
  room_id: string;
  move_number: number;
  color: string;
  from_square: string;
  to_square: string;
  piece: string;
  promotion: string | null;
  castle_type: string | null;
  captured_piece: string | null;
  is_en_passant: boolean;
  is_check: boolean;
  is_checkmate: boolean;
  san: string;
  created_at: string;
}
