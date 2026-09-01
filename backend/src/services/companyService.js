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
  return rows.map(r => parseCompanyData(r));
}

function parseCompanyData(r) {
  let acts = [];
  if (r.activity_data) {
    try {
      const parsed = JSON.parse(r.activity_data);
      if (Array.isArray(parsed)) acts = parsed;
    } catch (e) { acts = []; }
  }
  if (!acts.length && r.remarks_data) {
    try {
      const parsed = JSON.parse(r.remarks_data);
      if (Array.isArray(parsed)) acts = parsed;
    } catch (e) { acts = []; }
  }
  if (!acts.length && r.acts_json) {
    try { acts = JSON.parse(r.acts_json); } catch (e) { acts = []; }
  }

  let checklistData = {};
  if (r.checklist_data) {
    try { checklistData = typeof r.checklist_data === 'string' ? JSON.parse(r.checklist_data) : r.checklist_data; } catch (e) { checklistData = {}; }
  }

  let dashboardData = {};
  if (r.dashboard_data) {
    try { dashboardData = typeof r.dashboard_data === 'string' ? JSON.parse(r.dashboard_data) : r.dashboard_data; } catch (e) { dashboardData = {}; }
  }

  return {
    ...r,
    acts,
    checklistData,
    dashboardData
  };
}

/**
 * Service to retrieve a single company by ID.
 */
async function getCompanyById(id) {
  const [rows] = await pool.query('SELECT * FROM MASCOM WHERE mascom_id = ?', [id]);
  if (!rows[0]) return null;
  return parseCompanyData(rows[0]);
}

/**
 * Service to create a new company inside a transaction, generating a transaction-safe ID.
 */
async function createCompany(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const mascom_id = await generateId(connection, 'MASCOM', 'mascom_id');
    let actsJson = null;
    if (data.acts && Array.isArray(data.acts)) {
      actsJson = JSON.stringify(data.acts);
    }
    let checklistStr = data.checklist_data ? (typeof data.checklist_data === 'string' ? data.checklist_data : JSON.stringify(data.checklist_data)) : null;
    let dashboardStr = data.dashboard_data ? (typeof data.dashboard_data === 'string' ? data.dashboard_data : JSON.stringify(data.dashboard_data)) : null;

    const sql = `
      INSERT INTO MASCOM (
        mascom_id, company_name, industry_type, city, state, data_source,
        erp_using, user_name, mascom_remarks, ho, plant, web, units, users,
        client, follow, want, seen, budget, quoted, turnover, acts_json, activity_data, remarks_data,
        checklist_data, dashboard_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      mascom_id,
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
      actsJson,
      actsJson,
      actsJson,
      checklistStr,
      dashboardStr
    ];

    await connection.query(sql, params);
    await connection.commit();
    return { mascom_id, ...data };
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
  let actsJson = null;
  if (data.acts && Array.isArray(data.acts)) {
    actsJson = JSON.stringify(data.acts);
  }

  let checklistStr = null;
  if (data.checklist_data !== undefined) {
    checklistStr = typeof data.checklist_data === 'string' ? data.checklist_data : JSON.stringify(data.checklist_data);
  }

  let dashboardStr = null;
  if (data.dashboard_data !== undefined) {
    dashboardStr = typeof data.dashboard_data === 'string' ? data.dashboard_data : JSON.stringify(data.dashboard_data);
  }

  const sql = `
    UPDATE MASCOM SET
      company_name = COALESCE(?, company_name),
      industry_type = COALESCE(?, industry_type),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      data_source = COALESCE(?, data_source),
      erp_using = COALESCE(?, erp_using),
      user_name = COALESCE(?, user_name),
      mascom_remarks = COALESCE(?, mascom_remarks),
      ho = COALESCE(?, ho),
      plant = COALESCE(?, plant),
      web = COALESCE(?, web),
      units = COALESCE(?, units),
      users = COALESCE(?, users),
      client = COALESCE(?, client),
      follow = COALESCE(?, follow),
      want = COALESCE(?, want),
      seen = COALESCE(?, seen),
      budget = COALESCE(?, budget),
      quoted = COALESCE(?, quoted),
      turnover = COALESCE(?, turnover),
      acts_json = COALESCE(?, acts_json),
      activity_data = COALESCE(?, activity_data),
      remarks_data = COALESCE(?, remarks_data),
      checklist_data = COALESCE(?, checklist_data),
      dashboard_data = COALESCE(?, dashboard_data)
    WHERE mascom_id = ?
  `;
  const params = [
    data.company_name ? data.company_name.trim() : null,
    data.industry_type || null,
    data.city ? data.city.trim() : null,
    data.state ? data.state.trim() : null,
    data.data_source || null,
    data.erp_using ? data.erp_using.trim() : null,
    data.user_name ? data.user_name.trim() : null,
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
    actsJson,
    actsJson,
    actsJson,
    checklistStr,
    dashboardStr,
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
