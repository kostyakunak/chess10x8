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
}: GameControlsProps) {
  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
  };

  const isPlayerTurn = playerColor === activeColor;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Код комнаты</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomId}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono"
          />
          <button
            onClick={copyRoomLink}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
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
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Ход: {activeColor === 'w' ? 'Белые' : 'Чёрные'}
          </span>
        </div>
        {playerColor && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Вы играете: {playerColor === 'w' ? 'Белые' : 'Чёрные'}
            {isPlayerTurn && ' (ваш ход)'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onFlipBoard}
          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Перевернуть доску
        </button>

        <button
          onClick={onNewGame}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новая игра
        </button>

        <button
          onClick={onOfferDraw}
          disabled={!playerColor}
          className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
        >
          <HandshakeIcon className="w-4 h-4" />
          Предложить ничью
        </button>

        <button
          onClick={onResign}
          disabled={!playerColor}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
        >
          <Flag className="w-4 h-4" />
          Сдаться
        </button>
      </div>
    </div>
  );
}
