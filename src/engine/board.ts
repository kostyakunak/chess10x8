import { Position, Piece, Square, PieceColor, PieceType } from '../types/chess';

export const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function getInitialPosition(): Position {
  const position: Position = {};

  const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'] as PieceType[];

  backRank.forEach((piece, index) => {
    const file = FILES[index + 1];
    position[`${file}1`] = { type: piece, color: 'w' };
    position[`${file}8`] = { type: piece, color: 'b' };
  });

  for (let i = 1; i <= 8; i++) {
    const file = FILES[i];
    position[`${file}2`] = { type: 'P', color: 'w' };
    position[`${file}7`] = { type: 'P', color: 'b' };
  }

  return position;
}

export function squareToCoords(square: Square): [number, number] {
  const file = square.charAt(0);
  const rank = square.charAt(1);
  return [FILES.indexOf(file), RANKS.indexOf(rank)];
}

export function coordsToSquare(file: number, rank: number): Square | null {
  if (file < 0 || file >= 10 || rank < 0 || rank >= 8) return null;
  return FILES[file] + RANKS[rank];
}

export function isValidSquare(square: string): boolean {
  if (square.length !== 2) return false;
  const file = square.charAt(0);
  const rank = square.charAt(1);
  return FILES.includes(file) && RANKS.includes(rank);
}

export function getOppositeColor(color: PieceColor): PieceColor {
  return color === 'w' ? 'b' : 'w';
}

export function clonePosition(position: Position): Position {
  const clone: Position = {};
  for (const square in position) {
    clone[square] = { ...position[square] };
  }
  return clone;
}

export function parseFEN(fen: string): {
  position: Position;
  activeColor: PieceColor;
  castlingRights: string;
  enPassant: string;
  halfmoveClock: number;
  fullmoveNumber: number;
} {
  const parts = fen.split(' ');
  const position: Position = {};

  const ranks = parts[0].split('/');

  for (let rankIdx = 7; rankIdx >= 0; rankIdx--) {
    const rankStr = ranks[7 - rankIdx];
    let fileIdx = 0;

    for (const char of rankStr) {
      if (char >= '0' && char <= '9') {
        fileIdx += parseInt(char);
      } else {
        const square = coordsToSquare(fileIdx, rankIdx);
        if (square) {
          const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
          const type = char.toUpperCase() as PieceType;
          position[square] = { type, color };
        }
        fileIdx++;
      }
    }
  }

  return {
    position,
    activeColor: parts[1] as PieceColor,
    castlingRights: parts[2],
    enPassant: parts[3],
    halfmoveClock: parseInt(parts[4] || '0'),
    fullmoveNumber: parseInt(parts[5] || '1'),
  };
}

export function generateFEN(
  position: Position,
  activeColor: PieceColor,
  castlingRights: string,
  enPassant: string,
  halfmoveClock: number,
  fullmoveNumber: number
): string {
  const ranks: string[] = [];

  for (let rankIdx = 7; rankIdx >= 0; rankIdx--) {
    let rankStr = '';
    let emptyCount = 0;

    for (let fileIdx = 0; fileIdx < 10; fileIdx++) {
      const square = coordsToSquare(fileIdx, rankIdx);
      const piece = square ? position[square] : null;

      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        const char = piece.color === 'w' ? piece.type : piece.type.toLowerCase();
        rankStr += char;
      }
    }

    if (emptyCount > 0) {
      rankStr += emptyCount.toString();
    }

    ranks.push(rankStr);
  }

  return `${ranks.join('/')} ${activeColor} ${castlingRights} ${enPassant} ${halfmoveClock} ${fullmoveNumber}`;
}
