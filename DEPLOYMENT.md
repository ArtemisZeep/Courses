# 🚀 Руководство по развертыванию

## Варианты развертывания

### 1. 🔥 Vercel (рекомендуется для фронтенда)

**Преимущества:**
- Автоматическое развертывание из Git
- Глобальная CDN
- Встроенная поддержка Next.js
- Бесплатный SSL

**Шаги:**
1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения
3. Настройте внешнюю PostgreSQL базу

**Переменные окружения в Vercel:**
```env
DATABASE_URL=postgresql://user:password@host:5432/db
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
UPLOAD_DIR=/tmp/uploads
PROGRESS_DIR=/tmp/progress
```

### 2. 🚂 Railway (полный стек)

**Преимущества:**
- Встроенная PostgreSQL
- Простое развертывание
- Автоматические бэкапы

**Шаги:**
1. Подключите GitHub репозиторий
2. Добавьте PostgreSQL сервис
3. Настройте переменные окружения
4. Деплой происходит автоматически

### 3. 🐳 Docker (VPS/сервер)

**Для развертывания на собственном сервере:**

```bash
# Клонирование
git clone <repo-url>
cd excel-course

# Настройка переменных
cp env.example .env
# Отредактируйте .env

# Запуск
docker-compose up -d

# Миграции (первый запуск)
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

### 4. ☁️ AWS/DigitalOcean

**Архитектура:**
- EC2/Droplet для приложения
- RDS/Managed Database для PostgreSQL
- S3/Spaces для файлов

## Переменные окружения для продакшена

```env
# База данных
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="super-secure-secret-key-64-characters-minimum"
NEXTAUTH_URL="https://yourdomain.com"

# Файловое хранилище
UPLOAD_DIR="/app/data/uploads"
PROGRESS_DIR="/app/data/progress"
MAX_FILE_SIZE="52428800"

# Приложение
NODE_ENV="production"
PASS_THRESHOLD_PERCENT="75"

# S3 (опционально)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="excel-course-files"
```

## Настройка базы данных

### PostgreSQL в продакшене

**Создание базы данных:**
```sql
CREATE DATABASE excel_course;
CREATE USER excel_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE excel_course TO excel_user;
```

**Миграции:**
```bash
npx prisma migrate deploy
npx prisma db seed
```

### Бэкапы

**Автоматический бэкап (Node.js cron):**
Система использует встроенный Node.js cron вместо системного cron для лучшей совместимости с различными серверами.

**Настроенные задачи:**
- **Ежедневный снапшот:** 22:00 по московскому времени (19:00 UTC)
- **Еженедельная очистка:** воскресенье 23:00 МСК (20:00 UTC) - удаление снапшотов старше 30 дней

**Зависимости:**
```bash
npm install node-cron
npm install @types/node-cron --save-dev
```

**Система бэкапов:**
- **Текущий бэкап:** `data/backups/current.json` - обновляется автоматически при любых изменениях
- **Ежедневные снапшоты:** `data/backups/snapshot_YYYY-MM-DDTHH-MM-SS.json` - создаются в 22:00 по МСК
- **Автоочистка:** Снапшоты старше 30 дней удаляются автоматически

**API endpoints:**
- `POST /api/admin/backup/current` - создать/обновить текущий бэкап
- `POST /api/admin/backup/snapshot` - создать снапшот + обновить текущий
- `POST /api/admin/backup/cleanup` - очистить старые снапшоты

**Логирование:**
Cron задачи логируются в консоль сервера с эмодзи для удобства:
- 🕐 Создание снапшота
- 🧹 Очистка старых файлов
- ✅ Успешное выполнение
- ❌ Ошибки

## Мониторинг и логи

### Настройка логирования

```javascript
// В production добавьте в next.config.js
module.exports = {
  experimental: {
    logging: {
      level: 'info',
    },
  },
}
```

### Health checks

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  })
}
```

## Безопасность

### SSL/HTTPS
- Обязательно используйте HTTPS в продакшене
- Настройте редирект с HTTP на HTTPS

### Переменные окружения
- Никогда не коммитьте .env файлы
- Используйте надежные секретные ключи
- Регулярно ротируйте пароли

