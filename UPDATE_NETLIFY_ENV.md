# 🔄 Обновление переменных окружения на Netlify

## Автоматическое обновление через Netlify API

После деплоя backend на Railway, выполните:

```bash
# Установите Netlify CLI (если еще не установлен)
npm install -g netlify-cli

# Войдите в Netlify
netlify login

# Перейдите в папку проекта
cd /Users/kostakunak/Desktop/Upwork/chess-10x8

# Удалите старые переменные
netlify env:unset VITE_SUPABASE_URL
netlify env:unset VITE_SUPABASE_ANON_KEY

# Добавьте новую переменную (замените YOUR_RAILWAY_URL на URL вашего backend)
netlify env:set VITE_API_URL "https://YOUR_RAILWAY_URL.railway.app"

# Перезадеплойте
netlify deploy --prod
```

## Ручное обновление через веб-интерфейс

1. Откройте https://app.netlify.com/
2. Выберите ваш сайт **chess10x8**
3. **Site settings** → **Environment variables**
4. **Удалите:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Добавьте:**
   - `VITE_API_URL` = URL вашего Railway backend (например: `https://your-backend.railway.app`)
6. **Deploys** → **Trigger deploy** → **Deploy site**

