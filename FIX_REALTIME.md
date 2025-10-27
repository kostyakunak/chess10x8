# Инструкция по исправлению Realtime синхронизации

## Что сделано

1. ✅ Создана миграция SQL для настройки Realtime
2. ✅ Исправлена подписка в коде (убран loadGameState из зависимостей)
3. ✅ Добавлен Broadcast канал для живых событий

## Что нужно сделать вручную

### Шаг 1: Применить миграцию в Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Откройте файл `supabase/migrations/20250128120000_fix_realtime.sql`
5. Скопируйте весь SQL код
6. Вставьте в SQL Editor и выполните (Run)

Миграция:
- Установит `REPLICA IDENTITY FULL` для корректных событий UPDATE
- Добавит таблицу в Realtime публикацию
- Создаст `updated_at` триггер
- Настроит права для anon

### Шаг 2: Проверить Realtime настройки

1. В Supabase Dashboard: **Table Editor** → `game_rooms`
2. Нажмите на иконку **⚡ Realtime** (или Settings → Realtime)
3. Убедитесь, что Realtime включен:
   - ☑️ Enable Realtime
   - ☑️ Send INSERT events
   - ☑️ Send UPDATE events
   - ☑️ Send DELETE events

### Шаг 3: Проверить работу

1. Откройте https://chess10x8.netlify.app/
2. Откройте консоль браузера (F12)
3. Создайте комнату
4. Откройте вторую вкладку с той же комнатой
5. Должны появиться логи:
   - `🔔 Subscription status: SUBSCRIBED`
   - `🔔 postgres_changes: {...}` (когда второй игрок подключился)

## Что изменилось в коде

### Было:
```typescript
useEffect(() => {
  // ...
  loadGameState(currentRoomId);
}, [currentRoomId, loadGameState]); // ❌ loadGameState создавал лишние переподписки
```

### Стало:
```typescript
useEffect(() => {
  // ...
}, [currentRoomId]); // ✅ Один канал на roomId
```

**Плюс добавили:**
- Broadcast канал для живых событий (ходы)
- Presence для отслеживания подключённых игроков
- Polling только когда Realtime не SUBSCRIBED

## Дальнейшие улучшения

1. **Убрать polling полностью** после подтверждения работы Realtime
2. **Добавить Broadcast для ходов** вместо записи в БД на каждый ход
3. **UI оверлей** для "Ожидание второго игрока"
4. **Центрировать доску** и улучшить панель управления

## Тестирование

Проверьте:
- [ ] Вторая вкладка видит обновления без задержки (без polling)
- [ ] `gameStarted` обновляется у обоих игроков
- [ ] `playerColor` не сбрасывается в null
- [ ] Консоль показывает `🔔 postgres_changes`

Если Realtime не работает:
- Проверьте миграцию выполнена
- Проверьте Realtime включен в Dashboard
- Проверьте `subscription status` в консоли
- Попробуйте перезапустить Supabase проект
