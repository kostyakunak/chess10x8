import { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import MoveHistory from './components/MoveHistory';
import GameControls from './components/GameControls';
import PromotionModal from './components/PromotionModal';
import JoinRoom from './components/JoinRoom';
import { useChessGame } from './hooks/useChessGame';

function App() {
  const [flipped, setFlipped] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    console.log('🌐 URL params parsed:', { room, fullUrl: window.location.href });
    if (room) {
      console.log('✅ Room ID found in URL:', room);
      setRoomId(room);
    } else {
      console.log('ℹ️ No room ID in URL - will show join screen');
    }
  }, []);

  const {
    position,
    activeColor,
    history,
    selectedSquare,
    legalMoves,
    kingInCheck,
    lastMove,
    status,
    gameStarted,
    playerColor,
    currentRoomId,
    promotionPending,
    handleSquareClick,
    handlePromotion,
    handleResign,
    handleOfferDraw,
    createNewGame,
  } = useChessGame(roomId);

  const handleJoinRoom = (id: string) => {
    console.log('🎮 handleJoinRoom called with ID:', id);
    setRoomId(id);
    const newUrl = `${window.location.origin}?room=${id}`;
    console.log('📍 Updating URL to:', newUrl);
    window.history.pushState({}, '', newUrl);
  };

  const handleCreateNew = () => {
    console.log('🆕 handleCreateNew called');
    createNewGame();
  };

  // Показываем экран подключения только если нет roomId в URL
  console.log('🎨 App render state:', { roomId, currentRoomId });
  
  if (!roomId && !currentRoomId) {
    console.log('📝 Showing JoinRoom screen');
    return <JoinRoom onJoin={handleJoinRoom} onCreateNew={handleCreateNew} />;
  }

  // Не показываем JoinRoom если есть ID комнаты (идет загрузка или уже загружено)
  const isLoading = !currentRoomId && roomId;
  
  console.log('🔄 Loading state:', { isLoading, roomId, currentRoomId });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Загрузка игры...</h2>
          <p className="text-slate-400">Подключение к комнате</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Шахматы 10×8
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Расширенный вариант с коридорами A и J
          </p>
        </header>

        {status === 'checkmate' && (
          <div className="mb-4 p-4 bg-red-600 text-white rounded-lg text-center font-bold">
            Мат! Победа: {activeColor === 'w' ? 'Чёрные' : 'Белые'}
          </div>
        )}

        {status === 'stalemate' && (
          <div className="mb-4 p-4 bg-amber-600 text-white rounded-lg text-center font-bold">
            Пат! Ничья
          </div>
        )}

        {status === 'resigned' && (
          <div className="mb-4 p-4 bg-neutral-600 text-white rounded-lg text-center font-bold">
            Игрок сдался
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="flex-shrink-0 flex justify-center">
            <ChessBoard
              position={position}
              legalMoves={legalMoves}
              selectedSquare={selectedSquare}
              lastMove={lastMove}
              kingInCheck={kingInCheck}
              onSquareClick={handleSquareClick}
              flipped={flipped}
              gameStarted={gameStarted}
            />
          </div>

          <div className="flex-1 max-w-md space-y-4">
            <GameControls
              roomId={currentRoomId || ''}
              activeColor={activeColor}
              playerColor={playerColor}
              onNewGame={createNewGame}
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onFlipBoard={() => setFlipped(!flipped)}
              flipped={flipped}
            />

            <MoveHistory moves={history} />
          </div>
        </div>
      </div>

      {promotionPending && (
        <PromotionModal
          color={activeColor === 'w' ? 'b' : 'w'}
          onSelect={handlePromotion}
        />
      )}
    </div>
  );
}

export default App;