### Файловая безопасность
```javascript
// Проверка типов файлов
const allowedTypes = ['.xlsx', '.xls', '.pdf', '.zip']
const fileExtension = path.extname(filename).toLowerCase()
if (!allowedTypes.includes(fileExtension)) {
  throw new Error('Недопустимый тип файла')
}
```

## Производительность

### Кеширование
```javascript
// В next.config.js
module.exports = {
  headers: async () => {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### База данных
- Добавьте индексы для часто используемых полей
- Используйте connection pooling

```sql
-- Полезные индексы
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_module_order ON modules("order");
CREATE INDEX idx_quiz_results_user_module ON quiz_results(user_id, module_id);
```

## Масштабирование

### Горизонтальное масштабирование
- Используйте load balancer
- Сессии храните в Redis
- Файлы храните в S3/CDN

### Вертикальное масштабирование
- Увеличьте ресурсы сервера
- Оптимизируйте запросы к БД
- Используйте кеширование

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
```

## Мониторинг в продакшене

### Метрики для отслеживания
- Время ответа API
- Количество активных пользователей
- Ошибки регистрации/входа
- Производительность тестов
- Использование дискового пространства

### Инструменты мониторинга
- **Vercel Analytics** - для фронтенда
- **Sentry** - для отслеживания ошибок
- **DataDog** - комплексный мониторинг
- **Grafana** - визуализация метрик

## Резервное копирование

### Автоматические бэкапы
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Бэкап базы данных
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_backup_$DATE.sql"

# Бэкап файлов прогресса
tar -czf "$BACKUP_DIR/progress_backup_$DATE.tar.gz" /app/data/progress/

# Бэкап загруженных файлов
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" /app/public/uploads/

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

## Troubleshooting

### Частые проблемы

**Проблема:** Не работает аутентификация
**Решение:** Проверьте NEXTAUTH_SECRET и NEXTAUTH_URL

**Проблема:** Ошибки базы данных
**Решение:** Проверьте строку подключения и права пользователя

**Проблема:** Файлы не загружаются
**Решение:** Проверьте права на директории и лимиты размера

### Логи для отладки

```bash
# Docker логи
docker-compose logs app

# Prisma логи
DEBUG="prisma:*" npm start

# Next.js логи
DEBUG="*" npm start
```

---

🎯 **Успешного развертывания! Ваша платформа обучения Excel готова к продакшену!**

## 🚀 Деплой на Ubuntu сервер

### Автоматический деплой (рекомендуется)

1. **Скопируйте проект на сервер:**
```bash
# На вашем локальном компьютере
git clone <your-repo-url>
cd excel-course
tar -czf excel-course.tar.gz .
scp excel-course.tar.gz user@your-server:/tmp/

# На сервере
cd /tmp
tar -xzf excel-course.tar.gz -C /var/www/mapyg.ru/course/
```

