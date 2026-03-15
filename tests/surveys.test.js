const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/config/database');

describe('Surveys API', () => {
  let authToken;
  let userId;
  let surveyId;

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['surveytest@test.com']);

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'surveytest@test.com',
        password: 'password123',
        name: 'Survey Test User'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['surveytest@test.com']);
    await pool.end();
  });

  describe('POST /api/surveys', () => {
    it('должен создать новый опрос', async () => {
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Тестовый опрос',
          description: 'Описание тестового опроса'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Тестовый опрос');
      expect(response.body.status).toBe('draft');
      expect(response.body.author_id).toBe(userId);

      surveyId = response.body.id;
    });

    it('не должен создать опрос без авторизации', async () => {
      const response = await request(app)
        .post('/api/surveys')
        .send({
          title: 'Тестовый опрос',
          description: 'Описание'
        });

      expect(response.status).toBe(401);
    });

    it('должен валидировать обязательные поля', async () => {
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Только описание без названия'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/surveys', () => {
    it('должен получить список опросов', async () => {
      const response = await request(app)
        .get('/api/surveys');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('surveys');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.surveys)).toBe(true);
    });

    it('должен поддерживать пагинацию', async () => {
      const response = await request(app)
        .get('/api/surveys?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('должен фильтровать по статусу', async () => {
      const response = await request(app)
        .get('/api/surveys?status=draft');

      expect(response.status).toBe(200);
      expect(response.body.surveys.every(s => s.status === 'draft')).toBe(true);
    });
  });

  describe('GET /api/surveys/:id', () => {
    it('должен получить опрос по ID', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(surveyId);
      expect(response.body).toHaveProperty('questions');
    });

    it('должен вернуть 404 для несуществующего опроса', async () => {
      const response = await request(app)
        .get('/api/surveys/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/surveys/:id', () => {
    it('должен обновить опрос в статусе draft', async () => {
      const response = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Обновленное название',
          description: 'Обновленное описание'
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Обновленное название');
    });

    it('не должен обновить опрос без авторизации', async () => {
      const response = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .send({
          title: 'Новое название'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Survey Lifecycle', () => {
    let lifecycleSurveyId;
    let questionId;

    beforeAll(async () => {
      const surveyResponse = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Опрос для тестирования жизненного цикла',
          description: 'Тест'
        });

      lifecycleSurveyId = surveyResponse.body.id;

      const questionResponse = await request(app)
        .post(`/api/surveys/${lifecycleSurveyId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Тестовый вопрос',
          type: 'single_choice',
          order: 1,
          options: [
            { text: 'Вариант 1', order: 1 },
            { text: 'Вариант 2', order: 2 }
          ]
        });

      questionId = questionResponse.body.id;
    });

    it('должен опубликовать опрос', async () => {
      const response = await request(app)
        .post(`/api/surveys/${lifecycleSurveyId}/publish`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('published');
    });

    it('не должен редактировать опубликованный опрос', async () => {
      const response = await request(app)
        .put(`/api/surveys/${lifecycleSurveyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Попытка изменить'
        });

      expect(response.status).toBe(400);
    });

    it('должен закрыть опубликованный опрос', async () => {
      const response = await request(app)
        .post(`/api/surveys/${lifecycleSurveyId}/close`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('closed');
    });
  });

  describe('DELETE /api/surveys/:id', () => {
    it('должен удалить опрос', async () => {
      const createResponse = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Опрос для удаления',
          description: 'Будет удален'
        });

      const deleteResponse = await request(app)
        .delete(`/api/surveys/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);
    });
  });
});
