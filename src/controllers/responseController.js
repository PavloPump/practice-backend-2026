const pool = require('../config/database');

const getSurveyForTaking = async (req, res) => {
  try {
    const { id } = req.params;

    const surveyResult = await pool.query(
      `SELECT id, title, description, status FROM surveys WHERE id = $1`,
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    const survey = surveyResult.rows[0];

    if (survey.status !== 'published') {
      return res.status(400).json({ error: 'Опрос недоступен для прохождения' });
    }

    const questionsResult = await pool.query(
      `SELECT id, text, type, "order" FROM questions WHERE survey_id = $1 ORDER BY "order"`,
      [id]
    );

    const questions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        if (question.type !== 'text') {
          const optionsResult = await pool.query(
            `SELECT id, text, "order" FROM question_options WHERE question_id = $1 ORDER BY "order"`,
            [question.id]
          );
          return { ...question, options: optionsResult.rows };
        }
        return question;
      })
    );

    res.json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      questions
    });
  } catch (error) {
    console.error('Get survey for taking error:', error);
    res.status(500).json({ error: 'Ошибка при получении опроса' });
  }
};

const submitSurveyResponse = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    const surveyResult = await client.query(
      'SELECT status FROM surveys WHERE id = $1',
      [id]
    );

    if (surveyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    if (surveyResult.rows[0].status !== 'published') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Опрос недоступен для прохождения' });
    }

    const existingResponse = await client.query(
      'SELECT id FROM survey_responses WHERE survey_id = $1 AND respondent_id = $2',
      [id, userId]
    );

    if (existingResponse.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Вы уже проходили этот опрос' });
    }

    const responseResult = await client.query(
      'INSERT INTO survey_responses (survey_id, respondent_id) VALUES ($1, $2) RETURNING id',
      [id, userId]
    );

    const responseId = responseResult.rows[0].id;

    for (const answer of answers) {
      const questionResult = await client.query(
        'SELECT type FROM questions WHERE id = $1 AND survey_id = $2',
        [answer.question_id, id]
      );

      if (questionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Вопрос ${answer.question_id} не найден в этом опросе` });
      }

      const questionType = questionResult.rows[0].type;

      if (questionType === 'text') {
        if (!answer.text_answer) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Требуется текстовый ответ для вопроса ${answer.question_id}` });
        }

        await client.query(
          'INSERT INTO question_answers (response_id, question_id, text_answer) VALUES ($1, $2, $3)',
          [responseId, answer.question_id, answer.text_answer]
        );
      } else if (questionType === 'single_choice') {
        if (!answer.option_ids || answer.option_ids.length !== 1) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Для вопроса ${answer.question_id} требуется выбрать ровно один вариант` });
        }

        await client.query(
          'INSERT INTO question_answers (response_id, question_id, option_id) VALUES ($1, $2, $3)',
          [responseId, answer.question_id, answer.option_ids[0]]
        );
      } else if (questionType === 'multiple_choice') {
        if (!answer.option_ids || answer.option_ids.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Для вопроса ${answer.question_id} требуется выбрать хотя бы один вариант` });
        }

        for (const optionId of answer.option_ids) {
          await client.query(
            'INSERT INTO question_answers (response_id, question_id, option_id) VALUES ($1, $2, $3)',
            [responseId, answer.question_id, optionId]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Ответы успешно сохранены',
      response_id: responseId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit survey response error:', error);
    res.status(500).json({ error: 'Ошибка при сохранении ответов' });
  } finally {
    client.release();
  }
};

const getSurveyResults = async (req, res) => {
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
      return res.status(403).json({ error: 'Только автор опроса может просматривать результаты' });
    }

    const totalResponsesResult = await pool.query(
      'SELECT COUNT(*) FROM survey_responses WHERE survey_id = $1',
      [id]
    );
    const totalResponses = parseInt(totalResponsesResult.rows[0].count);

    const questionsResult = await pool.query(
      `SELECT * FROM questions WHERE survey_id = $1 ORDER BY "order"`,
      [id]
    );

    const questionsWithStats = await Promise.all(
      questionsResult.rows.map(async (question) => {
        if (question.type === 'text') {
          const answersResult = await pool.query(
            `SELECT text_answer FROM question_answers WHERE question_id = $1`,
            [question.id]
          );
          
          return {
            id: question.id,
            text: question.text,
            type: question.type,
            answers: answersResult.rows.map(r => r.text_answer)
          };
        } else {
          const optionsResult = await pool.query(
            `SELECT qo.id, qo.text, 
                    COUNT(qa.id) as count
             FROM question_options qo
             LEFT JOIN question_answers qa ON qa.option_id = qo.id
             WHERE qo.question_id = $1
             GROUP BY qo.id, qo.text, qo."order"
             ORDER BY qo."order"`,
            [question.id]
          );

          const totalAnswers = optionsResult.rows.reduce((sum, opt) => sum + parseInt(opt.count), 0);

          const options = optionsResult.rows.map(opt => ({
            id: opt.id,
            text: opt.text,
            count: parseInt(opt.count),
            percentage: totalAnswers > 0 ? ((parseInt(opt.count) / totalAnswers) * 100).toFixed(1) : 0
          }));

          return {
            id: question.id,
            text: question.text,
            type: question.type,
            statistics: {
              total_answers: totalAnswers,
              options
            }
          };
        }
      })
    );

    res.json({
      survey_id: survey.id,
      title: survey.title,
      total_responses: totalResponses,
      questions: questionsWithStats
    });
  } catch (error) {
    console.error('Get survey results error:', error);
    res.status(500).json({ error: 'Ошибка при получении результатов' });
  }
};

const exportSurveyResults = async (req, res) => {
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
      return res.status(403).json({ error: 'Только автор опроса может экспортировать результаты' });
    }

    const responsesResult = await pool.query(
      `SELECT sr.id, sr.submitted_at, u.name as respondent_name, u.email as respondent_email
       FROM survey_responses sr
       JOIN users u ON sr.respondent_id = u.id
       WHERE sr.survey_id = $1
       ORDER BY sr.submitted_at`,
      [id]
    );

    const responses = await Promise.all(
      responsesResult.rows.map(async (response) => {
        const answersResult = await pool.query(
          `SELECT qa.*, q.text as question_text, q.type as question_type,
                  qo.text as option_text
           FROM question_answers qa
           JOIN questions q ON qa.question_id = q.id
           LEFT JOIN question_options qo ON qa.option_id = qo.id
           WHERE qa.response_id = $1
           ORDER BY q."order"`,
          [response.id]
        );

        return {
          ...response,
          answers: answersResult.rows
        };
      })
    );

    res.json({
      survey,
      responses,
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export survey results error:', error);
    res.status(500).json({ error: 'Ошибка при экспорте результатов' });
  }
};

module.exports = {
  getSurveyForTaking,
  submitSurveyResponse,
  getSurveyResults,
  exportSurveyResults
};
