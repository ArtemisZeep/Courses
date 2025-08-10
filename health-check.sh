#!/bin/bash

# Скрипт проверки состояния Excel Course

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="excel-edu.ru"
CONTAINER_NAME="excel-course-app"
DB_CONTAINER_NAME="excel-course-db"

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

# Проверка Docker контейнеров
check_containers() {
    log_info "Проверка Docker контейнеров..."
    
    if docker ps | grep -q ${CONTAINER_NAME}; then
        log_success "Контейнер приложения запущен"
    else
        log_error "Контейнер приложения не запущен"
        return 1
    fi
    
    if docker ps | grep -q ${DB_CONTAINER_NAME}; then
        log_success "Контейнер базы данных запущен"
    else
        log_error "Контейнер базы данных не запущен"
        return 1
    fi
}

# Проверка состояния контейнеров
check_container_health() {
    log_info "Проверка состояния контейнеров..."
    
    # Проверка использования ресурсов
    echo "Использование ресурсов:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    
    # Проверка логов на ошибки
    log_info "Проверка логов на ошибки..."
    if docker logs ${CONTAINER_NAME} --tail 50 2>&1 | grep -i error; then
        log_warning "Найдены ошибки в логах приложения"
    else
        log_success "Ошибок в логах приложения не найдено"
    fi
}

# Проверка базы данных
check_database() {
    log_info "Проверка базы данных..."
    
    if docker exec ${DB_CONTAINER_NAME} pg_isready -U excel_user -d excel_course > /dev/null 2>&1; then
        log_success "База данных доступна"
    else
        log_error "База данных недоступна"
        return 1
    fi
    
    # Проверка подключения через Prisma
    if docker exec ${CONTAINER_NAME} npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        log_success "Prisma подключение работает"
    else
        log_error "Prisma подключение не работает"
        return 1
    fi
}

# Проверка nginx
check_nginx() {
    log_info "Проверка nginx..."
    
    if systemctl is-active --quiet nginx; then
        log_success "Nginx запущен"
    else
        log_error "Nginx не запущен"
        return 1
    fi
    
    if nginx -t > /dev/null 2>&1; then
        log_success "Конфигурация nginx корректна"
    else
        log_error "Ошибка в конфигурации nginx"
        return 1
    fi
}

# Проверка SSL сертификатов
check_ssl() {
    log_info "Проверка SSL сертификатов..."
    
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        log_success "SSL сертификат существует"
        
        # Проверка срока действия
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/${DOMAIN}/fullchain.pem | cut -d= -f2)
        EXPIRY_DATE=$(date -d "$EXPIRY" +%s)
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_DATE - CURRENT_DATE) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            log_success "Сертификат действителен еще $DAYS_LEFT дней"
        elif [ $DAYS_LEFT -gt 7 ]; then
            log_warning "Сертификат истекает через $DAYS_LEFT дней"
        else
            log_error "Сертификат истекает через $DAYS_LEFT дней!"
        fi
    else
        log_error "SSL сертификат не найден"
        return 1
    fi
}

# Проверка доступности приложения
check_application() {
    log_info "Проверка доступности приложения..."
    
    # Проверка локального доступа
    if curl -f -s http://localhost:3001 > /dev/null; then
        log_success "Приложение доступно локально"
    else
        log_error "Приложение недоступно локально"
        return 1
    fi
    
    # Проверка через nginx
    if curl -f -s -k https://${DOMAIN} > /dev/null; then
        log_success "Приложение доступно через HTTPS"
    else
        log_error "Приложение недоступно через HTTPS"
        return 1
    fi
}

# Проверка файловой системы
check_filesystem() {
    log_info "Проверка файловой системы..."
    
    # Проверка директорий загрузок
    if [ -d "/var/www/${DOMAIN}/public/uploads" ]; then
        log_success "Директория загрузок существует"
        
        # Проверка прав доступа
        if [ -w "/var/www/${DOMAIN}/public/uploads" ]; then
            log_success "Права на запись в директорию загрузок"
        else
            log_error "Нет прав на запись в директорию загрузок"
        fi
    else
        log_error "Директория загрузок не существует"
    fi
    
    # Проверка свободного места
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 80 ]; then
        log_success "Свободного места достаточно ($DISK_USAGE% использовано)"
    else
        log_warning "Мало свободного места ($DISK_USAGE% использовано)"
    fi
}

# Проверка сетевых портов
check_ports() {
    log_info "Проверка сетевых портов..."
    
    if netstat -tlnp | grep -q ":3001 "; then
        log_success "Порт 3001 открыт"
    else
        log_error "Порт 3001 не открыт"
    fi
    
    if netstat -tlnp | grep -q ":80 "; then
        log_success "Порт 80 открыт"
    else
        log_error "Порт 80 не открыт"
    fi
    
    if netstat -tlnp | grep -q ":443 "; then
        log_success "Порт 443 открыт"
    else
        log_error "Порт 443 не открыт"
    fi
}

# Проверка резервных копий
check_backups() {
    log_info "Проверка резервных копий..."
    
    if [ -f "backup_$(date +%Y%m%d).sql" ]; then
        log_success "Сегодняшняя резервная копия существует"
    else
        log_warning "Сегодняшняя резервная копия не найдена"
    fi
    
    # Проверка размера последней резервной копии
    LATEST_BACKUP=$(ls -t backup_*.sql 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        log_info "Размер последней резервной копии: $BACKUP_SIZE"
    fi
}

# Основная функция проверки
main() {
    echo "=== Проверка состояния Excel Course ==="
    echo "Время проверки: $(date)"
    echo ""
    
    local exit_code=0
    
    # Выполнение всех проверок
    check_containers || exit_code=1
    check_container_health
    check_database || exit_code=1
    check_nginx || exit_code=1
    check_ssl || exit_code=1
    check_application || exit_code=1
    check_filesystem
    check_ports
    check_backups
    
    echo ""
    echo "=== Результат проверки ==="
    
    if [ $exit_code -eq 0 ]; then
        log_success "Все критические проверки пройдены успешно!"
        echo "Система работает корректно."
    else
        log_error "Обнаружены критические проблемы!"
        echo "Рекомендуется проверить логи и исправить ошибки."
    fi
    
    return $exit_code
}

# Обработка аргументов
case "$1" in
    containers)
        check_containers
        ;;
    database)
        check_database
        ;;
    nginx)
        check_nginx
        ;;
    ssl)
        check_ssl
        ;;
    app)
        check_application
        ;;
    *)
        main
        ;;
esac
