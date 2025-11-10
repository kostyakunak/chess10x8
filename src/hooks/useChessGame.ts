import { useState, useEffect, useCallback } from 'react';
import { getRoom, createRoom, updateRoom, getMoves, addMove, wsManager, GameRoom, GameMove } from '../lib/api';
import { Position, Move, Square, PieceColor, PieceType, LegalMove } from '../types/chess';
import { getInitialPosition, parseFEN, generateFEN } from '../engine/board';
import { getLegalMoves, makeMove, isInCheck, hasLegalMoves } from '../engine/moves';
import { moveToSAN, updateCastlingRights, getEnPassantSquare } from '../engine/notation';

export function useChessGame(roomId: string | null) {
  const [position, setPosition] = useState<Position>(getInitialPosition());
  const [activeColor, setActiveColor] = useState<PieceColor>('w');
  const [castlingRights, setCastlingRights] = useState('KQkq');
  const [enPassant, setEnPassant] = useState('-');
  const [halfmoveClock, setHalfmoveClock] = useState(0);
  const [fullmoveNumber, setFullmoveNumber] = useState(1);
  const [history, setHistory] = useState<Move[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [kingInCheck, setKingInCheck] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [status, setStatus] = useState<'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned'>('active');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(roomId);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const [playerId] = useState(() => `player_${Math.random().toString(36).substr(2, 9)}`);
  
  // Для версионирования: отслеживаем последний applied updated_at
  const [lastAppliedUpdate, setLastAppliedUpdate] = useState<string | null>(null);

  const findKingSquare = useCallback((pos: Position, color: PieceColor): Square | null => {
    for (const square in pos) {
      const piece = pos[square];
      if (piece.type === 'K' && piece.color === color) {
        return square;
      }
    }
    return null;
  }, []);

  const loadGameState = useCallback(async (roomId: string) => {
    console.log('🔄 loadGameState called for room:', roomId);
    try {
      const room = await getRoom(roomId);

      console.log('📊 Room data:', { room });
      if (!room) {
        console.error('❌ Room not found');
        return;
      }

      // Версионирование: игнорируем старые обновления
      if (lastAppliedUpdate && room.updated_at && room.updated_at <= lastAppliedUpdate) {
        console.log('⏭️ Skipping outdated update:', room.updated_at, '<=', lastAppliedUpdate);
        return;
      }
      
      console.log('✅ Applying update:', room.updated_at);
      setLastAppliedUpdate(room.updated_at);

      const moves = await getMoves(roomId);

      const fenData = parseFEN(room.fen);
      setPosition(fenData.position);
      setActiveColor(fenData.activeColor as PieceColor);
      setCastlingRights(fenData.castlingRights);
      setEnPassant(fenData.enPassant);
      setHalfmoveClock(fenData.halfmoveClock);
      setFullmoveNumber(fenData.fullmoveNumber);
      setStatus(room.status);
      setGameStarted(room.game_started);

      console.log('📍 Position loaded:', fenData.position);
      console.log('📊 History loaded:', moves?.length || 0, 'moves');
      
      if (moves) {
        const moveHistory: Move[] = moves.map(m => ({
          from: m.from_square,
          to: m.to_square,
          piece: m.piece as PieceType,
          color: m.color as PieceColor,
          captured: m.captured_piece as PieceType | undefined,
          promotion: m.promotion as PieceType | undefined,
          castleType: m.castle_type as 'short' | 'long' | undefined,
          isEnPassant: m.is_en_passant,
          isCheck: m.is_check,
          isCheckmate: m.is_checkmate,
          san: m.san,
        }));
        setHistory(moveHistory);
        console.log('✅ History set:', moveHistory);

        if (moveHistory.length > 0) {
          const lastM = moveHistory[moveHistory.length - 1];
          setLastMove({ from: lastM.from, to: lastM.to });
          console.log('🎯 Last move:', lastM);
        }
      }

      console.log('👤 Player assignment', {
        playerId,
        whitePlayer: room.white_player_id,
        blackPlayer: room.black_player_id,
        isGameStarted: room.game_started
      });

      // Умный merge: не затираем playerColor если он уже установлен
      if (room.white_player_id === playerId) {
        if (playerColor !== 'w') {
          console.log('✅ Player is white (setting)');
          setPlayerColor('w');
        }
        console.log('✅ White player: gameStarted =', room.game_started);
      } else if (room.black_player_id === playerId) {
        if (playerColor !== 'b') {
          console.log('✅ Player is black (setting)');
          setPlayerColor('b');
        }
        console.log('✅ Black player: gameStarted =', room.game_started);
      } else {
        if (!room.white_player_id) {
          console.log('🤍 Assigning player as white (first player)');
          setPlayerColor('w');
          await updateRoom(roomId, { white_player_id: playerId });
          console.log('🤍 Updated white_player_id');
          setGameStarted(false);
          setStatus('waiting');
          console.log('🤍 Game started set to: false, status: waiting');
        } else if (!room.black_player_id) {
          console.log('⚫ Assigning player as black (second player)');
          setPlayerColor('b');
          await updateRoom(roomId, {
            black_player_id: playerId,
            game_started: true,
            status: 'active'
          });
          console.log('⚫ Updated black_player_id and gameStarted');
          // Всегда устанавливаем gameStarted=true когда черный игрок присоединяется
          setGameStarted(true);
          setStatus('active');
          console.log('🎮 Game started! setGameStarted(true) called');
        }
      }
      
      console.log('✅ loadGameState completed for player:', playerId);

      if (isInCheck(fenData.position, fenData.activeColor as PieceColor)) {
        const kingSquare = findKingSquare(fenData.position, fenData.activeColor as PieceColor);
        setKingInCheck(kingSquare);
      } else {
        setKingInCheck(null);
      }
    } catch (error) {
      console.error('❌ Error loading game state:', error);
    }
  }, [playerId, findKingSquare, lastAppliedUpdate, playerColor]);

  const createNewGame = useCallback(async () => {
    console.log('🎯 createNewGame called');
    const initialPosition = getInitialPosition();
    const fen = generateFEN(initialPosition, 'w', 'KQkq', '-', 0, 1);

    console.log('📤 Creating room in database...');
    try {
      const data = await createRoom({
        fen,
        active_color: 'w',
        castling_rights: 'KQkq',
        en_passant: '-',
        halfmove_clock: 0,
        fullmove_number: 1,
        status: 'waiting',
        game_started: false,
        white_player_id: playerId,
      });

      console.log('✅ Room created with ID:', data.id);

    setCurrentRoomId(data.id);
    setPosition(initialPosition);
    setActiveColor('w');
    setCastlingRights('KQkq');
    setEnPassant('-');
    setHalfmoveClock(0);
    setFullmoveNumber(1);
    setHistory([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setKingInCheck(null);
    setLastMove(null);
    setStatus('waiting');
    setGameStarted(false);
    setPlayerColor('w');

    const newUrl = `${window.location.origin}?room=${data.id}`;
    window.history.pushState({}, '', newUrl);
    } catch (error) {
      console.error('❌ Error creating game:', error);
    }
  }, [playerId]);

  const executeMove = useCallback(async (from: Square, to: Square, promotion?: PieceType) => {
    const piece = position[from];
    if (!piece) return;

    const move = legalMoves.find(m => m.to === to);
    if (!move) return;

    const newPosition = makeMove(position, from, to, promotion || move.promotion ? promotion : undefined, move.castleType);

    const allLegalMoves: { from: Square; to: Square }[] = [];
    for (const sq in position) {
      if (position[sq]?.color === activeColor) {
        const moves = getLegalMoves(position, sq, activeColor, castlingRights, enPassant);
        moves.forEach(m => allLegalMoves.push({ from: sq, to: m.to }));
      }
    }

    const isCheck = isInCheck(newPosition, activeColor === 'w' ? 'b' : 'w');
    const isCheckmate = isCheck && !hasLegalMoves(newPosition, activeColor === 'w' ? 'b' : 'w', castlingRights, enPassant);

    const moveRecord: Move = {
      from,
      to,
      piece: piece.type,
      color: piece.color,
      captured: move.captured,
      promotion: promotion,
      castleType: move.castleType,
      isEnPassant: move.isEnPassant,
      isCheck,
      isCheckmate,
      san: '',
    };

    moveRecord.san = moveToSAN(moveRecord, position, allLegalMoves);

    const newCastlingRights = updateCastlingRights(castlingRights, from, piece.type, piece.color);
    const newEnPassant = getEnPassantSquare(from, to, piece.type, piece.color);
    const newHalfmove = piece.type === 'P' || move.captured ? 0 : halfmoveClock + 1;
    const newFullmove = activeColor === 'b' ? fullmoveNumber + 1 : fullmoveNumber;
    const newActiveColor: PieceColor = activeColor === 'w' ? 'b' : 'w';

    const fen = generateFEN(newPosition, newActiveColor, newCastlingRights, newEnPassant, newHalfmove, newFullmove);

    if (currentRoomId) {
      await updateRoom(currentRoomId, {
        fen,
        active_color: newActiveColor,
        castling_rights: newCastlingRights,
        en_passant: newEnPassant,
        halfmove_clock: newHalfmove,
        fullmove_number: newFullmove,
        status: isCheckmate ? 'checkmate' : 'active',
        winner: isCheckmate ? (activeColor === 'w' ? 'white' : 'black') : null,
      });

      await addMove(currentRoomId, {
        move_number: history.length + 1,
        color: piece.color,
        from_square: from,
        to_square: to,
        piece: piece.type,
        promotion: promotion || null,
        castle_type: move.castleType || null,
        captured_piece: move.captured || null,
        is_en_passant: move.isEnPassant || false,
        is_check: isCheck,
        is_checkmate: isCheckmate,
        san: moveRecord.san,
      });
    }

    setPosition(newPosition);
    setActiveColor(newActiveColor);
    setCastlingRights(newCastlingRights);
    setEnPassant(newEnPassant);
    setHalfmoveClock(newHalfmove);
    setFullmoveNumber(newFullmove);
    setHistory([...history, moveRecord]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove({ from, to });

    if (isCheckmate) {
      setStatus('checkmate');
    }

    if (isCheck) {
      const kingSquare = findKingSquare(newPosition, newActiveColor);
      setKingInCheck(kingSquare);
    } else {
      setKingInCheck(null);
    }
  }, [position, activeColor, castlingRights, enPassant, halfmoveClock, fullmoveNumber, history, legalMoves, currentRoomId, findKingSquare]);

  const handleSquareClick = useCallback((square: Square) => {
    console.log('🖱️ Square clicked:', square);
    console.log('🔒 Click check:', { gameStarted, playerColor, activeColor, promotionPending });
    
    if (promotionPending) {
      console.log('⏸️ Promotion pending, ignoring click');
      return;
    }

    if (!gameStarted || !playerColor || playerColor !== activeColor) {
      console.log('❌ Click blocked:', { 
        gameStarted: !gameStarted, 
        noPlayerColor: !playerColor, 
        notYourTurn: playerColor !== activeColor 
      });
      return;
    }
    
    console.log('✅ Click allowed');

    if (selectedSquare) {
      const move = legalMoves.find(m => m.to === square);
      if (move) {
        if (move.promotion) {
          setPromotionPending({ from: selectedSquare, to: square });
        } else {
          executeMove(selectedSquare, square);
        }
      } else {
        const piece = position[square];
        if (piece && piece.color === activeColor) {
          setSelectedSquare(square);
          const moves = getLegalMoves(position, square, activeColor, castlingRights, enPassant);
          setLegalMoves(moves);
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      }
    } else {
      const piece = position[square];
      if (piece && piece.color === activeColor) {
        setSelectedSquare(square);
        const moves = getLegalMoves(position, square, activeColor, castlingRights, enPassant);
        setLegalMoves(moves);
      }
    }
  }, [selectedSquare, legalMoves, position, activeColor, castlingRights, enPassant, playerColor, promotionPending, executeMove]);

  const handlePromotion = useCallback((piece: PieceType) => {
    if (promotionPending) {
      executeMove(promotionPending.from, promotionPending.to, piece);
      setPromotionPending(null);
    }
  }, [promotionPending, executeMove]);

  const handleResign = useCallback(async () => {
    if (!currentRoomId || !playerColor) return;

    await updateRoom(currentRoomId, {
      status: 'resigned',
      winner: playerColor === 'w' ? 'black' : 'white',
    });

    setStatus('resigned');
  }, [currentRoomId, playerColor]);

  const handleOfferDraw = useCallback(() => {
    alert('Ничья предложена (функция в разработке)');
  }, []);

  const handleRookTeleport = useCallback(async (fromSquare: Square, toSquare: Square) => {
    const myRook = position[fromSquare];
    const enemyRook = position[toSquare];
    if (!myRook || !enemyRook || myRook.type !== 'R' || enemyRook.type !== 'R') return;
    if (myRook.color === enemyRook.color) return;

    const newPosition = { ...position };
    newPosition[fromSquare] = enemyRook;
    newPosition[toSquare] = myRook;

    const moveRecord: Move = {
      from: fromSquare,
      to: toSquare,
      piece: 'R',
      color: myRook.color,
      castleType: 'force',
      san: 'O-O',
      isCheck: false,
      isCheckmate: false,
    };

    const newActiveColor: PieceColor = activeColor === 'w' ? 'b' : 'w';
    const fen = generateFEN(newPosition, newActiveColor, castlingRights, enPassant, halfmoveClock, fullmoveNumber);

    if (currentRoomId) {
      await updateRoom(currentRoomId, {
        fen,
        active_color: newActiveColor,
      });

      await addMove(currentRoomId, {
        move_number: history.length + 1,
        color: myRook.color,
        from_square: fromSquare,
        to_square: toSquare,
        piece: 'R',
        castle_type: 'force',
        san: 'O-O',
        is_check: false,
        is_checkmate: false,
      });
    }

    setPosition(newPosition);
    setActiveColor(newActiveColor);
    setHistory([...history, moveRecord]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove({ from: fromSquare, to: toSquare });
  }, [position, activeColor, castlingRights, enPassant, halfmoveClock, fullmoveNumber, history, currentRoomId]);

  useEffect(() => {
    console.log('🔍 useChessGame useEffect triggered', { roomId, currentRoomId });
    
    if (roomId && roomId !== currentRoomId) {
      console.log('📥 Loading existing room:', roomId);
      setCurrentRoomId(roomId);
      loadGameState(roomId);
    }
    // УБРАНО: автоматическое создание игры
    // Теперь createNewGame вызывается только когда пользователь явно нажимает кнопку
  }, [roomId, currentRoomId]);

  // Логируем состояние после обновления
  useEffect(() => {
    console.log('📊 State updated:', { 
      playerColor, 
      gameStarted, 
      status, 
      playerId,
      activeColor
    });
  }, [playerColor, gameStarted, status, activeColor, playerId]);

  // Handle external teleport animation (from opponent via WebSocket)
  const [externalTeleport, setExternalTeleport] = useState<{ from: Square; to: Square } | null>(null);

  // WebSocket subscription for realtime updates
  useEffect(() => {
    if (!currentRoomId) return;

    console.log('🔔 Setting up WebSocket connection for room:', currentRoomId);
    wsManager.connect(currentRoomId);

    // Subscribe to room updates
    const unsubscribeRoom = wsManager.on('room_updated', (message) => {
      console.log('🔔 Room updated via WebSocket:', message);
      loadGameState(currentRoomId);
    });

    // Subscribe to move additions
    const unsubscribeMove = wsManager.on('move_added', (message) => {
      console.log('🔔 Move added via WebSocket:', message);
      loadGameState(currentRoomId);
    });

    // Subscribe to teleport moves - trigger animation for opponent
    const unsubscribeTeleport = wsManager.on('teleport_move', (message) => {
      console.log('🔔 Teleport move via WebSocket:', message);
      // Trigger teleport animation
      setExternalTeleport({ from: message.from_square, to: message.to_square });
      // Clear after animation
      setTimeout(() => setExternalTeleport(null), 1100);
      // Also update game state
      loadGameState(currentRoomId);
    });

    // Polling fallback if WebSocket is not connected
    let pollInterval: NodeJS.Timeout | null = null;
    
    const checkConnection = () => {
      if (!wsManager.isConnected()) {
        console.log('⚠️ WebSocket not connected, activating polling');
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            console.log('🔄 Polling: checking for updates...');
            loadGameState(currentRoomId);
          }, 3000);
        }
      } else if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        console.log('✅ WebSocket connected, stopping polling');
      }
    };

    // Check connection immediately and periodically
    checkConnection();
    const connectionCheckInterval = setInterval(checkConnection, 5000);

    return () => {
      console.log('🔕 Cleaning up WebSocket connection for room:', currentRoomId);
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(connectionCheckInterval);
      unsubscribeRoom();
      unsubscribeMove();
      unsubscribeTeleport();
      wsManager.disconnect();
    };
  }, [currentRoomId, loadGameState]);

  return {
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
  };
}
