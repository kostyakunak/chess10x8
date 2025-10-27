import { useState } from 'react';
import { Users } from 'lucide-react';

interface JoinRoomProps {
  onJoin: (roomId: string) => void;
  onCreateNew: () => void;
}

export default function JoinRoom({ onJoin, onCreateNew }: JoinRoomProps) {
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoin(roomId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Шахматы 10×8
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Онлайн игра с реальным временем
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Код комнаты
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите код комнаты"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!roomId.trim()}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Users className="w-5 h-5" />
            Присоединиться к игре
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">или</span>
            </div>
          </div>

          <button
            onClick={onCreateNew}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
          >
            Создать новую комнату
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
          Получите код комнаты от друга и введите его выше для совместной игры
        </p>
      </div>
    </div>
  );
}

