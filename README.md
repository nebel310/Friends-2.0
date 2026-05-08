# Friends 2.0

## Описание проекта

Friends 2.0 — это веб-приложение для управления дружескими связями и челленджами между пользователями. Система позволяет пользователям регистрироваться, добавлять друзей, создавать челленджи, загружать доказательства выполнения и проводить модерацию выполненных заданий.

## Инструкция по запуску

### Требования
- Docker
- Docker Compose

### Запуск проекта

1. Создайте .env и скопируйте содержимое для него из телеграма @vlados7529

2. Запустите проект с помощью Docker Compose:
```bash
docker-compose up -d --build
```

3. После запуска сервисы будут доступны по следующим адресам:
   - Фронтенд: http://localhost:3002
   - Бэкенд API: http://localhost:3001/docs
   - База данных PostgreSQL: localhost:3000
   - MinIO Console: http://localhost:3111

4. Для остановки проекта:
```bash
docker-compose down
```


## Модели базы данных

### Пользователи
- `users`: Основная информация о пользователях
- `refresh_tokens`: Refresh токены для обновления access токенов
- `blacklisted_tokens`: Черный список отозванных токенов

### Друзья
- `friendship_statuses`: Статусы дружеских связей (pending, accepted, blocked)
- `friendships`: Дружеские связи между пользователями

### Челленджи
- `challenge_statuses`: Статусы челленджей (pending, accepted, completed, approved, rejected)
- `challenges`: Созданные челленджи
- `proofs`: Доказательства выполнения челленджей (файлы)
- `reviews`: Модерация выполненных челленджей

## Описание роутов API

### Аутентификация (`/auth`)
- `POST /auth/register` - регистрация нового пользователя
- `POST /auth/login` - вход в систему
- `POST /auth/logout` - выход из системы
- `GET /auth/me` - информация о текущем пользователе
- `GET /auth/confirm` - подтверждение email

### Друзья (`/friends`)
- `GET /friends/` - список друзей
- `GET /friends/get_requests` - входящие заявки в друзья
- `POST /friends/send_requests` - отправка заявки в друзья
- `PATCH /friends/requests/{id}/accept` - принятие заявки
- `DELETE /friends/requests/{id}/delete` - удаление друга или заявки
- `GET /friends/blocked` - список заблокированных пользователей

### Челленджи (`/challenges`)
- `POST /challenges` - создание челленджа
- `GET /challenges` - список челленджей
- `GET /challenges/{id}` - детали челленджа
- `POST /challenges/{id}/accept` - принятие челленджа
- `POST /challenges/{id}/complete` - завершение челленджа
- `DELETE /challenges/{id}` - удаление челленджа

### Доказательства (`/challenges/{id}/proofs`)
- `POST /challenges/{id}/proofs` - добавление доказательств
- `DELETE /challenges/{id}/proofs/{proof_id}` - удаление доказательства

### Модерация (`/reviews`)
- `POST /reviews/challenges/{id}` - создание отзыва на выполненный челлендж
- `GET /reviews/challenges/{id}` - список отзывов по челленджу
- `GET /reviews/{id}` - детали отзыва
- `DELETE /reviews/{id}` - удаление отзыва

### Файлы (`/files`)
- `POST /files/upload` - загрузка файла в MinIO
- `GET /files/download/{name}` - скачивание файла
- `DELETE /files/{name}` - удаление файла

## Фронтенд-экраны

### Главная страница (`index.html`)
- Проверка авторизации и перенаправление

### Аутентификация
- `login.html` - форма входа в систему
- `register.html` - форма регистрации

### Основные разделы
- `friends.html` - управление друзьями, отправка заявок
- `friend-requests.html` - просмотр и обработка входящих заявок
- `challenges.html` - список челленджей с фильтрацией
- `create-challenge.html` - создание нового челленджа
- `challenge-detail.html` - детальная информация о челлендже

## Технологии

### Бэкенд
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy (асинхронный)
- MinIO (объектное хранилище)
- JWT аутентификация

### Фронтенд
- Vanilla JavaScript
- HTML/CSS
- Nginx (сервер статики)

### Инфраструктура
- Docker
- Docker Compose
- GitHub Actions (CI/CD)