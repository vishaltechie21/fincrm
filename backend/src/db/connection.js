const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '0000',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'fincrm',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(p => {
        return p;
      })
      .catch(err => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

// Helper to execute parametrized query with MySQL-like interface
async function executeQuery(executor, sqlText, params = []) {
  let paramIndex = 1;
  let convertedSql = sqlText.replace(/\?/g, () => `@p${paramIndex++}`);

  // Automatically append SCOPE_IDENTITY() for INSERT statement if not specified
  const isInsert = /^\s*INSERT\s+INTO/i.test(sqlText);
  if (isInsert && !/SCOPE_IDENTITY/i.test(convertedSql) && !/OUTPUT/i.test(convertedSql)) {
    convertedSql = `${convertedSql}; SELECT SCOPE_IDENTITY() AS insertId;`;
  }

  const request = executor.request ? executor.request() : new sql.Request(executor);

  if (Array.isArray(params)) {
    params.forEach((val, idx) => {
      request.input(`p${idx + 1}`, val);
    });
  }

  const res = await request.query(convertedSql);
  
  let rows = res.recordset || [];
  if (res.recordsets && res.recordsets.length > 0) {
    rows = res.recordsets[res.recordsets.length - 1] || [];
  }

  const affectedRows = res.rowsAffected ? res.rowsAffected.reduce((acc, count) => acc + count, 0) : 0;

  let insertId = null;
  if (rows.length > 0 && rows[0] && rows[0].insertId !== undefined && rows[0].insertId !== null) {
    insertId = rows[0].insertId;
  }

  const resultObj = {
    affectedRows,
    insertId
  };

  return [rows, resultObj];
}

const pool = {
  query: async (sqlText, params = []) => {
    const p = await getPool();
    return executeQuery(p, sqlText, params);
  },
  getConnection: async () => {
    const p = await getPool();
    const transaction = new sql.Transaction(p);
    let isBegun = false;

    return {
      beginTransaction: async () => {
        await transaction.begin();
        isBegun = true;
      },
      commit: async () => {
        if (isBegun) {
          await transaction.commit();
          isBegun = false;
        }
      },
      rollback: async () => {
        if (isBegun) {
          await transaction.rollback();
          isBegun = false;
        }
      },
      query: async (sqlText, params = []) => {
        return executeQuery(transaction, sqlText, params);
      },
      release: () => {
        // Transaction release cleanup if needed
      }
    };
  }
};

async function testConnection() {
  try {
    const p = await getPool();
    console.log('Database connected successfully (MSSQL)');

    // Ensure SUB_MASTERS table exists
    const createTableSql = `
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SUB_MASTERS]') AND type in (N'U'))
      BEGIN
        CREATE TABLE SUB_MASTERS (
          id INT IDENTITY(1,1) PRIMARY KEY,
          master_type NVARCHAR(50) NOT NULL,
          value_name NVARCHAR(100) NOT NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT unique_type_value UNIQUE (master_type, value_name)
        );
      END
    `;
    await pool.query(createTableSql);

    // Seed default lookup values if empty
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM SUB_MASTERS');
    if (countRows[0] && countRows[0].count === 0) {
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
    if (error.code === 'ELOGIN' || error.number === 4060) {
      console.log('Database does not exist or connection failed. Initializing database...');
      try {
        const initDb = require('./init');
        await initDb();
        console.log('Database connected successfully after initialization');
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
