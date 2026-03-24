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

/**
 * @swagger
 * /api/surveys/{surveyId}/questions:
 *   post:
 *     summary: Добавить вопрос к опросу
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID опроса
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, type, order]
 *             properties:
 *               text:
 *                 type: string
 *                 example: Как вам наш сервис?
 *               type:
 *                 type: string
 *                 enum: [single_choice, multiple_choice, text]
 *               order:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Вопрос добавлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Обновить вопрос (только если опрос в статусе draft)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID вопроса
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, order]
 *             properties:
 *               text:
 *                 type: string
 *               order:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Вопрос обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Опрос не в статусе draft
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Удалить вопрос
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Вопрос удалён
 *       400:
 *         description: Опрос не в статусе draft
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/questions/:id', authenticateToken, deleteQuestion);

module.exports = router;
