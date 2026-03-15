const pool = require('../config/database');

const addQuestion = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { surveyId } = req.params;
    const { text, type, order, options } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    const surveyResult = await client.query(
      'SELECT * FROM surveys WHERE id = $1',
      [surveyId]
    );

    if (surveyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    const survey = surveyResult.rows[0];

    if (survey.author_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Нет прав для добавления вопросов в этот опрос' });
    }

    if (survey.status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Можно добавлять вопросы только в опросы со статусом "черновик"' });
    }

    if (type === 'text' && options && options.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Текстовые вопросы не могут иметь варианты ответов' });
    }

    if ((type === 'single_choice' || type === 'multiple_choice') && (!options || options.length < 2)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Вопросы с выбором должны иметь минимум 2 варианта ответа' });
    }

    const questionResult = await client.query(
      `INSERT INTO questions (survey_id, text, type, "order") 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [surveyId, text, type, order]
    );

    const question = questionResult.rows[0];

    if (type !== 'text' && options) {
      for (let i = 0; i < options.length; i++) {
        await client.query(
          `INSERT INTO question_options (question_id, text, "order") 
           VALUES ($1, $2, $3)`,
          [question.id, options[i].text, options[i].order || i + 1]
        );
      }

      const optionsResult = await client.query(
        `SELECT * FROM question_options WHERE question_id = $1 ORDER BY "order"`,
        [question.id]
      );
      question.options = optionsResult.rows;
    }

    await client.query('COMMIT');
    res.status(201).json(question);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Ошибка при добавлении вопроса' });
  } finally {
    client.release();
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, order } = req.body;
    const userId = req.user.id;

    const questionResult = await pool.query(
      `SELECT q.*, s.author_id, s.status 
       FROM questions q
       JOIN surveys s ON q.survey_id = s.id
       WHERE q.id = $1`,
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }

    const question = questionResult.rows[0];

    if (question.author_id !== userId) {
      return res.status(403).json({ error: 'Нет прав для редактирования этого вопроса' });
    }

    if (question.status !== 'draft') {
      return res.status(400).json({ error: 'Можно редактировать вопросы только в опросах со статусом "черновик"' });
    }

    const result = await pool.query(
      `UPDATE questions SET text = $1, "order" = $2 WHERE id = $3 RETURNING *`,
      [text, order, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении вопроса' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const questionResult = await pool.query(
      `SELECT q.*, s.author_id, s.status 
       FROM questions q
       JOIN surveys s ON q.survey_id = s.id
       WHERE q.id = $1`,
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }

    const question = questionResult.rows[0];

    if (question.author_id !== userId) {
      return res.status(403).json({ error: 'Нет прав для удаления этого вопроса' });
    }

    if (question.status !== 'draft') {
      return res.status(400).json({ error: 'Можно удалять вопросы только из опросов со статусом "черновик"' });
    }

    await pool.query('DELETE FROM questions WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Ошибка при удалении вопроса' });
  }
};

module.exports = {
  addQuestion,
  updateQuestion,
  deleteQuestion
};
