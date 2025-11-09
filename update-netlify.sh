#!/bin/bash

# Скрипт для обновления переменных окружения на Netlify

echo "🌐 Обновление переменных окружения на Netlify..."

# Проверяем наличие Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI не установлен"
    echo "Установите: npm install -g netlify-cli"
    exit 1
fi

# Проверяем авторизацию
if ! netlify status &> /dev/null; then
    echo "🔐 Войдите в Netlify:"
    netlify login
fi

# Запрашиваем URL backend
read -p "Введите URL вашего Railway backend (например: https://your-backend.railway.app): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ URL не может быть пустым"
    exit 1
fi

echo "🗑️  Удаление старых переменных..."
netlify env:unset VITE_SUPABASE_URL 2>/dev/null || echo "  (VITE_SUPABASE_URL не найдена)"
netlify env:unset VITE_SUPABASE_ANON_KEY 2>/dev/null || echo "  (VITE_SUPABASE_ANON_KEY не найдена)"

echo "➕ Добавление новой переменной..."
netlify env:set VITE_API_URL "$RAILWAY_URL"

echo "✅ Переменные обновлены!"
echo ""
echo "🚀 Запустить деплой? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "📦 Деплой..."
    netlify deploy --prod
else
    echo "ℹ️  Вы можете задеплоить позже командой: netlify deploy --prod"
fi

