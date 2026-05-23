const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: String(process.env.PG_SSL || '').toLowerCase() === 'true'
    ? { rejectUnauthorized: false }
    : undefined
});

const tables = `
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'English'
);

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  UNIQUE (subject, grade, topic_name, language)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  responses JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  delivery_mode TEXT NOT NULL,
  status TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const migrations = `
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low';
ALTER TABLE students ADD COLUMN IF NOT EXISTS confidence_level TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_profile JSONB NOT NULL DEFAULT '{"strongTopics":[],"weakTopics":[],"recurringMistakes":[]}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS progress_history JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS form_status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS grouped_students JSONB NOT NULL DEFAULT '{"advanced":[],"average":[],"needsSupport":[]}'::jsonb;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS class_insight JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_delivery_mode_check;
ALTER TABLE messages ADD CONSTRAINT messages_delivery_mode_check CHECK (delivery_mode IN ('greenapi', 'twilio', 'mock', 'system'));
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('question', 'feedback', 'reply', 'acknowledgement'));
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check CHECK (status IN ('sent', 'failed', 'received', 'pending'));
`;

const indexes = `
CREATE INDEX IF NOT EXISTS students_teacher_idx ON students (teacher_id);
CREATE INDEX IF NOT EXISTS sessions_teacher_date_idx ON sessions (teacher_id, date DESC);
CREATE INDEX IF NOT EXISTS sessions_form_status_idx ON sessions (form_status);
CREATE INDEX IF NOT EXISTS messages_student_created_idx ON messages (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_session_created_idx ON messages (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS teachers_phone_idx ON teachers (phone);
CREATE INDEX IF NOT EXISTS password_reset_codes_phone_idx ON password_reset_codes (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS password_reset_codes_teacher_idx ON password_reset_codes (teacher_id, created_at DESC);
`;

const connectDB = async () => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Add your PostgreSQL connection string to .env.');
  }

  try {
    console.log('[database] Connecting to PostgreSQL...');
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      await client.query(tables);
      await client.query(migrations);
      await client.query(indexes);
      console.log('[database] PostgreSQL connected and schema is ready.');
    } finally {
      client.release();
    }
    return pool;
  } catch (error) {
    console.error('[database] PostgreSQL connection failed:', error.message);
    throw error;
  }
};

const query = (text, params) => pool.query(text, params);
const closeDB = () => pool.end();

module.exports = connectDB;
module.exports.query = query;
module.exports.closeDB = closeDB;
module.exports.pool = pool;
