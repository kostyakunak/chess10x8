import { useState, useEffect } from 'react';
import { Position, Square, LegalMove, PieceType, CheatState } from '../types/chess';
import { FILES, RANKS } from '../engine/board';
import { King, Crown, Castle, Zap } from 'lucide-react';
import ChessPiece from './ChessPiece';

interface ChessBoardProps {
  position: Position;
  legalMoves: LegalMove[];
  selectedSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
  kingInCheck: Square | null;
  onSquareClick: (square: Square) => void;
  flipped?: boolean;
  gameStarted: boolean;
  onRookTeleport?: (fromSquare: Square, toSquare: Square) => void;
  playerColor: 'w' | 'b' | null;
  status: string;
}

// Удалено: больше не используем Unicode символы

export default function ChessBoard({
  position,
  legalMoves,
  selectedSquare,
  lastMove,
  kingInCheck,
  onSquareClick,
  flipped = false,
  gameStarted,
  onRookTeleport,
  playerColor,
  status,
}: ChessBoardProps) {
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [cheatState, setCheatState] = useState<CheatState>({
    rookBlinkAvailable: true,
    selectedRook: null,
    tapCount: 0,
    lastTapTime: 0,
  });
  const [teleporting, setTeleporting] = useState(false);
  const [blinkingSquare, setBlinkingSquare] = useState<Square | null>(null);

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

  const handleRookClick = (square: Square) => {
    const piece = position[square];
    if (!piece || piece.type !== 'R' || !cheatState.rookBlinkAvailable) return;
    if (!gameStarted || !playerColor || piece.color !== playerColor) return;

    const now = Date.now();
    const timeSinceLastTap = now - cheatState.lastTapTime;

    if (timeSinceLastTap > 500) {
      setCheatState({ ...cheatState, tapCount: 1, lastTapTime: now });
    } else if (cheatState.tapCount === 1) {
      setCheatState({ ...cheatState, tapCount: 2, lastTapTime: now });
    } else if (cheatState.tapCount === 2) {
      setBlinkingSquare(square);
      setTimeout(() => setBlinkingSquare(null), 1000);
      setCheatState({
        ...cheatState,
        selectedRook: square,
        tapCount: 0,
        lastTapTime: 0,
      });
    }
  };

  const handleEnemyRookClick = (square: Square) => {
    const piece = position[square];
    if (!piece || piece.type !== 'R' || !cheatState.selectedRook) return;
    if (!gameStarted || !playerColor || piece.color === playerColor) return;

    if (onRookTeleport) {
      setTeleporting(true);
      onRookTeleport(cheatState.selectedRook, square);
      setCheatState({
        rookBlinkAvailable: false,
        selectedRook: null,
        tapCount: 0,
        lastTapTime: 0,
      });
      setTimeout(() => setTeleporting(false), 1000);
    }
  };

  useEffect(() => {
    if (cheatState.tapCount > 0) {
      const timeout = setTimeout(() => {
        setCheatState({ ...cheatState, tapCount: 0 });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [cheatState]);

  return (
    <div className="relative">
      {status === 'checkmate' && (
        <>
          <div
            className="absolute top-0 left-0 right-0 z-20 flex justify-center"
            style={{
              transform: flipped ? 'rotate(180deg)' : 'none',
              transformOrigin: 'center',
            }}
          >
            <div className="comic-defeat">ПРОИГРАЛ</div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex justify-center"
            style={{
              transform: flipped ? 'none' : 'rotate(180deg)',
              transformOrigin: 'center',
            }}
          >
            <div className="comic-defeat">ПРОИГРАЛ</div>
          </div>
        </>
      )}
    <div className={`inline-block bg-stone-800 p-6 rounded-xl shadow-2xl relative border-4 border-amber-900/50 ${teleporting ? 'board-teleporting' : ''}`}>
      {!gameStarted && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
          <div className="text-amber-100 text-center">
            <div className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Ожидание второго игрока...</div>
            <div className="text-base italic">Игра начнётся как только присоединится второй игрок</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-11 gap-0">
        <div />
        {files.map(file => (
          <div
            key={file}
            className="h-6 flex items-center justify-center text-sm font-medium text-amber-200"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {file}
          </div>
        ))}

        {ranks.map((rank, rankIdx) => (
          <>
            <div
              key={`rank-${rank}`}
              className="w-6 flex items-center justify-center text-sm font-medium text-amber-200"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
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

              let bgColor = isDark ? 'bg-amber-800' : 'bg-stone-200';

              if (isCorridor) {
                bgColor = isDark ? 'bg-amber-900/70' : 'bg-stone-300/70';
              }

              if (isSelected) {
                bgColor = 'bg-yellow-500';
              } else if (isHighlight) {
                bgColor = isDark ? 'bg-amber-700' : 'bg-amber-300';
              }

              const isBlinking = blinkingSquare === square;
              const isTeleportingPiece = teleporting && (cheatState.selectedRook === square || position[square]?.type === 'R');

              return (
                <button
                  key={square}
                  onClick={() => {
                    if (!gameStarted) return;
                    const piece = position[square];
                    if (piece && piece.type === 'R') {
                      if (piece.color === playerColor && cheatState.rookBlinkAvailable) {
                        handleRookClick(square);
                      } else if (piece.color !== playerColor && cheatState.selectedRook) {
                        handleEnemyRookClick(square);
                        return;
                      }
                    }
                    onSquareClick(square);
                  }}
                  onDragOver={gameStarted ? handleDragOver : undefined}
                  onDrop={() => gameStarted && handleDrop(square)}
                  disabled={!gameStarted}
                  className={`
                    relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                    ${bgColor}
                    transition-all duration-200
                    ${isCheck ? 'animate-pulse ring-4 ring-red-500' : ''}
                    ${gameStarted ? 'hover:brightness-110' : 'cursor-not-allowed opacity-50'}
                    ${isBlinking ? 'teleport-active' : ''}
                  `}
                >
                  {piece && (
                    <div
                      draggable
                      onDragStart={() => handleDragStart(square)}
                      className={`cursor-grab active:cursor-grabbing select-none ${isTeleportingPiece ? 'piece-teleporting' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        filter: isTeleportingPiece ? 'drop-shadow(0 0 15px #8b5cf6)' : 'none',
                      }}
                    >
                      <ChessPiece 
                        color={piece.color} 
                        type={piece.type}
                      />
                    </div>
                  )}

                  {legalMove && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {legalMove.castleType ? (
                        <Castle className="w-6 h-6 text-amber-700 opacity-60" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-stone-700 opacity-50" />
                      )}
                    </div>
                  )}

                  {legalMove && piece && (
                    <div className="absolute inset-0 border-4 border-red-500 opacity-50 pointer-events-none" />
                  )}

                  {isCorridor && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-15">
                      <Zap className="w-4 h-4 text-amber-700" />
                    </div>
                  )}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </div>
    </div>
  );
}
