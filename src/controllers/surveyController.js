const pool = require('../config/database');

const getAllSurveys = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, my, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, u.name as author_name,
             (SELECT COUNT(*) FROM survey_responses WHERE survey_id = s.id) as responses_count
      FROM surveys s
      JOIN users u ON s.author_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (my === 'true' && req.user) {
      query += ` AND s.author_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    const validSorts = ['created_at', 'responses_count'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    query += ` ORDER BY ${sortField} DESC`;
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) FROM surveys WHERE 1=1 ${status ? 'AND status = $1' : ''}`;
    const countParams = status ? [status] : [];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      surveys: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({ error: 'Ошибка при получении опросов' });
  }
};

const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;

    const surveyResult = await pool.query(
      `SELECT s.*, u.name as author_name,
              (SELECT COUNT(*) FROM survey_responses WHERE survey_id = s.id) as responses_count
       FROM surveys s
       JOIN users u ON s.author_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    const questionsResult = await pool.query(
      `SELECT * FROM questions WHERE survey_id = $1 ORDER BY "order"`,
      [id]
    );

    const questions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        if (question.type !== 'text') {
          const optionsResult = await pool.query(
            `SELECT * FROM question_options WHERE question_id = $1 ORDER BY "order"`,
            [question.id]
          );
          return { ...question, options: optionsResult.rows };
        }
        return question;
      })
    );

    res.json({
      ...surveyResult.rows[0],
      questions
    });
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({ error: 'Ошибка при получении опроса' });
  }
};

const createSurvey = async (req, res) => {
  try {
    const { title, description } = req.body;
    const authorId = req.user.id;

    const result = await pool.query(
      `INSERT INTO surveys (title, description, status, author_id) 
       VALUES ($1, $2, 'draft', $3) 
       RETURNING *`,
      [title, description, authorId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({ error: 'Ошибка при создании опроса' });
  }
};

const updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    const surveyResult = await pool.query(
      'SELECT * FROM surveys WHERE id = $1',
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    const survey = surveyResult.rows[0];

    if (survey.author_id !== userId) {
      return res.status(403).json({ error: 'Нет прав для редактирования этого опроса' });
    }

    if (survey.status !== 'draft') {
      return res.status(400).json({ error: 'Можно редактировать только опросы в статусе "черновик"' });
    }

    const result = await pool.query(
      `UPDATE surveys SET title = $1, description = $2 WHERE id = $3 RETURNING *`,
      [title, description, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении опроса' });
  }
};

const deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const surveyResult = await pool.query(
      'SELECT author_id FROM surveys WHERE id = $1',
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    if (surveyResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: 'Нет прав для удаления этого опроса' });
    }

    await pool.query('DELETE FROM surveys WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({ error: 'Ошибка при удалении опроса' });
  }
};

const publishSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const surveyResult = await pool.query(
      'SELECT * FROM surveys WHERE id = $1',
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    const survey = surveyResult.rows[0];

    if (survey.author_id !== userId) {
      return res.status(403).json({ error: 'Нет прав для публикации этого опроса' });
    }

    if (survey.status !== 'draft') {
      return res.status(400).json({ error: 'Можно публиковать только опросы в статусе "черновик"' });
    }

    const questionsResult = await pool.query(
      'SELECT COUNT(*) FROM questions WHERE survey_id = $1',
      [id]
    );

    if (parseInt(questionsResult.rows[0].count) === 0) {
      return res.status(400).json({ error: 'Нельзя опубликовать опрос без вопросов' });
    }

    const result = await pool.query(
      `UPDATE surveys SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Publish survey error:', error);
    res.status(500).json({ error: 'Ошибка при публикации опроса' });
  }
};

const closeSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const surveyResult = await pool.query(
      'SELECT * FROM surveys WHERE id = $1',
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    const survey = surveyResult.rows[0];

    if (survey.author_id !== userId) {
      return res.status(403).json({ error: 'Нет прав для закрытия этого опроса' });
    }

    if (survey.status !== 'published') {
      return res.status(400).json({ error: 'Можно закрывать только опубликованные опросы' });
    }

    const result = await pool.query(
      `UPDATE surveys SET status = 'closed', closed_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Close survey error:', error);
    res.status(500).json({ error: 'Ошибка при закрытии опроса' });
  }
};

module.exports = {
  getAllSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  closeSurvey
};
