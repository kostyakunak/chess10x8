export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type PieceColor = 'w' | 'b';
export type Square = string;
export type CastleType = 'short' | 'long';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  [square: string]: Piece;
}

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  castleType?: CastleType;
  isEnPassant?: boolean;
  isCheck?: boolean;
  isCheckmate?: boolean;
  san: string;
}

export interface GameState {
  position: Position;
  activeColor: PieceColor;
  castlingRights: string;
  enPassant: string;
  halfmoveClock: number;
  fullmoveNumber: number;
  lastMove?: Move;
  history: Move[];
  status: 'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  winner?: 'white' | 'black' | 'draw';
}

export interface LegalMove {
  to: Square;
  captured?: PieceType;
  promotion?: boolean;
  castleType?: CastleType;
  isEnPassant?: boolean;
}

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
