# 🚀 Развертывание Excel Course на Ubuntu

Полный набор скриптов для автоматического развертывания Excel Course на Ubuntu сервере с использованием Docker для изоляции среды.

## 📋 Требования

- Ubuntu 20.04 или новее
- Минимум 5GB свободного места
- Домен `excel-edu.ru` с настроенным DNS
- Права администратора

## 🎯 Быстрая установка

### 1. Клонирование проекта

```bash
git clone <your-repo-url> excel-course
cd excel-course
```

### 2. Запуск автоматической установки

```bash
sudo ./install.sh
```

Этот скрипт автоматически выполнит все этапы:
- ✅ Обновление системы
- ✅ Установку Docker и зависимостей
- ✅ Настройку nginx и firewall
- ✅ Развертывание приложения
- ✅ Настройку SSL сертификатов
- ✅ Настройку мониторинга

## 📁 Структура скриптов

```
excel-course/
├── install.sh          # Главный скрипт установки
├── deploy.sh           # Скрипт развертывания приложения
├── setup-ssl.sh        # Настройка SSL сертификатов
├── health-check.sh     # Проверка состояния системы
├── manage.sh           # Управление приложением (создается автоматически)
├── DEPLOYMENT.md       # Подробная документация
└── README_DEPLOYMENT.md # Этот файл
```

## 🔧 Ручная установка (пошагово)

Если вы хотите выполнить установку пошагово:

### 1. Проверка системы

```bash
sudo ./install.sh --check
```

### 2. Развертывание приложения

```bash
sudo ./deploy.sh deploy
```

### 3. Настройка SSL

```bash
sudo ./setup-ssl.sh
```

### 4. Проверка состояния

```bash
./health-check.sh
```

## 🎮 Управление приложением

После установки доступны следующие команды:

### Глобальные команды

```bash
# Управление приложением
excel-course start      # Запуск
excel-course stop       # Остановка
excel-course restart    # Перезапуск
excel-course status     # Статус
excel-course logs       # Логи
excel-course backup     # Резервная копия
excel-course update     # Обновление
```

### Локальные команды

```bash
# В директории проекта
./manage.sh start       # Запуск
./manage.sh stop        # Остановка
./manage.sh restart     # Перезапуск
./manage.sh logs        # Логи
./manage.sh status      # Статус контейнеров
./manage.sh backup      # Резервная копия БД
./manage.sh update      # Обновление с Git
```

## 🔍 Мониторинг и диагностика

### Проверка состояния

```bash
# Полная проверка системы
./health-check.sh

# Проверка отдельных компонентов
./health-check.sh containers  # Docker контейнеры
./health-check.sh database    # База данных
./health-check.sh nginx       # Nginx
./health-check.sh ssl         # SSL сертификаты
./health-check.sh app         # Приложение
```

### Просмотр логов

```bash
# Логи приложения
docker-compose logs -f app

# Логи базы данных
docker-compose logs -f db

# Логи nginx
sudo tail -f /var/log/nginx/error.log

# Логи мониторинга
tail -f /var/log/excel-course-health.log
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

## 🔒 Безопасность

### SSL сертификаты

```bash
# Проверка статуса сертификатов
sudo ./setup-ssl.sh status

# Ручное обновление
sudo ./setup-ssl.sh renew
```

### Firewall

```bash
# Статус firewall
sudo ufw status

# Проверка открытых портов
sudo netstat -tlnp
```

### Fail2ban

```bash
# Статус fail2ban
sudo fail2ban-client status

# Проверка заблокированных IP
sudo fail2ban-client status nginx-http-auth
```

## 💾 Резервное копирование

### Автоматическое резервное копирование

```bash
# Добавление в cron (ежедневно в 2:00)
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/excel-course && ./manage.sh backup") | crontab -
```

### Ручное резервное копирование

```bash
# Резервная копия базы данных
./manage.sh backup

# Резервная копия файлов загрузок
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads/
```

## 🔄 Обновление

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

## 🛠️ Устранение неполадок

### Проблемы с Docker

```bash
# Очистка Docker
docker system prune -a

# Перезапуск Docker
sudo systemctl restart docker

# Проверка статуса
sudo systemctl status docker
```

### Проблемы с базой данных

```bash
# Проверка подключения
docker-compose exec app npx prisma db push

# Сброс базы данных
docker-compose exec app npx prisma migrate reset --force

# Проверка логов БД
docker-compose logs db
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

# Проверка срока действия
openssl x509 -enddate -noout -in /etc/letsencrypt/live/excel-edu.ru/fullchain.pem
```

## 📊 Архитектура развертывания

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │     Nginx       │    │   Docker App    │
│                 │────│   (Port 80/443) │────│   (Port 3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │  Docker DB      │
                                              │  (PostgreSQL)   │
                                              └─────────────────┘
```

### Порты

- **80**: HTTP (редирект на HTTPS)
- **443**: HTTPS (основной доступ)
- **3001**: Приложение (локально)
- **5432**: База данных (только внутри Docker)

### Файловая структура

```
/var/www/excel-edu.ru/
├── public/
│   └── uploads/
│       ├── assignments/     # Задания
│       └── submissions/     # Решения студентов
```

## 📈 Производительность

### Оптимизация

1. **Кэширование nginx**:
   - Статические файлы: 1 год
   - API запросы: 5 минут

2. **Сжатие**:
   - Gzip включено для всех текстовых файлов

3. **Мониторинг ресурсов**:
   - Автоматическая проверка каждые 6 часов
   - Логирование в `/var/log/excel-course-health.log`

## 🔧 Конфигурация

### Переменные окружения

Основные переменные в `.env`:

```env
DATABASE_URL=postgresql://excel_user:excel_password@db:5432/excel_course
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://excel-edu.ru
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=52428800
PASS_THRESHOLD_PERCENT=50
```

### Docker конфигурация

- **Приложение**: Node.js 18 Alpine
- **База данных**: PostgreSQL 15 Alpine
- **Сеть**: Изолированная Docker сеть
- **Тома**: Постоянное хранение данных БД

## 📞 Поддержка

### Полезные команды

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

### Логи для отладки

```bash
# Логи приложения
docker-compose logs -f app

# Логи базы данных
docker-compose logs -f db

# Логи nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи системы
sudo journalctl -u docker
sudo journalctl -u nginx
```

## 🎉 Готово!

После успешной установки:

1. ✅ Приложение доступно по адресу: **https://excel-edu.ru**
2. ✅ SSL сертификаты настроены автоматически
3. ✅ Мониторинг работает каждые 6 часов
4. ✅ Резервное копирование настроено
5. ✅ Firewall защищает систему

### Первые шаги

1. Откройте https://excel-edu.ru в браузере
2. Проверьте статус системы: `excel-course status`
3. Создайте первого администратора через интерфейс
4. Настройте модули и уроки

---

**🎯 Успешного развертывания! Ваша платформа обучения Excel готова к работе!**
