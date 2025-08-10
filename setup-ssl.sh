#!/bin/bash

# Скрипт настройки SSL сертификатов для excel-edu.ru
# Использует Let's Encrypt для получения бесплатных SSL сертификатов

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="excel-edu.ru"

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

# Проверка и установка certbot
install_certbot() {
    log_info "Проверка certbot..."
    
    if ! command -v certbot &> /dev/null; then
        log_info "Установка certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    else
        log_success "Certbot уже установлен"
    fi
}

# Создание временной конфигурации nginx для получения сертификата
create_temp_nginx_config() {
    log_info "Создание временной конфигурации nginx..."
    
    sudo tee /etc/nginx/sites-available/${DOMAIN}-temp > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    location / {
        return 200 "Domain verification in progress";
        add_header Content-Type text/plain;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/${DOMAIN}-temp /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/${DOMAIN}
    
    sudo nginx -t && sudo systemctl reload nginx
    log_success "Временная конфигурация nginx создана"
}

# Получение SSL сертификата
obtain_certificate() {
    log_info "Получение SSL сертификата для ${DOMAIN}..."
    
    sudo certbot certonly --nginx \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        --domains ${DOMAIN},www.${DOMAIN}
    
    log_success "SSL сертификат получен"
}

# Восстановление основной конфигурации nginx
restore_nginx_config() {
    log_info "Восстановление основной конфигурации nginx..."
    
    sudo rm -f /etc/nginx/sites-enabled/${DOMAIN}-temp
    sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    
    sudo nginx -t && sudo systemctl reload nginx
    log_success "Основная конфигурация nginx восстановлена"
}

# Настройка автоматического обновления сертификатов
setup_auto_renewal() {
    log_info "Настройка автоматического обновления сертификатов..."
    
    # Создание скрипта для обновления
    sudo tee /usr/local/bin/renew-ssl.sh > /dev/null << 'EOF'
#!/bin/bash
certbot renew --quiet --nginx
systemctl reload nginx
EOF

    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Добавление в cron для ежедневного обновления
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    log_success "Автоматическое обновление настроено"
}

# Основная функция
main() {
    log_info "Настройка SSL сертификатов для ${DOMAIN}..."
    
    # Проверка прав администратора
    if [ "$EUID" -ne 0 ]; then
        log_error "Этот скрипт должен выполняться с правами администратора"
        exit 1
    fi
    
    # Проверка доступности домена
    log_info "Проверка доступности домена ${DOMAIN}..."
    if ! nslookup ${DOMAIN} > /dev/null 2>&1; then
        log_error "Домен ${DOMAIN} недоступен. Убедитесь, что DNS настроен правильно"
        exit 1
    fi
    
    install_certbot
    create_temp_nginx_config
    obtain_certificate
    restore_nginx_config
    setup_auto_renewal
    
    log_success "SSL сертификаты настроены успешно!"
    log_info "Сертификаты будут автоматически обновляться ежедневно в 12:00"
}

# Проверка аргументов
if [ "$1" = "renew" ]; then
    log_info "Обновление SSL сертификатов..."
    sudo certbot renew --quiet --nginx
    sudo systemctl reload nginx
    log_success "Сертификаты обновлены"
elif [ "$1" = "status" ]; then
    log_info "Статус SSL сертификатов:"
    sudo certbot certificates
else
    main
fi
