const request = require('supertest');
const app = require('../src/index');
const pool = require('../src/config/database');

describe('Authentication API', () => {
  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@test.com']);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@test.com']);
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test1@test.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test1@test.com');
      expect(response.body.user.name).toBe('Test User');
    });

    it('не должен зарегистрировать пользователя с существующим email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@test.com',
          password: 'password123',
          name: 'Test User'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@test.com',
          password: 'password456',
          name: 'Another User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('должен валидировать email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
    });

    it('должен валидировать длину пароля', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test3@test.com',
          password: '123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testlogin@test.com',
          password: 'password123',
          name: 'Login Test User'
        });
    });

    it('должен войти с правильными учетными данными', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('testlogin@test.com');
    });

    it('не должен войти с неправильным паролем', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('не должен войти с несуществующим email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
