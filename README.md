# Survey API - Сервис опросов и голосований

**Автор:** Bakeev Pavel, группа 1ИСП-21  
**Преддипломная практика - Бэкенд-разработка 2026**

## Описание проекта

REST API для сервиса опросов и голосований, позволяющий создавать анкеты с различными типами вопросов, собирать ответы от респондентов и анализировать результаты.

### Основные возможности

- 🔐 Регистрация и JWT-авторизация
- 📝 Создание опросов с различными типами вопросов
- 🔄 Управление жизненным циклом опроса (черновик → опубликован → закрыт)
- ✅ Прохождение опросов респондентами
- 📊 Аналитика и статистика по результатам
- 🔍 Фильтрация и пагинация

### Типы вопросов

- **Одиночный выбор** - выбор одного варианта из списка
- **Множественный выбор** - выбор нескольких вариантов
- **Текстовый ответ** - свободный текстовый ответ

## Технологический стек

- **Backend:** Node.js + Express.js
- **База данных:** PostgreSQL
- **Аутентификация:** JWT
- **Документация:** Swagger/OpenAPI
- **Контейнеризация:** Docker + Docker Compose
- **Тестирование:** Jest + Supertest

## Быстрый старт

### Требования

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Docker и Docker Compose (опционально)

### Установка и запуск

#### Вариант 1: С использованием Docker (рекомендуется)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd BakeevPractika2026

# Запустить проект
docker-compose up
```

API будет доступен по адресу: `http://localhost:3000`

#### Вариант 2: Локальная установка

```bash
# Установить зависимости
npm install

# Создать файл .env на основе .env.example
cp .env.example .env

# Настроить переменные окружения в .env

# Запустить миграции
npm run migrate

# Загрузить тестовые данные (опционально)
npm run seed

# Запустить сервер в режиме разработки
npm run dev
```

### Запуск тестов

```bash
npm test
```

## Документация API

После запуска проекта документация Swagger доступна по адресу:
```
http://localhost:3000/api-docs
```

## Структура проекта

```
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── docs/
│   ├── er-diagram.png
│   └── api-endpoints.md
├── src/
│   ├── index.js
│   ├── config/
│   │   └── database.js
│   ├── database/
│   │   ├── migrations/
│   │   └── seed.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── surveys.js
│   │   ├── questions.js
│   │   └── responses.js
│   ├── controllers/
│   ├── models/
│   └── utils/
└── tests/
    ├── auth.test.js
    ├── surveys.test.js
    └── responses.test.js
```

## ER-диаграмма

См. файл `docs/er-diagram.png` или [dbdiagram.io ссылка]

## Основные эндпоинты

Подробное описание см. в `docs/api-endpoints.md`

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Опросы
- `GET /api/surveys` - Список опросов
- `POST /api/surveys` - Создать опрос
- `GET /api/surveys/:id` - Получить опрос
- `PUT /api/surveys/:id` - Обновить опрос
- `DELETE /api/surveys/:id` - Удалить опрос
- `POST /api/surveys/:id/publish` - Опубликовать опрос
- `POST /api/surveys/:id/close` - Закрыть опрос

### Вопросы
- `POST /api/surveys/:id/questions` - Добавить вопрос
- `PUT /api/questions/:id` - Обновить вопрос
- `DELETE /api/questions/:id` - Удалить вопрос

### Прохождение опросов
- `GET /api/surveys/:id/take` - Получить опрос для прохождения
- `POST /api/surveys/:id/submit` - Отправить ответы

### Аналитика
- `GET /api/surveys/:id/results` - Результаты опроса
- `GET /api/surveys/:id/export` - Экспорт в JSON

## Лицензия

MIT
