import { Copy, RotateCcw, Flag, HandshakeIcon, Plus } from 'lucide-react';

interface GameControlsProps {
  roomId: string;
  activeColor: 'w' | 'b';
  playerColor: 'w' | 'b' | null;
  onNewGame: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onFlipBoard: () => void;
  flipped: boolean;
  onCopy?: () => void;
}

export default function GameControls({
  roomId,
  activeColor,
  playerColor,
  onNewGame,
  onResign,
  onOfferDraw,
  onFlipBoard,
  flipped,
  onCopy,
}: GameControlsProps) {
  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    if (onCopy) onCopy();
  };

  const isPlayerTurn = playerColor === activeColor;

  return (
    <div className="bg-emerald-900/20 backdrop-blur rounded-2xl border border-emerald-700/30 shadow-xl p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-emerald-50 mb-2">Код комнаты</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomId}
            readOnly
            className="flex-1 px-3 py-2 bg-emerald-900/30 border border-emerald-700/30 rounded text-sm font-mono text-emerald-50"
          />
          <button
            onClick={copyRoomLink}
            className="px-3 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded transition-colors"
            title="Копировать ссылку"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-4 h-4 rounded-full ${
              activeColor === 'w' ? 'bg-gray-200 dark:bg-gray-300 border-2 border-gray-800 dark:border-gray-600' : 'bg-gray-800 dark:bg-gray-600'
            }`}
          />
          <span className="text-sm font-semibold text-emerald-50">
            Ход: {activeColor === 'w' ? 'Белые' : 'Чёрные'}
          </span>
        </div>
        {playerColor && (
          <p className="text-xs text-emerald-200/70">
            Вы играете: {playerColor === 'w' ? 'Белые' : 'Чёрные'}
            {isPlayerTurn && ' (ваш ход)'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onFlipBoard}
          className="w-full px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Перевернуть доску
        </button>

        <button
          onClick={onNewGame}
          className="w-full px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новая игра
        </button>

        <button
          onClick={onOfferDraw}
          disabled={!playerColor}
          className="w-full px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <HandshakeIcon className="w-4 h-4" />
          Предложить ничью
        </button>

        <button
          onClick={onResign}
          disabled={!playerColor}
          className="w-full px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Flag className="w-4 h-4" />
          Сдаться
        </button>
      </div>
    </div>
  );
}
