const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  addQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');

router.post(
  '/surveys/:surveyId/questions',
  authenticateToken,
  [
    body('text').notEmpty().withMessage('Текст вопроса обязателен'),
    body('type').isIn(['single_choice', 'multiple_choice', 'text']).withMessage('Некорректный тип вопроса'),
    body('order').isInt({ min: 1 }).withMessage('Порядковый номер должен быть положительным числом'),
    body('options').optional().isArray(),
    validate
  ],
  addQuestion
);

router.put(
  '/questions/:id',
  authenticateToken,
  [
    body('text').notEmpty().withMessage('Текст вопроса обязателен'),
    body('order').isInt({ min: 1 }).withMessage('Порядковый номер должен быть положительным числом'),
    validate
  ],
  updateQuestion
);

router.delete('/questions/:id', authenticateToken, deleteQuestion);

module.exports = router;
