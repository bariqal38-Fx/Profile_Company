require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  const sqlPath = path.join(__dirname, '..', 'database', 'database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8')
    .replace(/^\s*CREATE\s+DATABASE\b[^;]*;\s*/i, '')
    .replace(/^\s*USE\s+[^;]+;\s*/im, '');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'company_profile',
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    await connection.query(sql);
    console.log('Struktur database siap.');
  } finally {
    await connection.end();
  }
}

initializeDatabase().catch(function (error) {
  console.error('Gagal menyiapkan database:', error.message);
  process.exitCode = 1;
});
