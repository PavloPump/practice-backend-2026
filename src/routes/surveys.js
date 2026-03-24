const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getAllSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  closeSurvey
} = require('../controllers/surveyController');

/**
 * @swagger
 * /api/surveys:
 *   get:
 *     summary: Получить список опросов с фильтрацией и пагинацией
 *     tags: [Surveys]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество на странице
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, closed]
 *         description: Фильтр по статусу
 *       - in: query
 *         name: my
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: Только мои опросы (требуется токен)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, responses_count]
 *           default: created_at
 *         description: Сортировка
 *     responses:
 *       200:
 *         description: Список опросов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surveys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Survey'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', optionalAuth, getAllSurveys);

/**
 * @swagger
 * /api/surveys/{id}:
 *   get:
 *     summary: Получить детальную информацию об опросе
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID опроса
 *     responses:
 *       200:
 *         description: Опрос с вопросами
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Survey'
 *                 - type: object
 *                   properties:
 *                     questions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Question'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getSurveyById);

/**
 * @swagger
 * /api/surveys:
 *   post:
 *     summary: Создать новый опрос
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Опрос удовлетворённости
 *               description:
 *                 type: string
 *                 example: Помогите нам стать лучше
 *     responses:
 *       201:
 *         description: Опрос создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Название опроса обязательно'),
    body('description').optional(),
    validate
  ],
  createSurvey
);

/**
 * @swagger
 * /api/surveys/{id}:
 *   put:
 *     summary: Обновить опрос (только в статусе draft)
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Опрос обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
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
  '/:id',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Название опроса обязательно'),
    body('description').optional(),
    validate
  ],
  updateSurvey
);

/**
 * @swagger
 * /api/surveys/{id}:
 *   delete:
 *     summary: Удалить опрос
 *     tags: [Surveys]
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
 *         description: Опрос удалён
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authenticateToken, deleteSurvey);

/**
 * @swagger
 * /api/surveys/{id}/publish:
 *   post:
 *     summary: Опубликовать опрос (draft → published)
 *     tags: [Surveys]
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
 *         description: Опрос опубликован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
 *       400:
 *         description: Опрос не в статусе draft или нет вопросов
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/publish', authenticateToken, publishSurvey);

/**
 * @swagger
 * /api/surveys/{id}/close:
 *   post:
 *     summary: Закрыть опрос (published → closed)
 *     tags: [Surveys]
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
 *         description: Опрос закрыт
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Survey'
 *       400:
 *         description: Опрос не в статусе published
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/close', authenticateToken, closeSurvey);

module.exports = router;
