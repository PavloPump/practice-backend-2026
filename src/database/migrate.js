const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,
  
  `
  CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    closed_at TIMESTAMP,
    CONSTRAINT check_status CHECK (status IN ('draft', 'published', 'closed'))
  );
  
  CREATE INDEX IF NOT EXISTS idx_surveys_author ON surveys(author_id);
  CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
  `,
  
  `
  CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_question_type CHECK (type IN ('single_choice', 'multiple_choice', 'text'))
  );
  
  CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id);
  `,
  
  `
  CREATE TABLE IF NOT EXISTS question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);
  `,
  
  `
  CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    respondent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_survey_respondent UNIQUE (survey_id, respondent_id)
  );
  
  CREATE INDEX IF NOT EXISTS idx_responses_survey ON survey_responses(survey_id);
  CREATE INDEX IF NOT EXISTS idx_responses_respondent ON survey_responses(respondent_id);
  `,
  
  `
  CREATE TABLE IF NOT EXISTS question_answers (
    id SERIAL PRIMARY KEY,
    response_id INTEGER NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES question_options(id) ON DELETE CASCADE,
    text_answer TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_answers_response ON question_answers(response_id);
  CREATE INDEX IF NOT EXISTS idx_answers_question ON question_answers(question_id);
  `
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    await client.query('BEGIN');
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
      console.log(`✅ Migration ${i + 1} completed\n`);
    }
    
    await client.query('COMMIT');
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;
