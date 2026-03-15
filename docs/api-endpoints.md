# API Endpoints - Survey API

## Аутентификация

### POST /api/auth/register
Регистрация нового пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:** 201 Created
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/login
Вход в систему

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token_here"
}
```

## Опросы

### GET /api/surveys
Получить список опросов с фильтрацией и пагинацией

**Query Parameters:**
- `page` (number) - номер страницы (default: 1)
- `limit` (number) - количество на странице (default: 10)
- `status` (string) - фильтр по статусу: draft, published, closed
- `my` (boolean) - только мои опросы
- `sort` (string) - сортировка: created_at, responses_count

**Response:** 200 OK
```json
{
  "surveys": [
    {
      "id": 1,
      "title": "Опрос удовлетворенности",
      "description": "Оцените наш сервис",
      "status": "published",
      "author_id": 1,
      "created_at": "2026-03-15T10:00:00Z",
      "responses_count": 42
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### POST /api/surveys
Создать новый опрос (требуется авторизация)

**Request Body:**
```json
{
  "title": "Название опроса",
  "description": "Описание опроса"
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "title": "Название опроса",
  "description": "Описание опроса",
  "status": "draft",
  "author_id": 1,
  "created_at": "2026-03-15T10:00:00Z"
}
```

### GET /api/surveys/:id
Получить детальную информацию об опросе

**Response:** 200 OK
```json
{
  "id": 1,
  "title": "Название опроса",
  "description": "Описание опроса",
  "status": "published",
  "author_id": 1,
  "created_at": "2026-03-15T10:00:00Z",
  "questions": [
    {
      "id": 1,
      "text": "Как вам наш сервис?",
      "type": "single_choice",
      "order": 1,
      "options": [
        {"id": 1, "text": "Отлично"},
        {"id": 2, "text": "Хорошо"},
        {"id": 3, "text": "Плохо"}
      ]
    }
  ]
}
```

### PUT /api/surveys/:id
Обновить опрос (только в статусе draft)

**Request Body:**
```json
{
  "title": "Новое название",
  "description": "Новое описание"
}
```

**Response:** 200 OK

### DELETE /api/surveys/:id
Удалить опрос

**Response:** 204 No Content

### POST /api/surveys/:id/publish
Опубликовать опрос (изменить статус draft → published)

**Response:** 200 OK
```json
{
  "id": 1,
  "status": "published"
}
```

### POST /api/surveys/:id/close
Закрыть опрос (изменить статус published → closed)

**Response:** 200 OK
```json
{
  "id": 1,
  "status": "closed"
}
```

## Вопросы

### POST /api/surveys/:surveyId/questions
Добавить вопрос к опросу

**Request Body:**
```json
{
  "text": "Текст вопроса",
  "type": "single_choice",
  "order": 1,
  "options": [
    {"text": "Вариант 1"},
    {"text": "Вариант 2"}
  ]
}
```

**Типы вопросов:**
- `single_choice` - одиночный выбор
- `multiple_choice` - множественный выбор
- `text` - текстовый ответ

**Response:** 201 Created
```json
{
  "id": 1,
  "survey_id": 1,
  "text": "Текст вопроса",
  "type": "single_choice",
  "order": 1,
  "options": [
    {"id": 1, "text": "Вариант 1"},
    {"id": 2, "text": "Вариант 2"}
  ]
}
```

### PUT /api/questions/:id
Обновить вопрос (только если опрос в статусе draft)

**Request Body:**
```json
{
  "text": "Новый текст вопроса",
  "order": 2
}
```

**Response:** 200 OK

### DELETE /api/questions/:id
Удалить вопрос

**Response:** 204 No Content

## Прохождение опросов

### GET /api/surveys/:id/take
Получить опрос для прохождения (только published опросы)

**Response:** 200 OK
```json
{
  "id": 1,
  "title": "Название опроса",
  "description": "Описание",
  "questions": [
    {
      "id": 1,
      "text": "Вопрос 1",
      "type": "single_choice",
      "options": [
        {"id": 1, "text": "Вариант 1"},
        {"id": 2, "text": "Вариант 2"}
      ]
    }
  ]
}
```

### POST /api/surveys/:id/submit
Отправить ответы на опрос

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": 1,
      "option_ids": [1]
    },
    {
      "question_id": 2,
      "option_ids": [3, 4]
    },
    {
      "question_id": 3,
      "text_answer": "Мой текстовый ответ"
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "message": "Ответы успешно сохранены",
  "response_id": 1
}
```

## Аналитика

### GET /api/surveys/:id/results
Получить результаты опроса (только для автора)

**Response:** 200 OK
```json
{
  "survey_id": 1,
  "total_responses": 42,
  "questions": [
    {
      "id": 1,
      "text": "Как вам наш сервис?",
      "type": "single_choice",
      "statistics": {
        "total_answers": 42,
        "options": [
          {
            "id": 1,
            "text": "Отлично",
            "count": 25,
            "percentage": 59.5
          },
          {
            "id": 2,
            "text": "Хорошо",
            "count": 15,
            "percentage": 35.7
          },
          {
            "id": 3,
            "text": "Плохо",
            "count": 2,
            "percentage": 4.8
          }
        ]
      }
    },
    {
      "id": 2,
      "text": "Что улучшить?",
      "type": "text",
      "answers": [
        "Добавить больше функций",
        "Улучшить дизайн",
        "..."
      ]
    }
  ]
}
```

### GET /api/surveys/:id/export
Экспортировать результаты в JSON

**Response:** 200 OK
```json
{
  "survey": {...},
  "responses": [...],
  "exported_at": "2026-03-15T10:00:00Z"
}
```

## Коды ответов

- `200 OK` - успешный запрос
- `201 Created` - ресурс создан
- `204 No Content` - успешное удаление
- `400 Bad Request` - ошибка валидации
- `401 Unauthorized` - требуется авторизация
- `403 Forbidden` - нет прав доступа
- `404 Not Found` - ресурс не найден
- `409 Conflict` - конфликт (например, повторное прохождение опроса)
- `500 Internal Server Error` - ошибка сервера
