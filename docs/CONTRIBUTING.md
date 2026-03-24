# Руководство по разработке

## Работа с Git

### Структура веток
- `main` - основная ветка, содержит стабильный код
- `dev` - ветка разработки, вся работа ведется здесь

### Процесс работы

1. **Клонирование репозитория**
```bash
git clone <your-repo-url>
cd BakeevPractika2026
```

2. **Переключение на ветку dev**
```bash
git checkout dev
```

3. **Внесение изменений**
```bash
# Работайте над кодом
# После завершения этапа:
git add .
git commit -m "feat: описание изменений"
git push origin dev
```

4. **Создание Merge Request**
- Откройте GitHub
- Создайте Pull Request: `dev → main`
- Дождитесь ревью от преподавателя

### Соглашения о коммитах

Используем [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `test:` - добавление/изменение тестов
- `refactor:` - рефакторинг кода
- `style:` - форматирование кода
- `ci:` - изменения в CI/CD
- `chore:` - прочие изменения

**Примеры:**
```bash
git commit -m "feat: добавлена регистрация пользователей"
git commit -m "fix: исправлена валидация email"
git commit -m "test: добавлены тесты для опросов"
git commit -m "docs: обновлен README"
```

## Локальная разработка

### Установка зависимостей
```bash
npm install
```

### Настройка окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### Запуск базы данных
```bash
# Через Docker
docker-compose up -d db

# Или установите PostgreSQL локально
```

### Миграции
```bash
npm run migrate
npm run seed  # Загрузить тестовые данные
```

### Запуск сервера
```bash
npm run dev  # Режим разработки с hot-reload
npm start    # Продакшн режим
```

### Запуск тестов
```bash
npm test              # Все тесты
npm test -- --watch   # Watch режим
npm test auth.test.js # Конкретный файл
```

## Структура проекта

```
src/
├── config/          # Конфигурация (БД, и т.д.)
├── controllers/     # Бизнес-логика
├── database/        # Миграции и сиды
├── middleware/      # Middleware (auth, validation)
├── routes/          # Определение маршрутов
├── utils/           # Утилиты (JWT, и т.д.)
└── index.js         # Точка входа

tests/               # Автотесты
docs/                # Документация
```

## Чеклист перед коммитом

- [ ] Код работает без ошибок
- [ ] Добавлены/обновлены тесты
- [ ] Все тесты проходят (`npm test`)
- [ ] Код отформатирован
- [ ] Обновлена документация (если нужно)
- [ ] Осмысленное сообщение коммита

## Чеклист перед Merge Request

- [ ] Ветка `dev` обновлена с `main`
- [ ] Все тесты проходят
- [ ] Нет конфликтов с `main`
- [ ] Код прошел самопроверку
- [ ] Добавлено описание изменений в MR

## Полезные команды

```bash
# Просмотр истории коммитов
git log --oneline --graph

# Проверка статуса
git status

# Просмотр изменений
git diff

# Отмена изменений
git checkout -- <file>

# Просмотр веток
git branch -a

# Обновление из main
git checkout dev
git merge main
```

## Отладка

### Просмотр логов Docker
```bash
docker-compose logs -f api
docker-compose logs -f db
```

### Подключение к БД
```bash
docker-compose exec db psql -U postgres -d survey_db
```

### Проверка работы API
```bash
# Через curl
curl http://localhost:3000/

# Через Postman
# Импортируйте коллекцию из docs/postman/
```

## Получение помощи

- Документация API: http://localhost:3000/api-docs
- README проекта: [README.md](../README.md)
- ER-диаграмма: [docs/er-diagram.md](er-diagram.md)
- API эндпоинты: [docs/api-endpoints.md](api-endpoints.md)
