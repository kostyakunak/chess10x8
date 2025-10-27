# 🚀 Деплой на Netlify

## Подготовка к деплою

### 1. Убедитесь, что миграция применена
База данных должна быть готова (вы уже применили миграцию).

### 2. Добавьте переменные окружения в Netlify

После деплоя:
1. Зайдите в **Site settings** → **Environment variables**
2. Добавьте переменные:

```
VITE_SUPABASE_URL=https://fqmbgkchfnmkliqprpej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbWJna2NoZm5ta2xpcXBycGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg0ODgsImV4cCI6MjA3NzEzNDQ4OH0.RK3zVUxwEGzHuimAA0CclfW45KPaUGThXKlEs9dPRs4
```

## 🎯 Способы деплоя

### Способ 1: Netlify CLI (рекомендуется)

```bash
# Установите Netlify CLI глобально
npm install -g netlify-cli

# Войдите в аккаунт
netlify login

# Инициализируйте проект
netlify init

# Деплой
netlify deploy --prod
```

### Способ 2: GitHub + Netlify (автоматический)

1. Создайте репозиторий на GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chess-10x8.git
git push -u origin main
```

2. Зайдите на https://netlify.com
3. Нажмите **Add new site** → **Import from Git**
4. Подключите GitHub и выберите репозиторий
5. Настройки деплоя:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Добавьте переменные окружения (см. выше)
7. Нажмите **Deploy site**

### Способ 3: Drag & Drop

1. Выполните локальную сборку:
```bash
npm run build
```

2. Зайдите на https://app.netlify.com/drop
3. Перетащите папку `dist` в браузер
4. Деплой запустится автоматически!

## ⚠️ Важно после деплоя

После первого деплоя обязательно добавьте переменные окружения:
- Зайдите в ваш сайт на Netlify
- **Site settings** → **Environment variables**
- Добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- Выполните **Redeploy site**

## 🎮 Проверка

После деплоя ваш сайт будет доступен по адресу:
`https://YOUR_SITE_NAME.netlify.app`

## 🔄 Обновление

### При использовании GitHub:
Просто делайте `git push` - Netlify автоматически задеплоит изменения.

### При использовании CLI:
```bash
netlify deploy --prod
```

## 📝 Полезные команды

```bash
# Предварительный просмотр билда
npm run build
npm run preview

# Проверка конфигурации Netlify
netlify status

# Просмотр логов
netlify logs
```

## 🐛 Возможные проблемы

### Ошибка 404 на всех страницах
✅ Уже решено через `netlify.toml` с правилом redirects

### Ошибки подключения к Supabase
- Проверьте переменные окружения в Netlify
- Убедитесь, что используется правильный проект Supabase

### Проблемы с билдом
```bash
npm run build
# Проверьте сообщения об ошибках
```

