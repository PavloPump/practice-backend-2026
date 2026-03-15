const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const questionRoutes = require('./routes/questions');
const responseRoutes = require('./routes/responses');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.json({
    message: 'Survey API - Сервис опросов и голосований',
    author: 'Bakeev Pavel, 1ИСП-21',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      surveys: '/api/surveys',
      questions: '/api',
      responses: '/api'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api', questionRoutes);
app.use('/api', responseRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});

app.listen(PORT, () => {
  console.log(`🚀 Survey API запущен на порту ${PORT}`);
  console.log(`📚 Документация доступна: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
