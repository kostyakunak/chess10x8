# Известные проблемы мультиплеерной синхронизации

## Проблема 1: Игровое состояние не синхронизируется между игроками

**Описание:**
Когда второй игрок подключается к игре, первый игрок (создатель комнаты) не видит обновления состояния. Он продолжает видеть сообщение "Ожидание второго игрока..." даже после того, как второй игрок успешно подключился и игра началась.

**Симптомы:**
- Создатель игры видит `gameStarted: false` после подключения второго игрока
- У создателя `playerColor` может быть `null` даже если в базе данных `game_started: true`
- Второй игрок корректно видит свое состояние (`playerColor`, `gameStarted`)

**Корневая причина:**
Supabase Realtime подписки не работают или не передают события обновления таблицы `game_rooms` между игроками в режиме реального времени.

**Временное решение:**
Реализован polling fallback - состояние игры обновляется каждые 3 секунды:

```typescript
const pollInterval = setInterval(() => {
  console.log('🔄 Polling: checking for updates...');
  loadGameState(currentRoomId);
}, 3000);
```

**Текущий код:**
```typescript
useEffect(() => {
  if (!currentRoomId) return;

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
    .subscribe();

  // Polling fallback
  const pollInterval = setInterval(() => {
    loadGameState(currentRoomId);
  }, 3000);

  return () => {
    supabase.removeChannel(channel);
    clearInterval(pollInterval);
  };
}, [currentRoomId, loadGameState]);
```

## Проблема 2: Состояние сбрасывается при polling

**Описание:**
При обновлении состояния через polling, `playerColor` может сбрасываться в `null` из-за гонки состояний в React.

**Результат:**
Игроки теряют цвет фигур и не могут делать ходы, даже если `gameStarted: true`.

**Решение:**
Удалены дублирующие вызовы `setGameStarted` и `setStatus` внутри блоков проверки роли игрока (строки 101-108 в `useChessGame.ts`).

## Технический контекст

**Архитектура:**
- Frontend: React + Vite
- Backend: Supabase (PostgreSQL + Realtime)
- Деплой: Netlify

**База данных:**
Таблица `game_rooms` содержит:
- `white_player_id` - ID игрока белыми фигурами
- `black_player_id` - ID игрока черными фигурами  
- `game_started` - boolean, начало игры
- `status` - 'waiting', 'active', и т.д.

**Что работает:**
- Создание игры ✓
- Подключение второго игрока ✓
- Распределение ролей (белые/черные) ✓
- Обновление состояния в базе данных ✓
- Polling синхронизация ✓

**Что не работает:**
- Realtime синхронизация между игроками ✗
- Автоматическое обновление UI у первого игрока ✗

## Необходимые изменения

1. **Настроить Supabase Realtime правильно**
   - Проверить, включен ли Realtime для таблицы `game_rooms`
   - Возможно, требуется настройка Publications в Supabase Dashboard

2. **Альтернативное решение:**
   - Полностью полагаться на polling (текущее временное решение)
   - Рассмотреть WebSocket соединение напрямую
   - Использовать Supabase Broadcast API вместо postgres_changes

## Логи для отладки

При тестировании в консоли ожидаются следующие логи:
- `🔔 Setting up realtime subscription for room: [id]`
- `🔔 Subscription status: SUBSCRIBED`
- `🔔 Realtime UPDATE received for game_rooms: [payload]` (не появляется!)
- `🔄 Polling: checking for updates...` (работает каждые 3 сек)

## Вопросы для анализа

1. Почему Supabase Realtime не передает события обновления таблицы?
2. Нужна ли дополнительная настройка в Supabase Dashboard?
3. Работает ли polling как долгосрочное решение или нужно реальное realtime?
4. Может ли быть проблема с RLS (Row Level Security) политиками?
