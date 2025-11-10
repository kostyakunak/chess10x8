# ✅ Backend успешно запущен!

## Что дальше:

### 1. Получите URL вашего backend

В Railway:
1. Откройте ваш сервис
2. Перейдите в **Settings** → **Networking**
3. Нажмите **"Generate Domain"** (если еще нет домена)
4. Скопируйте URL (например: `https://your-app.railway.app`)

### 2. Проверьте работу backend

Откройте в браузере:
```
https://your-url.railway.app/health
```

Должно вернуться: `{"status":"ok"}`

### 3. Обновите Netlify

1. Откройте https://app.netlify.com/
2. Ваш сайт → **Site settings** → **Environment variables**
3. **Удалите:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Добавьте:**
   - Name: `VITE_API_URL`
   - Value: `https://your-url.railway.app` (URL из шага 1)
5. **Deploys** → **Trigger deploy** → **Deploy site**

## ✅ Готово!

После этого ваше приложение будет работать с Railway PostgreSQL!
