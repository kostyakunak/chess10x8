# 🚀 Быстрый старт после миграции на Railway

## ✅ Что уже сделано:

- ✅ База данных Railway настроена и миграции применены
- ✅ Backend API создан и протестирован
- ✅ Фронтенд обновлен для работы с новым API
- ✅ Зависимости установлены

## 📋 Что нужно сделать сейчас:

### 1. Создайте файл `server/.env`:

```bash
cd server
cat > .env << EOF
DATABASE_URL=postgresql://postgres:caQqwIMLGgtXGZGqoeiTGyqtkKJipSsK@centerbeam.proxy.rlwy.net:33836/railway
PORT=3001
NODE_ENV=production
EOF
```

### 2. Создайте файл `.env` в корне проекта:

```bash
# В корне проекта
cat > .env << EOF
VITE_API_URL=http://localhost:3001
EOF
```

### 3. Запустите backend:

```bash
cd server
npm start
```

Backend будет доступен на `http://localhost:3001`

### 4. Запустите frontend (в новом терминале):

```bash
# В корне проекта
npm run dev
```

## 🌐 Деплой на Railway

### Backend:

1. Зайдите на https://railway.app/
2. Создайте новый проект
3. Добавьте сервис "GitHub Repo"
4. Выберите ваш репозиторий
5. В настройках сервиса:
   - **Root Directory**: `server`
   - **Variables**:
     - `DATABASE_URL` = `postgresql://postgres:caQqwIMLGgtXGZGqoeiTGyqtkKJipSsK@centerbeam.proxy.rlwy.net:33836/railway`
     - `NODE_ENV` = `production`
6. Railway автоматически задеплоит

После деплоя скопируйте URL вашего backend (например: `https://your-app.railway.app`)

### Frontend (Netlify):

1. Откройте https://app.netlify.com/
2. Ваш сайт → **Site settings** → **Environment variables**
3. **Удалите:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Добавьте:**
   - `VITE_API_URL` = URL вашего Railway backend
5. **Deploys** → **Trigger deploy** → **Deploy site**

## ✅ Готово!

После деплоя ваше приложение будет работать с Railway PostgreSQL!

