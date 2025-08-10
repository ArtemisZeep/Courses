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