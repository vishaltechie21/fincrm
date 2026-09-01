const { pool } = require('../db/connection');
const { generateId } = require('../utils/idGenerator');

/**
 * Service to retrieve all companies, optionally filtered by a search term.
 */
async function getAllCompanies(searchQuery) {
  let sql = 'SELECT * FROM MASCOM';
  let params = [];

  if (searchQuery) {
    sql += ' WHERE mascom_id LIKE ? OR company_name LIKE ? OR city LIKE ? OR state LIKE ?';
    const pattern = `%${searchQuery}%`;
    params = [pattern, pattern, pattern, pattern];
  }

  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Service to retrieve a single company by ID.
 */
async function getCompanyById(id) {
  const [rows] = await pool.query('SELECT * FROM MASCOM WHERE mascom_id = ?', [id]);
  return rows[0] || null;
}

/**
 * Service to create a new company inside a transaction, generating a transaction-safe ID.
 */
async function createCompany(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const newId = await generateId(connection, 'MASCOM', 'mascom_id');

    const sql = `
      INSERT INTO MASCOM (
        mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks,
        ho, plant, web, units, users, client, follow, want, seen, budget, quoted, turnover
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      newId,
      data.company_name.trim(),
      data.industry_type,
      data.city.trim(),
      data.state.trim(),
      data.data_source,
      data.erp_using ? data.erp_using.trim() : null,
      data.user_name.trim(),
      data.mascom_remarks ? data.mascom_remarks.trim() : null,
      data.ho ? data.ho.trim() : null,
      data.plant ? data.plant.trim() : null,
      data.web ? data.web.trim() : null,
      data.units ? String(data.units).trim() : null,
      data.users ? String(data.users).trim() : null,
      data.client ? data.client.trim() : null,
      data.follow ? data.follow.trim() : null,
      data.want ? data.want.trim() : null,
      data.seen ? data.seen.trim() : null,
      data.budget ? String(data.budget).trim() : null,
      data.quoted ? String(data.quoted).trim() : null,
      data.turnover ? String(data.turnover).trim() : null
    ];

    await connection.query(sql, params);
    await connection.commit();

    return { mascom_id: newId, ...data };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Service to update an existing company.
 */
async function updateCompany(id, data) {
  const sql = `
    UPDATE MASCOM SET
      company_name = ?,
      industry_type = ?,
      city = ?,
      state = ?,
      data_source = ?,
      erp_using = ?,
      user_name = ?,
      mascom_remarks = ?,
      ho = ?,
      plant = ?,
      web = ?,
      units = ?,
      users = ?,
      client = ?,
      follow = ?,
      want = ?,
      seen = ?,
      budget = ?,
      quoted = ?,
      turnover = ?
    WHERE mascom_id = ?
  `;
  const params = [
    data.company_name.trim(),
    data.industry_type,
    data.city.trim(),
    data.state.trim(),
    data.data_source,
    data.erp_using ? data.erp_using.trim() : null,
    data.user_name.trim(),
    data.mascom_remarks ? data.mascom_remarks.trim() : null,
    data.ho ? data.ho.trim() : null,
    data.plant ? data.plant.trim() : null,
    data.web ? data.web.trim() : null,
    data.units ? String(data.units).trim() : null,
    data.users ? String(data.users).trim() : null,
    data.client ? data.client.trim() : null,
    data.follow ? data.follow.trim() : null,
    data.want ? data.want.trim() : null,
    data.seen ? data.seen.trim() : null,
    data.budget ? String(data.budget).trim() : null,
    data.quoted ? String(data.quoted).trim() : null,
    data.turnover ? String(data.turnover).trim() : null,
    id
  ];

  const [result] = await pool.query(sql, params);
  if (result.affectedRows === 0) {
    return null;
  }
  return { mascom_id: id, ...data };
}

/**
 * Service to delete a company by ID.
 */
async function deleteCompany(id) {
  const [result] = await pool.query('DELETE FROM MASCOM WHERE mascom_id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};
