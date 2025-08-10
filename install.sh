#!/bin/bash

# Главный скрипт установки Excel Course на Ubuntu
# Автоматически выполняет все этапы развертывания

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Проверка прав администратора
check_sudo() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Этот скрипт должен выполняться с правами администратора"
        echo "Используйте: sudo $0"
        exit 1
    fi
}

# Проверка системы
check_system() {
    log_header "Проверка системы"
    
    # Проверка версии Ubuntu
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$NAME" == "Ubuntu" ]]; then
            log_success "Обнаружена Ubuntu $VERSION_ID"
        else
            log_warning "Система не Ubuntu, но скрипт может работать"
        fi
    else
        log_warning "Не удалось определить версию системы"
    fi
    
    # Проверка архитектуры
    ARCH=$(uname -m)
    log_info "Архитектура: $ARCH"
    
    # Проверка доступного места
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    AVAILABLE_SPACE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    log_info "Доступное место: ${AVAILABLE_SPACE_GB}GB"
    
    if [ $AVAILABLE_SPACE_GB -lt 5 ]; then
        log_error "Недостаточно места на диске (требуется минимум 5GB)"
        exit 1
    fi
}

# Обновление системы
update_system() {
    log_header "Обновление системы"
    
    log_info "Обновление списка пакетов..."
    apt update
    
    log_info "Обновление установленных пакетов..."
    apt upgrade -y
    
    log_success "Система обновлена"
}

# Установка зависимостей
install_dependencies() {
    log_header "Установка зависимостей"
    
    log_info "Установка основных пакетов..."
    apt install -y curl git wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    log_info "Установка nginx..."
    apt install -y nginx
    
    log_info "Установка certbot..."
    apt install -y certbot python3-certbot-nginx
    
    log_info "Установка дополнительных утилит..."
    apt install -y htop net-tools tree
    
    log_success "Зависимости установлены"
}

# Установка Docker
install_docker() {
    log_header "Установка Docker"
    
    log_info "Удаление старых версий Docker..."
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    log_info "Установка зависимостей Docker..."
    apt install -y ca-certificates curl gnupg lsb-release
    
    log_info "Добавление GPG ключа Docker..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    log_info "Настройка репозитория Docker..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    log_info "Обновление списка пакетов..."
    apt update
    
    log_info "Установка Docker..."
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    log_info "Запуск Docker..."
    systemctl start docker
    systemctl enable docker
    
    log_info "Добавление пользователя в группу docker..."
    usermod -aG docker $SUDO_USER
    
    log_success "Docker установлен и запущен"
}

# Установка Docker Compose
install_docker_compose() {
    log_header "Установка Docker Compose"
    
    log_info "Загрузка Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    log_info "Установка прав на выполнение..."
    chmod +x /usr/local/bin/docker-compose
    
    log_info "Создание символической ссылки..."
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose установлен"
}

# Настройка firewall
setup_firewall() {
    log_header "Настройка firewall"
    
    log_info "Установка ufw..."
    apt install -y ufw
    
    log_info "Настройка правил firewall..."
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 3001/tcp
    
    log_info "Включение firewall..."
    ufw --force enable
    
    log_success "Firewall настроен"
}

# Настройка nginx
setup_nginx() {
    log_header "Настройка nginx"
    
    log_info "Создание директорий..."
    mkdir -p /var/www/${DOMAIN}/public/uploads/{assignments,submissions}
    chown -R www-data:www-data /var/www/${DOMAIN}
    
    log_info "Настройка прав доступа..."
    chmod -R 755 /var/www/${DOMAIN}
    
    log_success "Nginx настроен"
}

