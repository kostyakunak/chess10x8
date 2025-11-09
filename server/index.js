import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// WebSocket connections map: roomId -> Set of WebSocket connections
const roomConnections = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) {
    ws.close(1008, 'Room ID required');
    return;
  }

  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Set());
  }
  roomConnections.get(roomId).add(ws);

  console.log(`WebSocket connected to room ${roomId}. Total connections: ${roomConnections.get(roomId).size}`);

  ws.on('close', () => {
    const connections = roomConnections.get(roomId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        roomConnections.delete(roomId);
      }
    }
    console.log(`WebSocket disconnected from room ${roomId}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all connections in a room
function broadcastToRoom(roomId, message) {
  const connections = roomConnections.get(roomId);
  if (connections) {
    const data = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });
  }
}

// API Routes

// Get game room
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await pool.query(
      'SELECT * FROM game_rooms WHERE id = $1',
      [roomId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game room
app.post('/api/rooms', async (req, res) => {
  try {
    const {
      fen,
      active_color = 'w',
      castling_rights = 'KQkq',
      en_passant = '-',
      halfmove_clock = 0,
      fullmove_number = 1,
      status = 'waiting',
      game_started = false,
      white_player_id,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO game_rooms (
        fen, active_color, castling_rights, en_passant,
        halfmove_clock, fullmove_number, status, game_started, white_player_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        fen,
        active_color,
        castling_rights,
        en_passant,
        halfmove_clock,
        fullmove_number,
        status,
        game_started,
        white_player_id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game room
app.patch('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [roomId, ...fields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE game_rooms SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Broadcast update to WebSocket clients
    broadcastToRoom(roomId, { type: 'room_updated', room: result.rows[0] });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get moves for a room
app.get('/api/rooms/:roomId/moves', async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await pool.query(
      'SELECT * FROM game_moves WHERE room_id = $1 ORDER BY move_number ASC',
      [roomId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching moves:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add move to a room
app.post('/api/rooms/:roomId/moves', async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      move_number,
      color,
      from_square,
      to_square,
      piece,
      promotion,
      castle_type,
      captured_piece,
      is_en_passant,
      is_check,
      is_checkmate,
      san,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO game_moves (
        room_id, move_number, color, from_square, to_square, piece,
        promotion, castle_type, captured_piece, is_en_passant,
        is_check, is_checkmate, san
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        roomId,
        move_number,
        color,
        from_square,
        to_square,
        piece,
        promotion || null,
        castle_type || null,
        captured_piece || null,
        is_en_passant || false,
        is_check || false,
        is_checkmate || false,
        san,
      ]
    );

    // Broadcast new move to WebSocket clients
    broadcastToRoom(roomId, { type: 'move_added', move: result.rows[0] });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding move:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

