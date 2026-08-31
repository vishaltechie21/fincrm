const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'fincrm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('Database does not exist. Initializing database...');
      try {
        const initDb = require('./init');
        await initDb();
        const connection = await pool.getConnection();
        console.log('Database connected successfully after initialization');
        connection.release();
        return;
      } catch (initError) {
        console.error('Database initialization failed:', initError.message);
        process.exit(1);
      }
    }
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  pool,
  testConnection
};
