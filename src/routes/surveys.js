const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
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

router.get('/', getAllSurveys);

router.get('/:id', getSurveyById);

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

router.delete('/:id', authenticateToken, deleteSurvey);

router.post('/:id/publish', authenticateToken, publishSurvey);

router.post('/:id/close', authenticateToken, closeSurvey);

module.exports = router;
