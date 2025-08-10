# Развертывание Excel Course на Ubuntu

Этот документ содержит инструкции по развертыванию проекта Excel Course на Ubuntu сервере с использованием Docker для изоляции среды.

## Требования

- Ubuntu 20.04 или новее
- Docker и Docker Compose
- Nginx
- Домен `excel-edu.ru` с настроенным DNS

## Быстрое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

### 2. Клонирование проекта

```bash
# Клонирование репозитория
git clone <your-repo-url> excel-course
cd excel-course

# Сделать скрипты исполняемыми
chmod +x deploy.sh setup-ssl.sh
```

### 3. Настройка DNS

Убедитесь, что домен `excel-edu.ru` указывает на IP-адрес вашего сервера:

```bash
# Проверка DNS
nslookup excel-edu.ru
```

### 4. Развертывание проекта

```bash
# Запуск развертывания
sudo ./deploy.sh deploy
```

### 5. Настройка SSL сертификатов

```bash
# Настройка SSL (выполняется после развертывания)
sudo ./setup-ssl.sh
```

## Структура развертывания

### Docker контейнеры

- **excel-course-app**: Основное приложение Next.js
- **excel-course-db**: База данных PostgreSQL

### Порты

- **3500**: Порт публикации приложения на хосте (Nginx проксирует сюда)
- **5432**: Порт базы данных (только внутри Docker)

### Файловая структура

```
/var/www/excel-edu.ru/
├── public/
│   └── uploads/
│       ├── assignments/
│       └── submissions/
```

## Управление проектом

### Основные команды

```bash
# Запуск проекта
./manage.sh start

# Остановка проекта
./manage.sh stop

# Перезапуск проекта
./manage.sh restart

# Просмотр логов
./manage.sh logs

# Статус контейнеров
./manage.sh status

# Создание резервной копии
./manage.sh backup

# Обновление проекта
./manage.sh update
```

### SSL сертификаты

```bash
# Проверка статуса сертификатов
sudo ./setup-ssl.sh status

# Ручное обновление сертификатов
sudo ./setup-ssl.sh renew
```

## Мониторинг и логи

### Просмотр логов приложения

```bash
# Логи приложения
docker-compose logs -f app

# Логи базы данных
docker-compose logs -f db

# Все логи
docker-compose logs -f
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Использование памяти
free -h
```

## Резервное копирование

### Автоматическое резервное копирование

Создайте cron задачу для автоматического резервного копирования:

```bash
# Добавление в crontab
(crontab -l 2>/dev/null; echo "0 2 * * * cd /path/to/excel-course && ./manage.sh backup") | crontab -
```

### Ручное резервное копирование

```bash
# Резервная копия базы данных
./manage.sh backup

# Резервная копия файлов загрузок
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads/
```

## Обновление проекта

### Автоматическое обновление

```bash
# Обновление с пересборкой
./manage.sh update
```

### Ручное обновление

```bash
# Получение изменений
git pull

# Остановка контейнеров
docker-compose down

# Пересборка образов
docker-compose build --no-cache

# Запуск контейнеров
docker-compose up -d

# Применение миграций
docker-compose exec app npx prisma migrate deploy
```

## Устранение неполадок

### Проблемы с Docker

```bash
# Очистка Docker
docker system prune -a

# Перезапуск Docker
sudo systemctl restart docker
```

### Проблемы с базой данных

```bash
# Проверка подключения к БД
docker-compose exec app npx prisma db push

# Сброс базы данных
docker-compose exec app npx prisma migrate reset --force
```

### Проблемы с nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Перезапуск nginx
sudo systemctl restart nginx

# Просмотр логов
sudo tail -f /var/log/nginx/error.log
```

### Проблемы с SSL

```bash
# Проверка сертификатов
sudo certbot certificates

# Обновление сертификатов
sudo ./setup-ssl.sh renew
```

## Безопасность

### Рекомендации

1. **Регулярно обновляйте систему**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Настройте firewall**:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

3. **Мониторинг безопасности**:
   ```bash
   # Установка fail2ban
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Регулярные резервные копии**:
   - База данных
   - Файлы загрузок
   - Конфигурационные файлы

### Переменные окружения

Важные переменные в `.env` файле:

- `NEXTAUTH_SECRET`: Секретный ключ для аутентификации
- `DATABASE_URL`: URL подключения к базе данных
- `NEXTAUTH_URL`: Публичный URL приложения (например, https://excel-edu.ru)
- `AUTH_URL`: Публичный URL для Auth.js (дублирование на случай провайдеров)
- `AUTH_TRUST_HOST`: должно быть `true` в продакшене

Nginx должен прокидывать заголовки: `Host`, `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Port`.

## Производительность

### Оптимизация

1. **Кэширование nginx**:
   - Статические файлы кэшируются на 1 год
   - API запросы кэшируются на 5 минут

2. **Сжатие**:
   - Gzip сжатие включено для всех текстовых файлов

3. **Мониторинг**:
   - Используйте `docker stats` для мониторинга ресурсов
   - Настройте алерты при превышении лимитов

## Поддержка

При возникновении проблем:

1. Проверьте логи: `./manage.sh logs`
2. Проверьте статус контейнеров: `./manage.sh status`
3. Проверьте конфигурацию nginx: `sudo nginx -t`
4. Проверьте SSL сертификаты: `sudo ./setup-ssl.sh status`

## Полезные команды

```bash
# Просмотр всех контейнеров
docker ps -a

# Просмотр образов
docker images

# Очистка неиспользуемых ресурсов
docker system prune

# Просмотр использования диска
docker system df

# Просмотр сетей
docker network ls

# Просмотр томов
docker volume ls
```
