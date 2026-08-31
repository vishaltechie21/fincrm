const { pool } = require('../db/connection');

/**
 * Retrieve sub masters, optionally filtered by master_type
 */
async function getSubMasters(type = null) {
  let sql = 'SELECT id, master_type, value_name, created_at FROM SUB_MASTERS';
  const params = [];
  if (type) {
    sql += ' WHERE master_type = ?';
    params.push(type);
  }
  sql += ' ORDER BY master_type ASC, value_name ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Create a new sub-master option
 */
async function createSubMaster(master_type, value_name) {
  const sql = 'INSERT INTO SUB_MASTERS (master_type, value_name) VALUES (?, ?)';
  const [result] = await pool.query(sql, [master_type, value_name.trim()]);
  return result.insertId;
}

/**
 * Update an existing sub-master option
 */
async function updateSubMaster(id, value_name) {
  const sql = 'UPDATE SUB_MASTERS SET value_name = ? WHERE id = ?';
  const [result] = await pool.query(sql, [value_name.trim(), id]);
  return result.affectedRows > 0;
}

/**
 * Delete a sub-master option
 */
async function deleteSubMaster(id) {
  const sql = 'DELETE FROM SUB_MASTERS WHERE id = ?';
  const [result] = await pool.query(sql, [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getSubMasters,
  createSubMaster,
  updateSubMaster,
  deleteSubMaster
};
