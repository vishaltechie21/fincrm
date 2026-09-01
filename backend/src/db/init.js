const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSqlScript(connection, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  const sqlText = fs.readFileSync(filePath, 'utf8');
  // Split script by GO batch commands (case-insensitive, on its own line)
  const batches = sqlText.split(/^\s*GO\s*$/im).filter(b => b.trim().length > 0);

  for (const batch of batches) {
    const request = connection.request();
    await request.query(batch);
  }
}

async function initDb() {
  const masterConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '0000',
    server: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: 'master',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      enableArithAbort: true
    }
  };

  console.log('Connecting to MSSQL server to initialize database...');
  let connection;
  try {
    connection = await new sql.ConnectionPool(masterConfig).connect();
    console.log('Connected to MSSQL master server.');

    // Execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('Executing schema.sql...');
    await executeSqlScript(connection, schemaPath);
    console.log('Schema created successfully.');

    // Execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    console.log('Executing seed.sql...');
    await executeSqlScript(connection, seedPath);
    console.log('Database seeded successfully.');

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
