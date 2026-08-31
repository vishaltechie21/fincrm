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

    // Auto-create SUB_MASTERS lookup lookup table if not exists
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS SUB_MASTERS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        master_type VARCHAR(50) NOT NULL,
        value_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_type_value (master_type, value_name)
      )
    `;
    await pool.query(createTableSql);

    // Seed default lookup values if empty
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM SUB_MASTERS');
    if (countRows[0].count === 0) {
      console.log('Seeding default sub-master lookup values...');
      const seedSql = `
        INSERT INTO SUB_MASTERS (master_type, value_name) VALUES
        ('industry_type', 'Pharma Manufacturing'),
        ('industry_type', 'Pharma Marketing'),
        ('industry_type', 'Medical Devices'),
        ('industry_type', 'Nutraceuticals'),
        ('industry_type', 'Food Manufacturing'),
        ('industry_type', 'Chemical Manufacturing'),
        ('industry_type', 'Other'),
        ('data_source', 'Website'),
        ('data_source', 'Referral'),
        ('data_source', 'WhatsApp'),
        ('data_source', 'Bulk Mail'),
        ('data_source', 'Cold Call'),
        ('data_source', 'Exhibition'),
        ('data_source', 'Existing Client'),
        ('data_source', 'Other'),
        ('stage', 'Lead'),
        ('stage', 'Demo Done'),
        ('stage', 'Quoted'),
        ('stage', 'Negotiation'),
        ('stage', 'Won'),
        ('stage', 'Lost')
      `;
      await pool.query(seedSql);
      console.log('Default lookup values seeded successfully.');
    }
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
