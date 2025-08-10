#!/bin/bash

# Скрипт деплоя Excel Course на Ubuntu сервер
# Использование: ./deploy.sh

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
PROJECT_NAME="excel-course"
PROJECT_DIR="/var/www/mapyg.ru/course"
PM2_APP_NAME="excel-course"
PORT=3001
DOMAIN="mapyg.ru"

echo -e "${BLUE}🚀 Начинаем деплой Excel Course на ${DOMAIN}/course${NC}"

# Проверка прав администратора
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Этот скрипт должен запускаться с правами администратора (sudo)${NC}"
    exit 1
fi

# Функция логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

# 1. Создание директорий
log "📁 Создание директорий..."
mkdir -p $PROJECT_DIR
mkdir -p /var/log/pm2
mkdir -p /var/www/mapyg.ru/uploads/assignments
mkdir -p /var/www/mapyg.ru/uploads/submissions
mkdir -p /var/www/mapyg.ru/data/backups

# 2. Установка зависимостей системы
log "📦 Установка системных зависимостей..."
apt update
apt install -y curl wget git build-essential

# 3. Проверка Node.js
if ! command -v node &> /dev/null; then
    log "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    log "✅ Node.js уже установлен: $(node --version)"
fi

# 4. Проверка PM2
if ! command -v pm2 &> /dev/null; then
    log "📦 Установка PM2..."
    npm install -g pm2
else
    log "✅ PM2 уже установлен: $(pm2 --version)"
fi

# 5. Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    log "📦 Установка PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
else
    log "✅ PostgreSQL уже установлен"
fi

# 6. Настройка базы данных
log "🗄️  Настройка базы данных..."
sudo -u postgres psql -c "CREATE USER artemiszeep WITH PASSWORD 'password';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE excel_course OWNER artemiszeep;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE excel_course TO artemiszeep;" 2>/dev/null || true

# 7. Копирование файлов проекта
log "📋 Копирование файлов проекта..."
if [ -d ".git" ]; then
    # Если это git репозиторий, клонируем
    cd /tmp
    git clone https://github.com/your-repo/excel-course.git temp-course
    cp -r temp-course/* $PROJECT_DIR/
    rm -rf temp-course
else
    # Копируем текущую директорию
    cp -r . $PROJECT_DIR/
fi

# 8. Установка зависимостей Node.js
log "📦 Установка зависимостей Node.js..."
cd $PROJECT_DIR
npm install --production

# 9. Создание .env файла
log "⚙️  Создание .env файла..."
cat > $PROJECT_DIR/.env << EOF
# База данных
DATABASE_URL="postgresql://artemiszeep:password@localhost:5432/excel_course"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://$DOMAIN/course"

# Порог прохождения теста
PASS_THRESHOLD_PERCENT=50

# Порт приложения
PORT=$PORT
EOF

# 10. Сборка проекта
log "🔨 Сборка проекта..."
cd $PROJECT_DIR
npm run build

# 11. Настройка базы данных
log "🗄️  Инициализация базы данных..."
cd $PROJECT_DIR
npx prisma db push
npx prisma db seed

# 12. Настройка прав доступа
log "🔐 Настройка прав доступа..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chown -R www-data:www-data /var/www/mapyg.ru/uploads
chown -R www-data:www-data /var/www/mapyg.ru/data

# 13. Настройка PM2
log "⚡ Настройка PM2..."
cd $PROJECT_DIR
pm2 delete $PM2_APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 14. Настройка Nginx
log "🌐 Настройка Nginx..."
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ ! -f "$NGINX_CONF" ]; then
    # Создаем новый конфиг если не существует
    cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Основной сайт (если есть)
    location / {
        return 200 "Main site";
        add_header Content-Type text/plain;
    }
    
    # Excel Course
    location /course {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
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
        proxy_pass http://127.0.0.1:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /course/uploads {
        proxy_pass http://127.0.0.1:$PORT;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    location /course/api {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
else
    # Добавляем конфигурацию курса в существующий файл
    if ! grep -q "location /course" $NGINX_CONF; then
        # Добавляем конфигурацию курса перед закрывающей скобкой
        sed -i '/^}/i \    # Excel Course\n    location /course {\n        proxy_pass http://127.0.0.1:'$PORT';\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_cache_bypass $http_upgrade;\n        \n        proxy_connect_timeout 60s;\n        proxy_send_timeout 60s;\n        proxy_read_timeout 60s;\n        \n        proxy_buffering on;\n        proxy_buffer_size 4k;\n        proxy_buffers 8 4k;\n        \n        add_header X-Frame-Options "SAMEORIGIN" always;\n        add_header X-Content-Type-Options "nosniff" always;\n        add_header X-XSS-Protection "1; mode=block" always;\n        add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n    }\n    \n    location /course/_next/static {\n        proxy_pass http://127.0.0.1:'$PORT';\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n    }\n    \n    location /course/uploads {\n        proxy_pass http://127.0.0.1:'$PORT';\n        expires 1y;\n        add_header Cache-Control "public, max-age=31536000";\n    }\n    \n    location /course/api {\n        proxy_pass http://127.0.0.1:'$PORT';\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_cache_bypass $http_upgrade;\n    }' $NGINX_CONF
    fi
fi

# Активируем сайт если не активирован
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    ln -s $NGINX_CONF /etc/nginx/sites-enabled/
fi

# Проверяем конфигурацию Nginx
nginx -t

# Перезапускаем Nginx
systemctl reload nginx

# 15. Проверка работоспособности
log "🔍 Проверка работоспособности..."
sleep 5

# Проверяем PM2
if pm2 list | grep -q $PM2_APP_NAME; then
    log "✅ PM2 процесс запущен"
else
    error "❌ PM2 процесс не запущен"
    exit 1
fi

# Проверяем порт
if netstat -tlnp | grep -q ":$PORT "; then
    log "✅ Приложение слушает порт $PORT"
else
    error "❌ Приложение не слушает порт $PORT"
    exit 1
fi

# Проверяем Nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx работает"
else
    error "❌ Nginx не работает"
    exit 1
fi

# 16. Финальная проверка
log "🌐 Проверка доступности..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200"; then
    log "✅ Приложение отвечает на localhost:$PORT"
else
    warning "⚠️  Приложение не отвечает на localhost:$PORT"
fi

# 17. Информация о деплое
echo -e "${GREEN}"
echo "🎉 Деплой завершен успешно!"
echo "📋 Информация о деплое:"
echo "   🌐 URL: https://$DOMAIN/course"
echo "   📁 Директория: $PROJECT_DIR"
echo "   ⚡ PM2 процесс: $PM2_APP_NAME"
echo "   🔌 Порт: $PORT"
echo "   📊 Логи PM2: pm2 logs $PM2_APP_NAME"
echo "   🔄 Перезапуск: pm2 restart $PM2_APP_NAME"
echo "   🛑 Остановка: pm2 stop $PM2_APP_NAME"
echo ""
echo "🔧 Полезные команды:"
echo "   pm2 status                    # Статус процессов"
echo "   pm2 logs $PM2_APP_NAME        # Логи приложения"
echo "   pm2 restart $PM2_APP_NAME     # Перезапуск"
echo "   nginx -t                      # Проверка конфига Nginx"
echo "   systemctl reload nginx        # Перезагрузка Nginx"
echo -e "${NC}"

log "✅ Деплой завершен! Приложение доступно по адресу: https://$DOMAIN/course"
