const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Survey API - Сервис опросов и голосований',
      version: '1.0.0',
      description: `
REST API для сервиса опросов и голосований.

## Возможности
- Регистрация и JWT-авторизация
- Создание опросов с различными типами вопросов
- Управление жизненным циклом опроса (черновик → опубликован → закрыт)
- Прохождение опросов респондентами
- Аналитика и статистика по результатам

## Автор
Bakeev Pavel, группа 1ИСП-21
Преддипломная практика - Бэкенд-разработка 2026
      `,
      contact: {
        name: 'Bakeev Pavel',
        email: 'author@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Регистрация и авторизация пользователей'
      },
      {
        name: 'Surveys',
        description: 'Управление опросами'
      },
      {
        name: 'Questions',
        description: 'Управление вопросами в опросах'
      },
      {
        name: 'Responses',
        description: 'Прохождение опросов и просмотр результатов'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите JWT токен, полученный при регистрации или входе'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID пользователя'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя'
            },
            name: {
              type: 'string',
              description: 'Имя пользователя'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Дата регистрации'
            }
          }
        },
        Survey: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID опроса'
            },
            title: {
              type: 'string',
              description: 'Название опроса'
            },
            description: {
              type: 'string',
              description: 'Описание опроса'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'closed'],
              description: 'Статус опроса'
            },
            author_id: {
              type: 'integer',
              description: 'ID автора опроса'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            published_at: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            closed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true
            }
          }
        },
        Question: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID вопроса'
            },
            survey_id: {
              type: 'integer',
              description: 'ID опроса'
            },
            text: {
              type: 'string',
              description: 'Текст вопроса'
            },
            type: {
              type: 'string',
              enum: ['single_choice', 'multiple_choice', 'text'],
              description: 'Тип вопроса'
            },
            order: {
              type: 'integer',
              description: 'Порядковый номер вопроса'
            },
            options: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/QuestionOption'
              }
            }
          }
        },
        QuestionOption: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            text: {
              type: 'string'
            },
            order: {
              type: 'integer'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Сообщение об ошибке'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Детали ошибки валидации'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Требуется авторизация',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Нет прав доступа',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ресурс не найден',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Ошибка валидации',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
