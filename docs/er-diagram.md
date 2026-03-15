# ER-диаграмма базы данных Survey API

## Описание таблиц

### users
Таблица пользователей системы

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| email | VARCHAR(255) UNIQUE NOT NULL | Email пользователя |
| password_hash | VARCHAR(255) NOT NULL | Хеш пароля |
| name | VARCHAR(255) NOT NULL | Имя пользователя |
| created_at | TIMESTAMP DEFAULT NOW() | Дата регистрации |

### surveys
Таблица опросов

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| title | VARCHAR(500) NOT NULL | Название опроса |
| description | TEXT | Описание опроса |
| status | VARCHAR(20) NOT NULL | Статус: draft, published, closed |
| author_id | INTEGER NOT NULL | FK -> users.id |
| created_at | TIMESTAMP DEFAULT NOW() | Дата создания |
| published_at | TIMESTAMP | Дата публикации |
| closed_at | TIMESTAMP | Дата закрытия |

### questions
Таблица вопросов

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| survey_id | INTEGER NOT NULL | FK -> surveys.id |
| text | TEXT NOT NULL | Текст вопроса |
| type | VARCHAR(20) NOT NULL | Тип: single_choice, multiple_choice, text |
| order | INTEGER NOT NULL | Порядковый номер вопроса |
| created_at | TIMESTAMP DEFAULT NOW() | Дата создания |

### question_options
Таблица вариантов ответов для вопросов с выбором

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| question_id | INTEGER NOT NULL | FK -> questions.id |
| text | VARCHAR(500) NOT NULL | Текст варианта ответа |
| order | INTEGER NOT NULL | Порядковый номер варианта |
| created_at | TIMESTAMP DEFAULT NOW() | Дата создания |

### survey_responses
Таблица прохождений опросов (один респондент - один опрос)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| survey_id | INTEGER NOT NULL | FK -> surveys.id |
| respondent_id | INTEGER NOT NULL | FK -> users.id |
| submitted_at | TIMESTAMP DEFAULT NOW() | Дата прохождения |
| UNIQUE(survey_id, respondent_id) | | Один пользователь может пройти опрос только раз |

### question_answers
Таблица ответов на вопросы

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор |
| response_id | INTEGER NOT NULL | FK -> survey_responses.id |
| question_id | INTEGER NOT NULL | FK -> questions.id |
| option_id | INTEGER | FK -> question_options.id (NULL для text) |
| text_answer | TEXT | Текстовый ответ (для type=text) |
| created_at | TIMESTAMP DEFAULT NOW() | Дата ответа |

## Связи между таблицами

```
users (1) ----< (N) surveys
  - Один пользователь может создать много опросов
  - author_id в surveys ссылается на users.id

surveys (1) ----< (N) questions
  - Один опрос содержит много вопросов
  - survey_id в questions ссылается на surveys.id

questions (1) ----< (N) question_options
  - Один вопрос может иметь много вариантов ответов
  - question_id в question_options ссылается на questions.id

surveys (1) ----< (N) survey_responses
  - Один опрос может иметь много прохождений
  - survey_id в survey_responses ссылается на surveys.id

users (1) ----< (N) survey_responses
  - Один пользователь может пройти много опросов
  - respondent_id в survey_responses ссылается на users.id

survey_responses (1) ----< (N) question_answers
  - Одно прохождение содержит много ответов на вопросы
  - response_id в question_answers ссылается на survey_responses.id

questions (1) ----< (N) question_answers
  - На один вопрос может быть много ответов (от разных респондентов)
  - question_id в question_answers ссылается на questions.id

question_options (1) ----< (N) question_answers
  - Один вариант ответа может быть выбран много раз
  - option_id в question_answers ссылается на question_options.id
```

## Индексы

Для оптимизации производительности:

- `surveys.author_id` - для быстрого поиска опросов автора
- `surveys.status` - для фильтрации по статусу
- `questions.survey_id` - для получения вопросов опроса
- `question_options.question_id` - для получения вариантов вопроса
- `survey_responses(survey_id, respondent_id)` - уникальный индекс
- `question_answers.response_id` - для получения всех ответов прохождения
- `question_answers.question_id` - для аналитики по вопросу

## Визуальная диаграмма

Для визуализации можно использовать dbdiagram.io со следующим кодом:

```dbml
Table users {
  id serial [pk, increment]
  email varchar(255) [unique, not null]
  password_hash varchar(255) [not null]
  name varchar(255) [not null]
  created_at timestamp [default: `now()`]
}

Table surveys {
  id serial [pk, increment]
  title varchar(500) [not null]
  description text
  status varchar(20) [not null]
  author_id integer [not null, ref: > users.id]
  created_at timestamp [default: `now()`]
  published_at timestamp
  closed_at timestamp
}

Table questions {
  id serial [pk, increment]
  survey_id integer [not null, ref: > surveys.id]
  text text [not null]
  type varchar(20) [not null]
  order integer [not null]
  created_at timestamp [default: `now()`]
}

Table question_options {
  id serial [pk, increment]
  question_id integer [not null, ref: > questions.id]
  text varchar(500) [not null]
  order integer [not null]
  created_at timestamp [default: `now()`]
}

Table survey_responses {
  id serial [pk, increment]
  survey_id integer [not null, ref: > surveys.id]
  respondent_id integer [not null, ref: > users.id]
  submitted_at timestamp [default: `now()`]
  
  indexes {
    (survey_id, respondent_id) [unique]
  }
}

Table question_answers {
  id serial [pk, increment]
  response_id integer [not null, ref: > survey_responses.id]
  question_id integer [not null, ref: > questions.id]
  option_id integer [ref: > question_options.id]
  text_answer text
  created_at timestamp [default: `now()`]
}
```

Ссылка на dbdiagram.io: https://dbdiagram.io/d (вставьте код выше)
