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
    <div className="bg-emerald-900/20 backdrop-blur rounded-2xl border border-emerald-700/30 shadow-xl p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold mb-3 text-emerald-50">История ходов</h3>
      {movePairs.length === 0 ? (
        <p className="text-emerald-200/70 text-sm">Ходов пока нет</p>
      ) : (
        <div className="space-y-1">
          {movePairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-emerald-200/70 w-8">{pair.number}.</span>
              {pair.white && (
                <button
                  onClick={() => onMoveClick?.(idx * 2)}
                  className="flex-1 text-left px-2 py-1 hover:bg-emerald-900/40 rounded transition-colors text-emerald-50"
                >
                  {pair.white.san}
                </button>
              )}
              {pair.black && (
                <button
                  onClick={() => onMoveClick?.(idx * 2 + 1)}
                  className="flex-1 text-left px-2 py-1 hover:bg-emerald-900/40 rounded transition-colors text-emerald-50"
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
