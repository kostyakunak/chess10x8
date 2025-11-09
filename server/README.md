# Chess 10x8 Backend API

Backend API для игры в шахматы 10x8, работающий с Railway PostgreSQL.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env`:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
NODE_ENV=production
```

## Запуск

### Разработка

```bash
npm run dev
```

Сервер запустится на `http://localhost:3001`

### Продакшен

```bash
npm start
```

## API Endpoints

### Rooms

- `GET /api/rooms/:roomId` - Получить комнату
- `POST /api/rooms` - Создать новую комнату
- `PATCH /api/rooms/:roomId` - Обновить комнату

### Moves

- `GET /api/rooms/:roomId/moves` - Получить все ходы комнаты
- `POST /api/rooms/:roomId/moves` - Добавить ход

### Health

- `GET /health` - Проверка работоспособности сервера

## WebSocket

Подключение к WebSocket:

```
ws://your-backend-url?roomId=room-uuid
```

События:
- `room_updated` - Комната обновлена
- `move_added` - Добавлен новый ход

## Деплой на Railway

1. Создайте новый сервис в Railway
2. Подключите GitHub репозиторий
3. Установите Root Directory: `server`
4. Добавьте переменные окружения:
   - `DATABASE_URL` (из PostgreSQL сервиса)
   - `NODE_ENV=production`
5. Railway автоматически определит порт

