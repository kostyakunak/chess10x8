import { Position, Piece, Square, PieceColor, PieceType, LegalMove, CastleType } from '../types/chess';
import { squareToCoords, coordsToSquare, getOppositeColor, clonePosition } from './board';

export function getLegalMoves(
  position: Position,
  square: Square,
  activeColor: PieceColor,
  castlingRights: string,
  enPassant: string
): LegalMove[] {
  const piece = position[square];
  if (!piece || piece.color !== activeColor) return [];

  const pseudoMoves = getPseudoLegalMoves(position, square, piece, castlingRights, enPassant);

  return pseudoMoves.filter(move => {
    const newPosition = makeMove(position, square, move.to, move.promotion, move.castleType);
    return !isInCheck(newPosition, activeColor);
  });
}

function getPseudoLegalMoves(
  position: Position,
  square: Square,
  piece: Piece,
  castlingRights: string,
  enPassant: string
): LegalMove[] {
  const moves: LegalMove[] = [];

  switch (piece.type) {
    case 'P':
      moves.push(...getPawnMoves(position, square, piece.color, enPassant));
      break;
    case 'N':
      moves.push(...getKnightMoves(position, square, piece.color));
      break;
    case 'B':
      moves.push(...getBishopMoves(position, square, piece.color));
      break;
    case 'R':
      moves.push(...getRookMoves(position, square, piece.color));
      break;
    case 'Q':
      moves.push(...getQueenMoves(position, square, piece.color));
      break;
    case 'K':
      moves.push(...getKingMoves(position, square, piece.color, castlingRights));
      break;
  }

  return moves;
}

function getPawnMoves(position: Position, square: Square, color: PieceColor, enPassant: string): LegalMove[] {
  const moves: LegalMove[] = [];
  const [file, rank] = squareToCoords(square);
  const direction = color === 'w' ? 1 : -1;
  const startRank = color === 'w' ? 1 : 6;
  const promotionRank = color === 'w' ? 7 : 0;

  const forward = coordsToSquare(file, rank + direction);
  if (forward && !position[forward]) {
    const isPromotion = rank + direction === promotionRank;
    moves.push({ to: forward, promotion: isPromotion });

    if (rank === startRank) {
      const doubleForward = coordsToSquare(file, rank + 2 * direction);
      if (doubleForward && !position[doubleForward]) {
        moves.push({ to: doubleForward });
      }
    }
  }

  for (const fileOffset of [-1, 1]) {
    const captureSquare = coordsToSquare(file + fileOffset, rank + direction);
    if (!captureSquare) continue;

    const target = position[captureSquare];
    if (target && target.color !== color) {
      const isPromotion = rank + direction === promotionRank;
      moves.push({ to: captureSquare, captured: target.type, promotion: isPromotion });
    }

    if (captureSquare === enPassant) {
      moves.push({ to: captureSquare, captured: 'P', isEnPassant: true });
    }
  }

  return moves;
}

function getKnightMoves(position: Position, square: Square, color: PieceColor): LegalMove[] {
  const moves: LegalMove[] = [];
  const [file, rank] = squareToCoords(square);

  const offsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  for (const [df, dr] of offsets) {
    const target = coordsToSquare(file + df, rank + dr);
    if (!target) continue;

    const piece = position[target];
    if (!piece) {
      moves.push({ to: target });
    } else if (piece.color !== color) {
      moves.push({ to: target, captured: piece.type });
    }
  }

  return moves;
}

function getBishopMoves(position: Position, square: Square, color: PieceColor): LegalMove[] {
  return getSlidingMoves(position, square, color, [
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ]);
}

function getRookMoves(position: Position, square: Square, color: PieceColor): LegalMove[] {
  return getSlidingMoves(position, square, color, [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ]);
}

function getQueenMoves(position: Position, square: Square, color: PieceColor): LegalMove[] {
  return getSlidingMoves(position, square, color, [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1]
  ]);
}

function getSlidingMoves(
  position: Position,
  square: Square,
  color: PieceColor,
  directions: number[][]
): LegalMove[] {
  const moves: LegalMove[] = [];
  const [file, rank] = squareToCoords(square);

  for (const [df, dr] of directions) {
    let f = file + df;
    let r = rank + dr;

    while (true) {
      const target = coordsToSquare(f, r);
      if (!target) break;

      const piece = position[target];
      if (!piece) {
        moves.push({ to: target });
      } else {
        if (piece.color !== color) {
          moves.push({ to: target, captured: piece.type });
        }
        break;
      }

      f += df;
      r += dr;
    }
  }

  return moves;
}

function getKingMoves(position: Position, square: Square, color: PieceColor, castlingRights: string): LegalMove[] {
  const moves: LegalMove[] = [];
  const [file, rank] = squareToCoords(square);

  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;

      const target = coordsToSquare(file + df, rank + dr);
      if (!target) continue;

      const piece = position[target];
      if (!piece) {
        moves.push({ to: target });
      } else if (piece.color !== color) {
        moves.push({ to: target, captured: piece.type });
      }
    }
  }

  const castleMoves = getCastlingMoves(position, square, color, castlingRights);
  moves.push(...castleMoves);

  return moves;
}

