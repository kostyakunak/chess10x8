# 🔧 Исправление базы данных

## Проблема
На сайте появляется ошибка:
```
Could not find the 'game_started' column of 'game_rooms' in the schema cache
```

Это значит, что миграция не была применена к базе данных.

## Решение

### Вариант 1: Применить миграцию через Supabase Dashboard (Рекомендуется)

1. Откройте https://supabase.com/dashboard/project/fqmbgkchfnmkliqprpej
2. Перейдите в **SQL Editor**
3. Скопируйте и выполните следующий SQL:

```sql
-- Проверка существования таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'game_rooms'
);

-- Если таблица не существует, создайте её:
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/10/10/10/10/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  active_color text NOT NULL DEFAULT 'w',
  castling_rights text NOT NULL DEFAULT 'KQkq',
  en_passant text NOT NULL DEFAULT '-',
  halfmove_clock int NOT NULL DEFAULT 0,
  fullmove_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting',
  game_started boolean DEFAULT false,
  white_player_id text,
  black_player_id text,
  winner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  move_number int NOT NULL,
  color text NOT NULL,
  from_square text NOT NULL,
  to_square text NOT NULL,
  piece text NOT NULL,
  promotion text,
  castle_type text,
  captured_piece text,
  is_en_passant boolean DEFAULT false,
  is_check boolean DEFAULT false,
  is_checkmate boolean DEFAULT false,
  san text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_moves_room_id ON game_moves(room_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_created_at ON game_moves(created_at);

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create rooms"
  ON game_rooms FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view rooms"
  ON game_rooms FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Players can update their rooms"
  ON game_rooms FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view moves"
  ON game_moves FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert moves"
  ON game_moves FOR INSERT
  TO anon
  WITH CHECK (true);
```

### Вариант 2: Если таблица существует, но нет колонки

```sql
-- Добавить колонку game_started если её нет
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS game_started boolean DEFAULT false;
```

### Проверка

После применения миграции обновите страницу сайта. Ошибка должна исчезнуть.

