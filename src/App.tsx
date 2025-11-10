import { useState, useEffect } from 'react';
import ChessBoard from './components/ChessBoard';
import MoveHistory from './components/MoveHistory';
import GameControls from './components/GameControls';
import PromotionModal from './components/PromotionModal';
import JoinRoom from './components/JoinRoom';
import MusicPlayer from './components/MusicPlayer';
import { useChessGame } from './hooks/useChessGame';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

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
    handleRookTeleport,
    externalTeleport,
  } = useChessGame(roomId);

  // Автоматически переворачиваем доску для черных
  const flipped = playerColor === 'b';

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
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 flex items-center justify-center">
        <div className="text-center text-amber-100">
          <h2 className="text-3xl font-semibold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Загрузка игры...</h2>
          <p className="text-amber-200/70 italic">Подключение к комнате</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 p-4 md:p-8">
      <MusicPlayer />
      <div className="max-w-7xl mx-auto">
        {status === 'stalemate' && (
          <div className="mb-4 p-4 bg-amber-700 text-amber-50 rounded-lg text-center text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Пат! Ничья
          </div>
        )}

        {status === 'resigned' && (
          <div className="mb-4 p-4 bg-stone-700 text-amber-50 rounded-lg text-center text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Игрок сдался
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="flex justify-center w-full lg:w-auto">
            <div className="max-w-[min(90vw,820px)]">
              <ChessBoard
              position={position}
              legalMoves={legalMoves}
              selectedSquare={selectedSquare}
              lastMove={lastMove}
              kingInCheck={kingInCheck}
              onSquareClick={handleSquareClick}
              flipped={flipped}
              gameStarted={gameStarted}
              onRookTeleport={handleRookTeleport}
              playerColor={playerColor}
              status={status}
              externalTeleport={externalTeleport}
              currentRoomId={currentRoomId}
            />
            </div>
          </div>

          <div className="flex-1 max-w-md w-full space-y-4">
            <GameControls
              roomId={currentRoomId || ''}
              activeColor={activeColor}
              playerColor={playerColor}
              onNewGame={createNewGame}
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onFlipBoard={() => {/* No longer needed - auto flip */}}
              flipped={flipped}
              onCopy={() => {
                setShowCopiedToast(true);
                setTimeout(() => setShowCopiedToast(false), 2000);
              }}
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

      {/* Toast уведомление */}
      {showCopiedToast && (
        <div className="fixed bottom-4 right-4 bg-amber-700 text-amber-50 px-4 py-2 rounded-lg shadow-lg animate-fade-in" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          ✓ Ссылка скопирована!
        </div>
      )}
    </div>
  );
}

export default App;
