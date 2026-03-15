const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/config/database');

describe('Questions API', () => {
  let authToken;
  let surveyId;

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['questiontest@test.com']);

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'questiontest@test.com',
        password: 'password123',
        name: 'Question Test User'
      });

    authToken = registerResponse.body.token;

    const surveyResponse = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Опрос для тестирования вопросов',
        description: 'Тест'
      });

    surveyId = surveyResponse.body.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['questiontest@test.com']);
    await pool.end();
  });

  describe('POST /api/surveys/:surveyId/questions', () => {
    it('должен добавить вопрос с одиночным выбором', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Как вам наш сервис?',
          type: 'single_choice',
          order: 1,
          options: [
            { text: 'Отлично', order: 1 },
            { text: 'Хорошо', order: 2 },
            { text: 'Плохо', order: 3 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toBe('Как вам наш сервис?');
      expect(response.body.type).toBe('single_choice');
      expect(response.body.options).toHaveLength(3);
    });

    it('должен добавить вопрос с множественным выбором', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Какие функции вам нравятся?',
          type: 'multiple_choice',
          order: 2,
          options: [
            { text: 'Функция 1', order: 1 },
            { text: 'Функция 2', order: 2 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('multiple_choice');
    });

    it('должен добавить текстовый вопрос', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Что бы вы хотели улучшить?',
          type: 'text',
          order: 3
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('text');
      expect(response.body.options).toBeUndefined();
    });

    it('не должен добавить текстовый вопрос с вариантами ответов', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Текстовый вопрос',
          type: 'text',
          order: 4,
          options: [
            { text: 'Вариант 1' }
          ]
        });

      expect(response.status).toBe(400);
    });

    it('не должен добавить вопрос с выбором без вариантов', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Вопрос без вариантов',
          type: 'single_choice',
          order: 5,
          options: []
        });

      expect(response.status).toBe(400);
    });

    it('не должен добавить вопрос без авторизации', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .send({
          text: 'Вопрос',
          type: 'text',
          order: 6
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/questions/:id', () => {
    let questionId;

    beforeAll(async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Вопрос для обновления',
          type: 'text',
          order: 10
        });

      questionId = response.body.id;
    });

    it('должен обновить вопрос', async () => {
      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Обновленный текст вопроса',
          order: 11
        });

      expect(response.status).toBe(200);
      expect(response.body.text).toBe('Обновленный текст вопроса');
      expect(response.body.order).toBe(11);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('должен удалить вопрос', async () => {
      const createResponse = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Вопрос для удаления',
          type: 'text',
          order: 20
        });

      const deleteResponse = await request(app)
        .delete(`/api/questions/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);
    });
  });
});
