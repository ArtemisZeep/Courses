#!/bin/bash

# Скрипт развертывания Excel Course на Ubuntu
# Домен: excel-edu.ru
# Использует Docker для изоляции среды

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
PROJECT_NAME="excel-course"
DOMAIN="excel-edu.ru"
CONTAINER_NAME="excel-course-app"
DB_CONTAINER_NAME="excel-course-db"
NETWORK_NAME="excel-course-network"
PORT=3001  # Используем порт 3001 чтобы не конфликтовать с другими проектами

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен. Установите Docker:"
        echo "curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "sudo sh get-docker.sh"
        exit 1
    fi
    
    # Проверка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен. Установите Docker Compose:"
        echo "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    # Проверка nginx
    if ! command -v nginx &> /dev/null; then
        log_warning "Nginx не установлен. Установите nginx:"
        echo "sudo apt update && sudo apt install -y nginx"
    fi
    
    log_success "Все зависимости проверены"
}

# Создание Dockerfile
create_dockerfile() {
    log_info "Создание Dockerfile..."
    
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Установка зависимостей для сборки
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Установка зависимостей
RUN npm ci --only=production

# Генерация Prisma клиента
RUN npx prisma generate

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Создание директорий для загрузок
RUN mkdir -p /app/public/uploads/assignments /app/public/uploads/submissions
RUN chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
EOF

    log_success "Dockerfile создан"
}

# Создание docker-compose.yml
create_docker_compose() {
    log_info "Создание docker-compose.yml..."
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    container_name: ${CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${PORT}:3000"
    environment:
      - DATABASE_URL=postgresql://excel_user:excel_password@db:5432/excel_course
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://${DOMAIN}
      - UPLOAD_DIR=./public/uploads
      - MAX_FILE_SIZE=52428800
      - PASS_THRESHOLD_PERCENT=50
    volumes:
      - ./public/uploads:/app/public/uploads
    depends_on:
      - db
    networks:
      - ${NETWORK_NAME}

  db:
    image: postgres:15-alpine
    container_name: ${DB_CONTAINER_NAME}
    restart: unless-stopped
    environment:
      - POSTGRES_DB=excel_course
      - POSTGRES_USER=excel_user
      - POSTGRES_PASSWORD=excel_password
    volumes:
      - excel_course_data:/var/lib/postgresql/data
    networks:
      - ${NETWORK_NAME}

volumes:
  excel_course_data:

networks:
  ${NETWORK_NAME}:
    driver: bridge
EOF

    log_success "docker-compose.yml создан"
}

# Создание .env файла
create_env_file() {
    log_info "Создание .env файла..."
    
    # Генерация случайного секрета
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# База данных
DATABASE_URL="postgresql://excel_user:excel_password@localhost:5432/excel_course?schema=public"

# NextAuth секрет
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://${DOMAIN}"

# Файловое хранилище
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="52428800"

# Константы приложения
PASS_THRESHOLD_PERCENT=50
EOF

    log_success ".env файл создан"
}

# Создание конфигурации nginx
create_nginx_config() {
    log_info "Создание конфигурации nginx..."
    
    sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Редирект на HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL сертификаты (замените на свои)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Проксирование на Docker контейнер
    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Статические файлы
    location /uploads/ {
        alias /var/www/${DOMAIN}/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    # Создание символической ссылки
    sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    # Создание директории для загрузок
    sudo mkdir -p /var/www/${DOMAIN}/public/uploads/{assignments,submissions}
    sudo chown -R www-data:www-data /var/www/${DOMAIN}
    
    log_success "Конфигурация nginx создана"
}

# Создание PM2 конфигурации
create_pm2_config() {
    log_info "Создание PM2 конфигурации..."
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${PROJECT_NAME}',
    script: 'docker-compose',
    args: 'up -d',
    cwd: '$(pwd)',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

    log_success "PM2 конфигурация создана"
}

# Создание скрипта управления
create_management_script() {
    log_info "Создание скрипта управления..."
    
    cat > manage.sh << 'EOF'
#!/bin/bash

# Скрипт управления Excel Course

PROJECT_NAME="excel-course"
CONTAINER_NAME="excel-course-app"
DB_CONTAINER_NAME="excel-course-db"

case "$1" in
    start)
        echo "Запуск проекта..."
        docker-compose up -d
        ;;
    stop)
        echo "Остановка проекта..."
        docker-compose down
        ;;
    restart)
        echo "Перезапуск проекта..."
        docker-compose restart
        ;;
    logs)
        echo "Просмотр логов..."
        docker-compose logs -f
        ;;
    status)
        echo "Статус контейнеров..."
        docker-compose ps
        ;;
    backup)
        echo "Создание резервной копии базы данных..."
        docker exec ${DB_CONTAINER_NAME} pg_dump -U excel_user excel_course > backup_$(date +%Y%m%d_%H%M%S).sql
        ;;
    update)
        echo "Обновление проекта..."
        git pull
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|logs|status|backup|update}"
        exit 1
        ;;
esac
EOF

    chmod +x manage.sh
    log_success "Скрипт управления создан"
}

# Основная функция развертывания
deploy() {
    log_info "Начало развертывания Excel Course..."
    
    # Проверка зависимостей
    check_dependencies
    
    # Создание необходимых файлов
    create_dockerfile
    create_docker_compose
    create_env_file
    create_nginx_config
    create_pm2_config
    create_management_script
    
    # Создание директорий для загрузок
    mkdir -p public/uploads/{assignments,submissions}
    
    # Сборка и запуск контейнеров
    log_info "Сборка Docker образов..."
    docker-compose build --no-cache
    
    log_info "Запуск контейнеров..."
    docker-compose up -d
    
    # Ожидание запуска базы данных
    log_info "Ожидание запуска базы данных..."
    sleep 10
    
    # Выполнение миграций
    log_info "Выполнение миграций базы данных..."
    docker-compose exec app npx prisma migrate deploy
    
    # Генерация Prisma клиента
    log_info "Генерация Prisma клиента..."
    docker-compose exec app npx prisma generate
    
    # Заполнение базы данных начальными данными
    log_info "Заполнение базы данных начальными данными..."
    docker-compose exec app npm run db:seed
    
    # Проверка статуса
    log_info "Проверка статуса контейнеров..."
    docker-compose ps
    
    # Перезагрузка nginx
    log_info "Перезагрузка nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    
    log_success "Развертывание завершено!"
    log_info "Проект доступен по адресу: https://${DOMAIN}"
    log_info "Для управления используйте: ./manage.sh {start|stop|restart|logs|status|backup|update}"
}

# Функция очистки
cleanup() {
    log_info "Очистка проекта..."
    docker-compose down -v
    docker system prune -f
    log_success "Очистка завершена"
}

# Обработка аргументов командной строки
case "$1" in
    deploy)
        deploy
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Использование: $0 {deploy|cleanup}"
        echo ""
        echo "Команды:"
        echo "  deploy   - Развернуть проект"
        echo "  cleanup  - Очистить проект"
        exit 1
        ;;
esac
