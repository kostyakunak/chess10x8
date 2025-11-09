# 🚂 Деплой Backend на Railway

## Автоматический деплой через Railway CLI

### 1. Установите Railway CLI (если еще не установлен):

```bash
# macOS
brew install railway

# или через npm
npm i -g @railway/cli
```

### 2. Войдите в Railway:

```bash
railway login
```

### 3. Создайте новый проект:

```bash
cd server
railway init
```

### 4. Добавьте переменные окружения:

```bash
railway variables set DATABASE_URL="postgresql://postgres:caQqwIMLGgtXGZGqoeiTGyqtkKJipSsK@centerbeam.proxy.rlwy.net:33836/railway"
railway variables set NODE_ENV="production"
```

### 5. Задеплойте:

```bash
railway up
```

### 6. Получите URL вашего backend:

```bash
railway domain
```

Скопируйте этот URL - он понадобится для настройки фронтенда.

## Альтернативный способ через веб-интерфейс

1. Зайдите на https://railway.app/
2. Создайте новый проект
3. Нажмите "New" → "GitHub Repo"
4. Выберите ваш репозиторий
5. В настройках сервиса:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
6. Добавьте переменные окружения:
   - `DATABASE_URL` = `postgresql://postgres:caQqwIMLGgtXGZGqoeiTGyqtkKJipSsK@centerbeam.proxy.rlwy.net:33836/railway`
   - `NODE_ENV` = `production`
7. Railway автоматически задеплоит