2. **Запустите скрипт деплоя:**
```bash
cd /var/www/mapyg.ru/course
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### Ручной деплой

Если нужен ручной контроль:

1. **Установите зависимости:**
```bash
sudo apt update
sudo apt install -y nodejs npm postgresql nginx curl wget git build-essential
sudo npm install -g pm2
```

2. **Настройте базу данных:**
```bash
sudo -u postgres psql -c "CREATE USER artemiszeep WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE excel_course OWNER artemiszeep;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE excel_course TO artemiszeep;"
```

3. **Соберите проект:**
```bash
cd /var/www/mapyg.ru/course
npm install --production
npm run build
npx prisma db push
npx prisma db seed
```

4. **Настройте PM2:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

5. **Настройте Nginx** (добавьте в `/etc/nginx/sites-available/mapyg.ru`):
```nginx
location /course {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

location /course/_next/static {
    proxy_pass http://127.0.0.1:3001;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /course/uploads {
    proxy_pass http://127.0.0.1:3001;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000";
}

location /course/api {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

6. **Активируйте сайт и перезапустите Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/mapyg.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Чек-лист деплоя

Перед запуском в продакшене убедитесь:

- [ ] **База данных:** PostgreSQL установлен и настроен
- [ ] **Node.js:** Версия 18+ установлена
- [ ] **PM2:** Установлен глобально
- [ ] **Nginx:** Настроен и работает
- [ ] **Права доступа:** www-data имеет доступ к файлам
- [ ] **Порты:** 3001 свободен для приложения
- [ ] **SSL:** Сертификат настроен (рекомендуется)
- [ ] **Бэкапы:** Директория `/var/www/mapyg.ru/data/backups/` создана
- [ ] **Логи:** Директория `/var/log/pm2/` создана

## 🔧 Управление приложением

### PM2 команды
```bash
pm2 status                    # Статус всех процессов
pm2 logs excel-course         # Логи приложения
pm2 restart excel-course      # Перезапуск
pm2 stop excel-course         # Остановка
pm2 delete excel-course       # Удаление процесса
pm2 save                      # Сохранить конфигурацию
pm2 startup                   # Автозапуск при перезагрузке
```

### Nginx команды
```bash
nginx -t                      # Проверка конфигурации
sudo systemctl reload nginx   # Перезагрузка конфигурации
sudo systemctl restart nginx  # Полный перезапуск
sudo systemctl status nginx   # Статус сервиса
```

### База данных
```bash
npx prisma studio            # Веб-интерфейс для БД
npx prisma db push           # Применить миграции
npx prisma db seed           # Заполнить тестовыми данными
npx prisma migrate dev       # Создать новую миграцию
```

## 🆘 Устранение неполадок

### Приложение не запускается
```bash
# Проверить логи PM2
pm2 logs excel-course

# Проверить статус процесса
pm2 status

# Перезапустить процесс
pm2 restart excel-course

# Проверить порт
netstat -tlnp | grep 3001
```

### Nginx ошибки
```bash
# Проверить конфигурацию
nginx -t

# Проверить статус сервиса
sudo systemctl status nginx

# Проверить логи
sudo tail -f /var/log/nginx/error.log
```

### Проблемы с базой данных
```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Подключиться к базе данных
sudo -u postgres psql -d excel_course

# Проверить подключение
npx prisma db push
```

### Проблемы с правами доступа
```bash
# Исправить права на файлы
sudo chown -R www-data:www-data /var/www/mapyg.ru/course
sudo chmod -R 755 /var/www/mapyg.ru/course

# Исправить права на загрузки
sudo chown -R www-data:www-data /var/www/mapyg.ru/uploads
sudo chown -R www-data:www-data /var/www/mapyg.ru/data
```

### Проблемы с бэкапами
```bash
# Проверить директорию бэкапов
ls -la /var/www/mapyg.ru/data/backups/

# Создать бэкап вручную
curl -X POST http://localhost:3001/api/admin/backup/snapshot

# Проверить cron задачи
pm2 logs excel-course | grep CRON
```

## 🔄 Обновление приложения

### Автоматическое обновление
```bash
cd /var/www/mapyg.ru/course
git pull
npm install --production
npm run build
npx prisma db push
pm2 restart excel-course
```

### Ручное обновление
```bash
# Остановить приложение
pm2 stop excel-course

# Обновить код
cd /var/www/mapyg.ru/course
git pull

# Установить зависимости
npm install --production

# Собрать проект
npm run build

# Обновить базу данных
npx prisma db push

# Запустить приложение
pm2 start excel-course
```

## 📊 Мониторинг

### Логи
- **PM2 логи:** `/var/log/pm2/`
- **Nginx логи:** `/var/log/nginx/`
- **Системные логи:** `journalctl -u nginx`

### Бэкапы
- **Текущий бэкап:** `/var/www/mapyg.ru/data/backups/current.json`
- **Снапшоты:** `/var/www/mapyg.ru/data/backups/snapshot_*.json`

### Статус сервисов
```bash
# Проверить все сервисы
sudo systemctl status nginx postgresql
pm2 status
```

## 🔒 Безопасность

### Рекомендации
- [ ] Настройте SSL сертификат (Let's Encrypt)
- [ ] Измените пароли по умолчанию
- [ ] Настройте firewall (ufw)
- [ ] Регулярно обновляйте систему
- [ ] Настройте мониторинг безопасности

### SSL с Let's Encrypt
```bash
# Установить Certbot
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d mapyg.ru

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```