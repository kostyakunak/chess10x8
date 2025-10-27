import { useState } from 'react';
import { Position, Square, LegalMove, PieceType } from '../types/chess';
import { FILES, RANKS } from '../engine/board';
import { King, Crown, Castle, Zap } from 'lucide-react';

interface ChessBoardProps {
  position: Position;
  legalMoves: LegalMove[];
  selectedSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
  kingInCheck: Square | null;
  onSquareClick: (square: Square) => void;
  flipped?: boolean;
  gameStarted: boolean;
}

const PIECE_SYMBOLS: { [key: string]: string } = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};

export default function ChessBoard({
  position,
  legalMoves,
  selectedSquare,
  lastMove,
  kingInCheck,
  onSquareClick,
  flipped = false,
  gameStarted,
}: ChessBoardProps) {
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? RANKS : [...RANKS].reverse();

  const isLegalMove = (square: Square) => {
    return legalMoves.some(move => move.to === square);
  };

  const getLegalMove = (square: Square) => {
    return legalMoves.find(move => move.to === square);
  };

  const isHighlighted = (square: Square) => {
    return lastMove && (lastMove.from === square || lastMove.to === square);
  };

  const isCorridorFile = (file: string) => {
    return file === 'A' || file === 'J';
  };

  const handleDragStart = (square: Square) => {
    if (!gameStarted) return;
    setDraggedSquare(square);
    onSquareClick(square);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (square: Square) => {
    if (!gameStarted) return;
    if (draggedSquare && isLegalMove(square)) {
      onSquareClick(square);
    }
    setDraggedSquare(null);
  };

  return (
    <div className="inline-block bg-neutral-800 p-4 rounded-lg shadow-2xl relative">
      {!gameStarted && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
          <div className="text-white text-center">
            <div className="text-xl font-bold mb-2">Ожидание второго игрока...</div>
            <div className="text-sm">Игра начнётся как только присоединится второй игрок</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-11 gap-0">
        <div />
        {files.map(file => (
          <div
            key={file}
            className="h-6 flex items-center justify-center text-xs font-semibold text-neutral-300"
          >
            {file}
          </div>
        ))}

        {ranks.map((rank, rankIdx) => (
          <>
            <div
              key={`rank-${rank}`}
              className="w-6 flex items-center justify-center text-xs font-semibold text-neutral-300"
            >
              {rank}
            </div>
            {files.map((file, fileIdx) => {
              const square = `${file}${rank}`;
              const piece = position[square];
              const isDark = (fileIdx + rankIdx) % 2 === 1;
              const isSelected = selectedSquare === square;
              const isHighlight = isHighlighted(square);
              const isCheck = kingInCheck === square;
              const legalMove = getLegalMove(square);
              const isCorridor = isCorridorFile(file);

              let bgColor = isDark ? 'bg-emerald-700' : 'bg-amber-100';

              if (isCorridor) {
                bgColor = isDark ? 'bg-emerald-800/60' : 'bg-amber-200/60';
              }

              if (isSelected) {
                bgColor = 'bg-yellow-400';
              } else if (isHighlight) {
                bgColor = isDark ? 'bg-emerald-600' : 'bg-amber-200';
              }

              return (
                <button
                  key={square}
                  onClick={() => gameStarted && onSquareClick(square)}
                  onDragOver={gameStarted ? handleDragOver : undefined}
                  onDrop={() => gameStarted && handleDrop(square)}
                  disabled={!gameStarted}
                  className={`
                    relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                    ${bgColor}
                    transition-colors duration-150
                    ${isCheck ? 'animate-pulse ring-4 ring-red-500' : ''}
                    ${gameStarted ? 'hover:brightness-110' : 'cursor-not-allowed opacity-50'}
                  `}
                >
                  {piece && (
                    <div
                      draggable
                      onDragStart={() => handleDragStart(square)}
                      className="text-4xl sm:text-5xl md:text-6xl cursor-grab active:cursor-grabbing select-none"
                    >
                      {PIECE_SYMBOLS[`${piece.color}${piece.type}`]}
                    </div>
                  )}

                  {legalMove && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {legalMove.castleType ? (
                        <Castle className="w-6 h-6 text-blue-600 opacity-60" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-neutral-600 opacity-40" />
                      )}
                    </div>
                  )}

                  {legalMove && piece && (
                    <div className="absolute inset-0 border-4 border-red-500 opacity-50 pointer-events-none" />
                  )}

                  {isCorridor && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Zap className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
