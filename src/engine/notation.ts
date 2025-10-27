import { Position, Move, PieceType, Square, PieceColor } from '../types/chess';
import { squareToCoords } from './board';

export function moveToSAN(
  move: Move,
  position: Position,
  legalMoves: { from: Square; to: Square }[]
): string {
  if (move.castleType === 'short') return 'O-O';
  if (move.castleType === 'long') return 'O-O-O';

  let san = '';

  if (move.piece !== 'P') {
    san += move.piece;

    const ambiguous = legalMoves.filter(m => {
      if (m.from === move.from) return false;
      if (m.to !== move.to) return false;
      const piece = position[m.from];
      return piece && piece.type === move.piece;
    });

    if (ambiguous.length > 0) {
      const [fromFile, fromRank] = squareToCoords(move.from);
      const sameFile = ambiguous.some(m => squareToCoords(m.from)[0] === fromFile);
      const sameRank = ambiguous.some(m => squareToCoords(m.from)[1] === fromRank);

      if (!sameFile) {
        san += move.from.charAt(0).toLowerCase();
      } else if (!sameRank) {
        san += move.from.charAt(1);
      } else {
        san += move.from.toLowerCase();
      }
    }
  } else if (move.captured) {
    san += move.from.charAt(0).toLowerCase();
  }

  if (move.captured) {
    san += 'x';
  }

  san += move.to.toLowerCase();

  if (move.promotion) {
    san += '=' + move.promotion;
  }

  if (move.isEnPassant) {
    san += ' e.p.';
  }

  if (move.isCheckmate) {
    san += '#';
  } else if (move.isCheck) {
    san += '+';
  }

  return san;
}

export function updateCastlingRights(
  castlingRights: string,
  from: Square,
  piece: PieceType,
  color: PieceColor
): string {
  let rights = castlingRights;

  if (piece === 'K') {
    if (color === 'w') {
      rights = rights.replace('K', '').replace('Q', '');
    } else {
      rights = rights.replace('k', '').replace('q', '');
    }
  }

  if (piece === 'R') {
    if (color === 'w') {
      if (from === 'I1') rights = rights.replace('K', '');
      if (from === 'B1') rights = rights.replace('Q', '');
    } else {
      if (from === 'I8') rights = rights.replace('k', '');
      if (from === 'B8') rights = rights.replace('q', '');
    }
  }

  return rights || '-';
}

export function getEnPassantSquare(
  from: Square,
  to: Square,
  piece: PieceType,
  color: PieceColor
): string {
  if (piece !== 'P') return '-';

  const [fromFile, fromRank] = squareToCoords(from);
  const [toFile, toRank] = squareToCoords(to);

  if (Math.abs(toRank - fromRank) === 2) {
    const epRank = color === 'w' ? fromRank + 1 : fromRank - 1;
    const epSquare = String.fromCharCode(65 + fromFile) + (epRank + 1);
    return epSquare;
  }

  return '-';
}
