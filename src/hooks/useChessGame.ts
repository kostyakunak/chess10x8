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
    const { data: room, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();

    if (error || !room) return;

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

      if (moveHistory.length > 0) {
        const lastM = moveHistory[moveHistory.length - 1];
        setLastMove({ from: lastM.from, to: lastM.to });
      }
    }

    if (room.white_player_id === playerId) {
      setPlayerColor('w');
    } else if (room.black_player_id === playerId) {
      setPlayerColor('b');
    } else {
      if (!room.white_player_id) {
        setPlayerColor('w');
        await supabase
          .from('game_rooms')
          .update({ white_player_id: playerId })
          .eq('id', roomId);
      } else if (!room.black_player_id) {
        setPlayerColor('b');
        let gameStartedUpdate = false;
        if (!room.game_started) {
          gameStartedUpdate = true;
        }
        await supabase
          .from('game_rooms')
          .update({
            black_player_id: playerId,
            game_started: true,
            status: 'active'
          })
          .eq('id', roomId);
        if (gameStartedUpdate) {
          setGameStarted(true);
          setStatus('active');
        }
      }
    }

    if (isInCheck(fenData.position, fenData.activeColor as PieceColor)) {
      const kingSquare = findKingSquare(fenData.position, fenData.activeColor as PieceColor);
      setKingInCheck(kingSquare);
    } else {
      setKingInCheck(null);
    }
  }, [playerId, findKingSquare]);

  const createNewGame = useCallback(async () => {
    const initialPosition = getInitialPosition();
    const fen = generateFEN(initialPosition, 'w', 'KQkq', '-', 0, 1);

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
      console.error('Error creating game:', error);
      return;
    }

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
    if (promotionPending) return;

    if (!gameStarted || !playerColor || playerColor !== activeColor) {
      return;
    }

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
    if (roomId) {
      setCurrentRoomId(roomId);
      loadGameState(roomId);
    } else {
      createNewGame();
    }
  }, []);

  useEffect(() => {
    if (!currentRoomId) return;

    const channel = supabase
      .channel(`room:${currentRoomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${currentRoomId}`,
      }, () => {
        loadGameState(currentRoomId);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_moves',
        filter: `room_id=eq.${currentRoomId}`,
      }, () => {
        loadGameState(currentRoomId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
