const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/config/database');

describe('Survey Responses API', () => {
  let authorToken;
  let respondentToken;
  let surveyId;
  let question1Id, question2Id, question3Id;
  let option1Id, option2Id, option3Id, option4Id;

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', 
      ['responseauthor@test.com', 'respondent@test.com']);

    const authorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'responseauthor@test.com',
        password: 'password123',
        name: 'Response Author'
      });
    authorToken = authorResponse.body.token;

    const respondentResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'respondent@test.com',
        password: 'password123',
        name: 'Respondent User'
      });
    respondentToken = respondentResponse.body.token;

    const surveyResponse = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'Опрос для тестирования ответов',
        description: 'Тест'
      });
    surveyId = surveyResponse.body.id;

    const q1Response = await request(app)
      .post(`/api/surveys/${surveyId}/questions`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        text: 'Одиночный выбор',
        type: 'single_choice',
        order: 1,
        options: [
          { text: 'Вариант 1', order: 1 },
          { text: 'Вариант 2', order: 2 }
        ]
      });
    question1Id = q1Response.body.id;
    option1Id = q1Response.body.options[0].id;
    option2Id = q1Response.body.options[1].id;

    const q2Response = await request(app)
      .post(`/api/surveys/${surveyId}/questions`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        text: 'Множественный выбор',
        type: 'multiple_choice',
        order: 2,
        options: [
          { text: 'Опция 1', order: 1 },
          { text: 'Опция 2', order: 2 }
        ]
      });
    question2Id = q2Response.body.id;
    option3Id = q2Response.body.options[0].id;
    option4Id = q2Response.body.options[1].id;

    const q3Response = await request(app)
      .post(`/api/surveys/${surveyId}/questions`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        text: 'Текстовый вопрос',
        type: 'text',
        order: 3
      });
    question3Id = q3Response.body.id;

    await request(app)
      .post(`/api/surveys/${surveyId}/publish`)
      .set('Authorization', `Bearer ${authorToken}`);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', 
      ['responseauthor@test.com', 'respondent@test.com']);
    await pool.end();
  });

  describe('GET /api/surveys/:id/take', () => {
    it('должен получить опрос для прохождения', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/take`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions).toHaveLength(3);
    });

    it('не должен получить неопубликованный опрос', async () => {
      const draftSurveyResponse = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Черновик',
          description: 'Тест'
        });

      const response = await request(app)
        .get(`/api/surveys/${draftSurveyResponse.body.id}/take`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/surveys/:id/submit', () => {
    it('должен отправить корректные ответы', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/submit`)
        .set('Authorization', `Bearer ${respondentToken}`)
        .send({
          answers: [
            {
              question_id: question1Id,
              option_ids: [option1Id]
            },
            {
              question_id: question2Id,
              option_ids: [option3Id, option4Id]
            },
            {
              question_id: question3Id,
              text_answer: 'Мой текстовый ответ'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('response_id');
      expect(response.body.message).toBe('Ответы успешно сохранены');
    });

    it('не должен позволить пройти опрос повторно', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/submit`)
        .set('Authorization', `Bearer ${respondentToken}`)
        .send({
          answers: [
            {
              question_id: question1Id,
              option_ids: [option2Id]
            },
            {
              question_id: question2Id,
              option_ids: [option3Id]
            },
            {
              question_id: question3Id,
              text_answer: 'Повторный ответ'
            }
          ]
        });

      expect(response.status).toBe(409);
    });

    it('должен валидировать одиночный выбор', async () => {
      const newRespondent = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'respondent2@test.com',
          password: 'password123',
          name: 'Respondent 2'
        });

      const response = await request(app)
        .post(`/api/surveys/${surveyId}/submit`)
        .set('Authorization', `Bearer ${newRespondent.body.token}`)
        .send({
          answers: [
            {
              question_id: question1Id,
              option_ids: [option1Id, option2Id]
            },
            {
              question_id: question2Id,
              option_ids: [option3Id]
            },
            {
              question_id: question3Id,
              text_answer: 'Текст'
            }
          ]
        });

      expect(response.status).toBe(400);

      await pool.query('DELETE FROM users WHERE email = $1', ['respondent2@test.com']);
    });

    it('не должен отправить ответы без авторизации', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/submit`)
        .send({
          answers: []
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/surveys/:id/results', () => {
    it('должен получить результаты опроса (только автор)', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/results`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('survey_id');
      expect(response.body).toHaveProperty('total_responses');
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions).toHaveLength(3);
    });

    it('не должен позволить не-автору просматривать результаты', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/results`)
        .set('Authorization', `Bearer ${respondentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/surveys/:id/export', () => {
    it('должен экспортировать результаты (только автор)', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/export`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('survey');
      expect(response.body).toHaveProperty('responses');
      expect(response.body).toHaveProperty('exported_at');
    });

    it('не должен позволить не-автору экспортировать результаты', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/export`)
        .set('Authorization', `Bearer ${respondentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
