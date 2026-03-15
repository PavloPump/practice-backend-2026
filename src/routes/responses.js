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

router.get('/surveys/:id/take', getSurveyForTaking);

router.post(
  '/surveys/:id/submit',
  authenticateToken,
  [
    body('answers').isArray({ min: 1 }).withMessage('Требуется хотя бы один ответ'),
    validate
  ],
  submitSurveyResponse
);

router.get('/surveys/:id/results', authenticateToken, getSurveyResults);

router.get('/surveys/:id/export', authenticateToken, exportSurveyResults);

module.exports = router;
