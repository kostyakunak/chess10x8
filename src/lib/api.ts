// API client for Railway PostgreSQL backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface GameRoom {
  id: string;
  fen: string;
  active_color: string;
  castling_rights: string;
  en_passant: string;
  halfmove_clock: number;
  fullmove_number: number;
  status: string;
  game_started: boolean;
  white_player_id: string | null;
  black_player_id: string | null;
  winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameMove {
  id: string;
  room_id: string;
  move_number: number;
  color: string;
  from_square: string;
  to_square: string;
  piece: string;
  promotion: string | null;
  castle_type: string | null;
  captured_piece: string | null;
  is_en_passant: boolean;
  is_check: boolean;
  is_checkmate: boolean;
  san: string;
  created_at: string;
}

// WebSocket connection manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(roomId: string) {
    if (this.ws && this.roomId === roomId && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected to this room
    }

    this.disconnect();
    this.roomId = roomId;

    const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    this.ws = new WebSocket(`${wsUrl}?roomId=${roomId}`);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected to room:', roomId);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message:', message);
        
        // Notify all listeners for this event type
        const listeners = this.listeners.get(message.type);
        if (listeners) {
          listeners.forEach(callback => callback(message));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.ws = null;
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
        setTimeout(() => this.connect(this.roomId!), delay);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
    this.reconnectAttempts = 0;
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  send(eventType: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'broadcast',
        eventType,
        data
      });
      this.ws.send(message);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
}

export const wsManager = new WebSocketManager();

// API functions
export async function getRoom(roomId: string): Promise<GameRoom | null> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch room: ${response.statusText}`);
  }
  return response.json();
}

export async function createRoom(data: Partial<GameRoom>): Promise<GameRoom> {
  const response = await fetch(`${API_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create room: ${response.statusText}`);
  }
  return response.json();
}

export async function updateRoom(roomId: string, data: Partial<GameRoom>): Promise<GameRoom> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update room: ${response.statusText}`);
  }
  return response.json();
}

export async function getMoves(roomId: string): Promise<GameMove[]> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/moves`);
  if (!response.ok) {
    throw new Error(`Failed to fetch moves: ${response.statusText}`);
  }
  return response.json();
}

export async function addMove(roomId: string, data: Omit<GameMove, 'id' | 'room_id' | 'created_at'>): Promise<GameMove> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/moves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to add move: ${response.statusText}`);
  }
  return response.json();
}