# Проверка DNS
check_dns() {
    log_header "Проверка DNS"
    
    log_info "Проверка домена ${DOMAIN}..."
    if nslookup ${DOMAIN} > /dev/null 2>&1; then
        log_success "Домен ${DOMAIN} доступен"
    else
        log_warning "Домен ${DOMAIN} недоступен"
        log_info "Убедитесь, что DNS настроен правильно перед продолжением"
        read -p "Продолжить установку? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Развертывание приложения
deploy_application() {
    log_header "Развертывание приложения"
    
    log_info "Запуск скрипта развертывания..."
    ./deploy.sh deploy
    
    log_success "Приложение развернуто"
}

# Настройка SSL
setup_ssl() {
    log_header "Настройка SSL сертификатов"
    
    log_info "Запуск скрипта настройки SSL..."
    ./setup-ssl.sh
    
    log_success "SSL сертификаты настроены"
}

# Настройка мониторинга
setup_monitoring() {
    log_header "Настройка мониторинга"
    
    log_info "Установка fail2ban..."
    apt install -y fail2ban
    
    log_info "Настройка fail2ban..."
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log_info "Создание cron задач для мониторинга..."
    (crontab -l 2>/dev/null; echo "0 */6 * * * cd $(pwd) && ./health-check.sh > /var/log/excel-course-health.log 2>&1") | crontab -
    
    log_success "Мониторинг настроен"
}

# Создание скриптов управления
create_management_scripts() {
    log_header "Создание скриптов управления"
    
    log_info "Создание скрипта быстрого управления..."
    cat > /usr/local/bin/excel-course << 'EOF'
#!/bin/bash

case "$1" in
    start)
        cd /opt/excel-course && ./manage.sh start
        ;;
    stop)
        cd /opt/excel-course && ./manage.sh stop
        ;;
    restart)
        cd /opt/excel-course && ./manage.sh restart
        ;;
    status)
        cd /opt/excel-course && ./health-check.sh
        ;;
    logs)
        cd /opt/excel-course && ./manage.sh logs
        ;;
    backup)
        cd /opt/excel-course && ./manage.sh backup
        ;;
    update)
        cd /opt/excel-course && ./manage.sh update
        ;;
    *)
        echo "Использование: excel-course {start|stop|restart|status|logs|backup|update}"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/excel-course
    
    log_success "Скрипты управления созданы"
}

# Финальная проверка
final_check() {
    log_header "Финальная проверка"
    
    log_info "Проверка состояния системы..."
    ./health-check.sh
    
    log_success "Проверка завершена"
}

# Создание отчета об установке
create_install_report() {
    log_header "Создание отчета об установке"
    
    REPORT_FILE="install_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
Отчет об установке Excel Course
Дата установки: $(date)
Домен: ${DOMAIN}

=== Установленные компоненты ===
- Docker и Docker Compose
- Nginx
- PostgreSQL (в Docker)
- SSL сертификаты (Let's Encrypt)
- Fail2ban
- Мониторинг

=== Полезные команды ===
- Управление: excel-course {start|stop|restart|status|logs|backup|update}
- Проверка состояния: ./health-check.sh
- Просмотр логов: ./manage.sh logs
- Резервная копия: ./manage.sh backup

=== Доступ к приложению ===
- URL: https://${DOMAIN}
- Локальный порт: 3001

=== Файлы конфигурации ===
- Nginx: /etc/nginx/sites-available/${DOMAIN}
- SSL: /etc/letsencrypt/live/${DOMAIN}/
- Docker: docker-compose.yml
- Приложение: .env

=== Мониторинг ===
- Логи здоровья: /var/log/excel-course-health.log
- Cron задачи: crontab -l

=== Безопасность ===
- Firewall: ufw status
- Fail2ban: fail2ban-client status

Установка завершена успешно!
EOF

    log_success "Отчет создан: $REPORT_FILE"
}

# Основная функция установки
main() {
    log_header "Установка Excel Course"
    
    echo "Этот скрипт установит Excel Course на Ubuntu сервер."
    echo "Домен: ${DOMAIN}"
    echo ""
    echo "Установка включает:"
    echo "- Обновление системы"
    echo "- Установку Docker и зависимостей"
    echo "- Настройку nginx и SSL"
    echo "- Развертывание приложения"
    echo "- Настройку мониторинга"
    echo ""
    
    read -p "Продолжить установку? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Установка отменена"
        exit 0
    fi
    
    # Выполнение всех этапов установки
    check_sudo
    check_system
    update_system
    install_dependencies
    install_docker
    install_docker_compose
    setup_firewall
    setup_nginx
    check_dns
    deploy_application
    setup_ssl
    setup_monitoring
    create_management_scripts
    final_check
    create_install_report
    
    log_header "Установка завершена!"
    log_success "Excel Course успешно установлен на https://${DOMAIN}"
    log_info "Используйте команду 'excel-course status' для проверки состояния"
    log_info "Отчет об установке сохранен в файле install_report_*.txt"
}

# Обработка аргументов
case "$1" in
    --help|-h)
        echo "Использование: $0 [опции]"
        echo ""
        echo "Опции:"
        echo "  --help, -h     Показать эту справку"
        echo "  --check        Только проверить систему"
        echo "  --update       Обновить существующую установку"
        echo ""
        echo "Примеры:"
        echo "  sudo $0                    # Полная установка"
        echo "  sudo $0 --check            # Проверка системы"
        echo "  sudo $0 --update           # Обновление"
        ;;
    --check)
        check_sudo
        check_system
        check_dns
        log_success "Проверка завершена"
        ;;
    --update)
        log_header "Обновление Excel Course"
        check_sudo
        update_system
        deploy_application
        log_success "Обновление завершено"
        ;;
    *)
        main
        ;;
esac
