import { Move } from '../types/chess';

interface MoveHistoryProps {
  moves: Move[];
  onMoveClick?: (index: number) => void;
}

export default function MoveHistory({ moves, onMoveClick }: MoveHistoryProps) {
  const movePairs: { white: Move | null; black: Move | null; number: number }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i] || null,
      black: moves[i + 1] || null,
    });
  }

  return (
    <div className="bg-stone-800/60 backdrop-blur rounded-2xl border border-amber-900/40 shadow-xl p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-amber-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>История ходов</h3>
      {movePairs.length === 0 ? (
        <p className="text-amber-200/70 text-sm italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Ходов пока нет</p>
      ) : (
        <div className="space-y-1">
          {movePairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              <span className="font-semibold text-amber-200/70 w-8">{pair.number}.</span>
              {pair.white && (
                <button
                  onClick={() => onMoveClick?.(idx * 2)}
                  className="flex-1 text-left px-2 py-1 hover:bg-stone-700/60 rounded transition-colors text-amber-100"
                >
                  {pair.white.san}
                </button>
              )}
              {pair.black && (
                <button
                  onClick={() => onMoveClick?.(idx * 2 + 1)}
                  className="flex-1 text-left px-2 py-1 hover:bg-stone-700/60 rounded transition-colors text-amber-100"
                >
                  {pair.black.san}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
