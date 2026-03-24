const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await client.query('BEGIN');
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES 
         ('author@example.com', $1, 'Автор Опросов'),
         ('user1@example.com', $1, 'Пользователь 1'),
         ('user2@example.com', $1, 'Пользователь 2')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [passwordHash]
    );
    
    console.log('✅ Users created');
    
    const authorId = userResult.rows.length > 0 ? userResult.rows[0].id : 1;

    const surveyResult = await client.query(
      `INSERT INTO surveys (title, description, status, author_id) 
       VALUES 
         ('Опрос удовлетворенности сервисом', 'Помогите нам стать лучше', 'published', $1),
         ('Тестовый опрос в черновике', 'Этот опрос еще не опубликован', 'draft', $1)
       RETURNING id`,
      [authorId]
    );
    
    console.log('✅ Surveys created');
    
    const question1 = await client.query(
      `INSERT INTO questions (survey_id, text, type, "order") 
       VALUES ($1, 'Как вы оцениваете наш сервис?', 'single_choice', 1)
       RETURNING id`,
      [surveyResult.rows[0].id]
    );
    
    await client.query(
      `INSERT INTO question_options (question_id, text, "order") 
       VALUES 
         ($1, 'Отлично', 1),
         ($1, 'Хорошо', 2),
         ($1, 'Удовлетворительно', 3),
         ($1, 'Плохо', 4)`,
      [question1.rows[0].id]
    );
    
    const question2 = await client.query(
      `INSERT INTO questions (survey_id, text, type, "order") 
       VALUES ($1, 'Какие функции вам нравятся больше всего?', 'multiple_choice', 2)
       RETURNING id`,
      [surveyResult.rows[0].id]
    );
    
    await client.query(
      `INSERT INTO question_options (question_id, text, "order") 
       VALUES 
         ($1, 'Простота использования', 1),
         ($1, 'Быстрая работа', 2),
         ($1, 'Красивый дизайн', 3),
         ($1, 'Много функций', 4)`,
      [question2.rows[0].id]
    );
    
    const question3 = await client.query(
      `INSERT INTO questions (survey_id, text, type, "order") 
       VALUES ($1, 'Что бы вы хотели улучшить?', 'text', 3)
       RETURNING id`,
      [surveyResult.rows[0].id]
    );
    
    console.log('✅ Questions and options created');
    
    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!');
    console.log('\nТестовые учетные данные:');
    console.log('Email: author@example.com');
    console.log('Email: user1@example.com');
    console.log('Email: user2@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
