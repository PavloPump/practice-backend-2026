const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getSurveyForTaking,
  submitSurveyResponse,
  getSurveyResults,
  exportSurveyResults
} = require('../controllers/responseController');

/**
 * @swagger
 * /api/surveys/{id}/take:
 *   get:
 *     summary: Получить опрос для прохождения (только published)
 *     tags: [Responses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID опроса
 *     responses:
 *       200:
 *         description: Опрос с вопросами для прохождения
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Опрос недоступен для прохождения
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/surveys/:id/take', getSurveyForTaking);

/**
 * @swagger
 * /api/surveys/{id}/submit:
 *   post:
 *     summary: Отправить ответы на опрос
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                     option_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     text_answer:
 *                       type: string
 *     responses:
 *       201:
 *         description: Ответы сохранены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 response_id:
 *                   type: integer
 *       400:
 *         description: Ошибка валидации ответов
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Повторное прохождение опроса
 */
router.post(
  '/surveys/:id/submit',
  authenticateToken,
  [
    body('answers').isArray({ min: 1 }).withMessage('Требуется хотя бы один ответ'),
    validate
  ],
  submitSurveyResponse
);

/**
 * @swagger
 * /api/surveys/{id}/results:
 *   get:
 *     summary: Получить результаты опроса (только автор)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Результаты с аналитикой
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 survey_id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 total_responses:
 *                   type: integer
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/surveys/:id/results', authenticateToken, getSurveyResults);

/**
 * @swagger
 * /api/surveys/{id}/export:
 *   get:
 *     summary: Экспорт результатов в JSON
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Экспортированные данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 survey:
 *                   $ref: '#/components/schemas/Survey'
 *                 responses:
 *                   type: array
 *                   items:
 *                     type: object
 *                 exported_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/surveys/:id/export', authenticateToken, exportSurveyResults);

module.exports = router;
