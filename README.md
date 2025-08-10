# Excel Course - Платформа обучения

Интерактивная платформа для изучения Excel с модулями, уроками, тестами и практическими заданиями.

## 🚀 Быстрый деплой на Ubuntu сервер

### Автоматический деплой

1. **Скопируйте проект на сервер:**
```bash
git clone <your-repo-url>
cd excel-course
```

2. **Запустите скрипт деплоя:**
```bash
sudo ./deploy.sh
```

Скрипт автоматически:
- ✅ Установит все зависимости (Node.js, PM2, PostgreSQL)
- ✅ Настроит базу данных
- ✅ Соберет проект
- ✅ Настроит PM2 для автозапуска
- ✅ Настроит Nginx для проксирования на `/course`
- ✅ Проверит работоспособность

### Ручной деплой

Если нужен ручной контроль:

1. **Установите зависимости:**
```bash
sudo apt update
sudo apt install -y nodejs npm postgresql nginx
sudo npm install -g pm2
```

2. **Настройте базу данных:**
```bash
sudo -u postgres psql -c "CREATE USER artemiszeep WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE excel_course OWNER artemiszeep;"
```

3. **Соберите проект:**
```bash
npm install
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
}
```

## 📋 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── admin/             # Админ панель
│   ├── dashboard/         # Студенческая панель
│   └── modules/           # Модули курса
├── components/            # React компоненты
├── lib/                   # Утилиты и конфигурация
└── types/                 # TypeScript типы
```

## 🔧 Управление

### PM2 команды
```bash
pm2 status                    # Статус процессов
pm2 logs excel-course         # Логи приложения
pm2 restart excel-course      # Перезапуск
pm2 stop excel-course         # Остановка
```

### Nginx команды
```bash
nginx -t                      # Проверка конфигурации
sudo systemctl reload nginx   # Перезагрузка
sudo systemctl restart nginx  # Перезапуск
```

### База данных
```bash
npx prisma studio            # Веб-интерфейс для БД
npx prisma db push           # Применить миграции
npx prisma db seed           # Заполнить тестовыми данными
```

## 🌐 Доступ

После деплоя приложение будет доступно по адресу:
- **Основной сайт:** https://mapyg.ru
- **Курс Excel:** https://mapyg.ru/course
- **Админ панель:** https://mapyg.ru/course/admin

## 🔒 Безопасность

- Все API endpoints защищены аутентификацией
- Админские функции доступны только администраторам
- Файлы загружаются в безопасную директорию
- Автоматические бэкапы данных

## 📊 Мониторинг

- **Логи PM2:** `/var/log/pm2/`
- **Логи Nginx:** `/var/log/nginx/`
- **Бэкапы:** `/var/www/mapyg.ru/data/backups/`

## 🔄 Обновление

Для обновления приложения:

1. **Остановите приложение:**
```bash
pm2 stop excel-course
```

2. **Обновите код:**
```bash
cd /var/www/mapyg.ru/course
git pull
npm install
npm run build
```

3. **Обновите базу данных:**
```bash
npx prisma db push
```

4. **Запустите приложение:**
```bash
pm2 start excel-course
```

## 🆘 Устранение неполадок

### Приложение не запускается
```bash
pm2 logs excel-course        # Проверить логи
pm2 restart excel-course     # Перезапустить
```

### Nginx ошибки
```bash
nginx -t                      # Проверить конфигурацию
sudo systemctl status nginx  # Статус сервиса
```

### Проблемы с базой данных
```bash
sudo systemctl status postgresql  # Статус PostgreSQL
sudo -u postgres psql -d excel_course  # Подключение к БД
```
