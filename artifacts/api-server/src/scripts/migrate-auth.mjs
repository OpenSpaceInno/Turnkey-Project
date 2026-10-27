import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function migrate() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Connected to MySQL for auth migration");

  const addCol = async (col, sql) => {
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN ${sql}`);
      console.log(`✅ Added column ${col}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️ Column ${col} already exists`);
      } else {
        console.error(`❌ Error adding ${col}:`, e.message);
      }
    }
  };

  await addCol('reset_token', 'reset_token VARCHAR(255) NULL');
  await addCol('reset_token_expires_at', 'reset_token_expires_at TIMESTAMP NULL');
  await addCol('two_factor_enabled', 'two_factor_enabled BOOLEAN NOT NULL DEFAULT 0');
  await addCol('two_factor_secret', 'two_factor_secret TEXT NULL');
  await addCol('two_factor_backup_codes', 'two_factor_backup_codes JSON NULL');

  const [cols] = await conn.query('DESCRIBE users');
  console.log('Columns in users:', cols.map(c => c.Field));
  await conn.end();
  console.log("Migration complete!");
}

migrate().catch(console.error);
