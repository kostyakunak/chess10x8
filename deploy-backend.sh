#!/bin/bash

# Скрипт для деплоя backend на Railway

echo "🚂 Деплой backend на Railway..."

cd server

# Проверяем наличие Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI не установлен"
    echo "Установите: npm i -g @railway/cli"
    exit 1
fi

# Проверяем авторизацию
if ! railway whoami &> /dev/null; then
    echo "🔐 Войдите в Railway:"
    railway login
fi

# Инициализируем проект (если еще не инициализирован)
if [ ! -f .railway/config.json ]; then
    echo "📦 Инициализация Railway проекта..."
    railway init
fi

# Устанавливаем переменные окружения
echo "🔧 Настройка переменных окружения..."
railway variables set DATABASE_URL="postgresql://postgres:caQqwIMLGgtXGZGqoeiTGyqtkKJipSsK@centerbeam.proxy.rlwy.net:33836/railway"
railway variables set NODE_ENV="production"

# Деплоим
echo "🚀 Деплой..."
railway up

# Получаем URL
echo "✅ Деплой завершен!"
echo "📋 URL вашего backend:"
railway domain

echo ""
echo "⚠️  Не забудьте обновить VITE_API_URL в Netlify с этим URL!"

