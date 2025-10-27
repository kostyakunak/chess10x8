import { useState, useEffect, useCallback } from 'react';
import { supabase, GameRoom, GameMove } from '../lib/supabase';
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
    const { data: room, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();

    console.log('📊 Room data:', { room, error });
    if (error || !room) {
      console.error('❌ Error loading room or room not found:', error);
      return;
    }

    const { data: moves } = await supabase
      .from('game_moves')
      .select('*')
      .eq('room_id', roomId)
      .order('move_number', { ascending: true });

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

    if (room.white_player_id === playerId) {
      console.log('✅ Player is white');
      setPlayerColor('w');
      setGameStarted(room.game_started || false);
      setStatus(room.status as any);
      console.log('✅ White player: gameStarted =', room.game_started);
    } else if (room.black_player_id === playerId) {
      console.log('✅ Player is black');
      setPlayerColor('b');
      setGameStarted(room.game_started || false);
      setStatus(room.status as any);
      console.log('✅ Black player: gameStarted =', room.game_started);
    } else {
      if (!room.white_player_id) {
        console.log('🤍 Assigning player as white (first player)');
        setPlayerColor('w');
        const result = await supabase
          .from('game_rooms')
          .update({ white_player_id: playerId })
          .eq('id', roomId);
        console.log('🤍 Updated white_player_id:', result);
        setGameStarted(false);
        setStatus('waiting');
        console.log('🤍 Game started set to: false, status: waiting');
      } else if (!room.black_player_id) {
        console.log('⚫ Assigning player as black (second player)');
        setPlayerColor('b');
        let gameStartedUpdate = false;
        if (!room.game_started) {
          gameStartedUpdate = true;
        }
        const result = await supabase
          .from('game_rooms')
          .update({
            black_player_id: playerId,
            game_started: true,
            status: 'active'
          })
          .eq('id', roomId);
        console.log('⚫ Updated black_player_id and gameStarted:', result);
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
  }, [playerId, findKingSquare]);

  const createNewGame = useCallback(async () => {
    console.log('🎯 createNewGame called');
    const initialPosition = getInitialPosition();
    const fen = generateFEN(initialPosition, 'w', 'KQkq', '-', 0, 1);

    console.log('📤 Creating room in database...');
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        fen,
        active_color: 'w',
        castling_rights: 'KQkq',
        en_passant: '-',
        halfmove_clock: 0,
        fullmove_number: 1,
        status: 'waiting',
        game_started: false,
        white_player_id: playerId,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('❌ Error creating game:', error);
      return;
    }

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
      await supabase
        .from('game_rooms')
        .update({
          fen,
          active_color: newActiveColor,
          castling_rights: newCastlingRights,
          en_passant: newEnPassant,
          halfmove_clock: newHalfmove,
          fullmove_number: newFullmove,
          status: isCheckmate ? 'checkmate' : 'active',
          winner: isCheckmate ? (activeColor === 'w' ? 'white' : 'black') : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRoomId);

      await supabase
        .from('game_moves')
        .insert({
          room_id: currentRoomId,
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

    await supabase
      .from('game_rooms')
      .update({
        status: 'resigned',
        winner: playerColor === 'w' ? 'black' : 'white',
      })
      .eq('id', currentRoomId);

    setStatus('resigned');
  }, [currentRoomId, playerColor]);

  const handleOfferDraw = useCallback(() => {
    alert('Ничья предложена (функция в разработке)');
  }, []);

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

  useEffect(() => {
    if (!currentRoomId) return;

    console.log('🔔 Setting up realtime subscription for room:', currentRoomId);

    const channel = supabase
      .channel(`room:${currentRoomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${currentRoomId}`,
      }, (payload) => {
        console.log('🔔 Realtime UPDATE received for game_rooms:', payload);
        loadGameState(currentRoomId);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_moves',
        filter: `room_id=eq.${currentRoomId}`,
      }, (payload) => {
        console.log('🔔 Realtime INSERT received for game_moves:', payload);
        loadGameState(currentRoomId);
      })
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    // Polling fallback - обновляем каждые 3 секунды
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling: checking for updates...');
      loadGameState(currentRoomId);
    }, 3000);

    return () => {
      console.log('🔕 Cleaning up subscription and polling for room:', currentRoomId);
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
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
  };
}