function getCastlingMoves(
  position: Position,
  kingSquare: Square,
  color: PieceColor,
  castlingRights: string
): LegalMove[] {
  const moves: LegalMove[] = [];
  const rank = color === 'w' ? '1' : '8';
  const expectedKingSquare = `F${rank}`;

  if (kingSquare !== expectedKingSquare) return moves;

  if (isInCheck(position, color)) return moves;

  const kingChar = color === 'w' ? 'K' : 'k';
  const queenChar = color === 'w' ? 'Q' : 'q';

  if (castlingRights.includes(kingChar)) {
    const squares = [`G${rank}`, `H${rank}`];
    const rookSquare = `I${rank}`;

    if (
      !position[squares[0]] &&
      !position[squares[1]] &&
      position[rookSquare]?.type === 'R' &&
      position[rookSquare]?.color === color
    ) {
      const safe = squares.every(sq => {
        const testPos = clonePosition(position);
        delete testPos[kingSquare];
        testPos[sq] = { type: 'K', color };
        return !isInCheck(testPos, color);
      });

      if (safe) {
        moves.push({ to: `H${rank}`, castleType: 'short' });
      }
    }
  }

  if (castlingRights.includes(queenChar)) {
    const squares = [`E${rank}`, `D${rank}`];
    const betweenSquare = `C${rank}`;
    const rookSquare = `B${rank}`;

    if (
      !position[squares[0]] &&
      !position[squares[1]] &&
      !position[betweenSquare] &&
      position[rookSquare]?.type === 'R' &&
      position[rookSquare]?.color === color
    ) {
      const safe = squares.every(sq => {
        const testPos = clonePosition(position);
        delete testPos[kingSquare];
        testPos[sq] = { type: 'K', color };
        return !isInCheck(testPos, color);
      });

      if (safe) {
        moves.push({ to: `D${rank}`, castleType: 'long' });
      }
    }
  }

  return moves;
}

export function makeMove(
  position: Position,
  from: Square,
  to: Square,
  promotion?: PieceType,
  castleType?: CastleType
): Position {
  const newPosition = clonePosition(position);
  const piece = newPosition[from];

  if (!piece) return newPosition;

  if (castleType) {
    const rank = from.charAt(1);
    const color = piece.color;

    if (castleType === 'short') {
      const rookFrom = `I${rank}`;
      const rookTo = `G${rank}`;

      delete newPosition[from];
      delete newPosition[rookFrom];
      newPosition[to] = piece;
      newPosition[rookTo] = { type: 'R', color };
    } else {
      const rookFrom = `B${rank}`;
      const rookTo = `E${rank}`;

      delete newPosition[from];
      delete newPosition[rookFrom];
      newPosition[to] = piece;
      newPosition[rookTo] = { type: 'R', color };
    }
  } else {
    delete newPosition[from];

    if (promotion) {
      newPosition[to] = { type: promotion, color: piece.color };
    } else {
      newPosition[to] = piece;
    }

    if (piece.type === 'P' && Math.abs(squareToCoords(from)[0] - squareToCoords(to)[0]) === 1 && !position[to]) {
      const captureRank = piece.color === 'w' ? '5' : '4';
      const captureSquare = to.charAt(0) + captureRank;
      delete newPosition[captureSquare];
    }
  }

  return newPosition;
}

export function isInCheck(position: Position, color: PieceColor): boolean {
  const kingSquare = findKing(position, color);
  if (!kingSquare) return false;

  const opponentColor = getOppositeColor(color);

  for (const square in position) {
    const piece = position[square];
    if (piece.color === opponentColor) {
      const moves = getAttackingMoves(position, square, piece);
      if (moves.some(move => move.to === kingSquare)) {
        return true;
      }
    }
  }

  return false;
}

function getAttackingMoves(position: Position, square: Square, piece: Piece): LegalMove[] {
  const moves: LegalMove[] = [];
  const [file, rank] = squareToCoords(square);

  switch (piece.type) {
    case 'P': {
      const direction = piece.color === 'w' ? 1 : -1;
      for (const fileOffset of [-1, 1]) {
        const target = coordsToSquare(file + fileOffset, rank + direction);
        if (target) moves.push({ to: target });
      }
      break;
    }
    case 'N':
      return getKnightMoves(position, square, piece.color);
    case 'B':
      return getBishopMoves(position, square, piece.color);
    case 'R':
      return getRookMoves(position, square, piece.color);
    case 'Q':
      return getQueenMoves(position, square, piece.color);
    case 'K': {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const target = coordsToSquare(file + df, rank + dr);
          if (target) moves.push({ to: target });
        }
      }
      break;
    }
  }

  return moves;
}

function findKing(position: Position, color: PieceColor): Square | null {
  for (const square in position) {
    const piece = position[square];
    if (piece.type === 'K' && piece.color === color) {
      return square;
    }
  }
  return null;
}

export function hasLegalMoves(
  position: Position,
  color: PieceColor,
  castlingRights: string,
  enPassant: string
): boolean {
  for (const square in position) {
    const piece = position[square];
    if (piece.color === color) {
      const moves = getLegalMoves(position, square, color, castlingRights, enPassant);
      if (moves.length > 0) return true;
    }
  }
  return false;
}
