# 🔄 Обновление переменных Netlify

## ⚠️ Проблема

В Netlify настроены переменные от **другого** проекта Supabase!

- Сейчас в Netlify: `fqmbgkchfnmkliqprpej.supabase.co` (неправильный проект)
- Нужно изменить на: `tehecmjdaarxohvfepin.supabase.co` (правильный проект)

## 🚀 Решение

### Обновите переменные в Netlify:

1. Откройте https://app.netlify.com/
2. Выберите ваш сайт **chess10x8**
3. **Site settings** → **Environment variables**

#### Обновите VITE_SUPABASE_URL:

Нажмите на существующую переменную `VITE_SUPABASE_URL` и измените значение на:
```
https://tehecmjdaarxohvfepin.supabase.co
```

#### Обновите VITE_SUPABASE_ANON_KEY:

Нажмите на существующую переменную `VITE_SUPABASE_ANON_KEY` и измените значение на:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaGVjbWpkYWFyeG9odmZlcGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1OTY3MzYsImV4cCI6MjA3NzE3MjczNn0.RCqAycYPz5IVkSo70Et5AX7OsefzdpdCe0ppUnZCNd0
```

### Перезадеплойте:

После обновления переменных:
- Вернитесь в **Deploys**
- Нажмите **Trigger deploy** → **Deploy site**

Или просто подождите автоматический редеплой (если включен auto-deploy).

## ✅ После обновления

Обновите страницу сайта - игра должна заработать!

