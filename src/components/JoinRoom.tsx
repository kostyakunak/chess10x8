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
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-800/80 backdrop-blur-sm border-2 border-amber-900/50 rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-semibold text-center text-amber-100 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Шахматы 10×8
        </h1>
        <p className="text-center text-amber-200/70 mb-8 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Онлайн игра с реальным временем
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-200 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Код комнаты
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите код комнаты"
              className="w-full px-4 py-3 bg-stone-900/60 border border-amber-900/40 rounded-lg text-amber-100 placeholder-amber-300/40 focus:outline-none focus:ring-2 focus:ring-amber-600"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!roomId.trim()}
            className="w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 disabled:cursor-not-allowed text-amber-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            <Users className="w-5 h-5" />
            Присоединиться к игре
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-900/40"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-stone-800/80 text-amber-200/70 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>или</span>
            </div>
          </div>

          <button
            onClick={onCreateNew}
            className="w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg transition-colors font-medium"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Создать новую комнату
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-amber-200/60 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Получите код комнаты от друга и введите его выше для совместной игры
        </p>
      </div>
    </div>
  );
}

