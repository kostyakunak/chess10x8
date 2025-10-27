# Очистка кэша Supabase

## Проблема
Даже если миграция применена, PostgREST может кэшировать старую схему.

## Решение

### Способ 1: Перезапуск PostgREST (самый простой)

1. Откройте https://supabase.com/dashboard/project/fqmbgkchfnmkliqprpej
2. Перейдите в **Settings** → **API**
3. Прокрутите вниз до секции **"API Settings"**
4. Найдите кнопку **"Reload Schema"** или аналогичную
5. Нажмите её - это очистит кэш PostgREST

### Способ 2: Через SQL

Выполните в SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

### Способ 3: Переменные окружения на Netlify

Важно убедиться, что переменные добавлены:

1. Откройте https://app.netlify.com/
2. Выберите сайт chess10x8
3. **Site settings** → **Environment variables**
4. Проверьте наличие:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Если переменных нет - добавьте их (значения из `.env` файла)
6. После добавления: **Deploys** → **Redeploy site**

### Способ 4: Полная пересборка

```bash
# В Supabase Dashboard → SQL Editor
SELECT pg_notify('pgrst', 'reload schema');

# Или просто подождите 30 секунд - кэш обновится автоматически
```

## После исправления

Обновите страницу сайта. Ошибка должна исчезнуть.

