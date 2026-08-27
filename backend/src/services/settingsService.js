const { pool } = require('../db/connection');

/**
 * Save user settings for a specific page using UPSERT (INSERT ... ON DUPLICATE KEY UPDATE).
 */
async function saveSettings(pageName, userKey, data) {
  const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
  const sql = `
    INSERT INTO USER_SETTINGS (page_name, user_key, setting_data)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE setting_data = VALUES(setting_data)
  `;
  const [result] = await pool.query(sql, [pageName, userKey, serializedData]);
  return result.affectedRows > 0;
}

/**
 * Retrieve user settings for a page.
 */
async function getSettings(pageName, userKey) {
  const sql = 'SELECT setting_data FROM USER_SETTINGS WHERE page_name = ? AND user_key = ?';
  const [rows] = await pool.query(sql, [pageName, userKey]);
  if (rows.length === 0) return null;
  
  try {
    return JSON.parse(rows[0].setting_data);
  } catch (err) {
    return rows[0].setting_data;
  }
}

/**
 * Clear/Delete settings for a page.
 */
async function clearSettings(pageName, userKey) {
  const sql = 'DELETE FROM USER_SETTINGS WHERE page_name = ? AND user_key = ?';
  const [result] = await pool.query(sql, [pageName, userKey]);
  return result.affectedRows > 0;
}

module.exports = {
  saveSettings,
  getSettings,
  clearSettings
};
