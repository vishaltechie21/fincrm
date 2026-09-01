const { pool } = require('../db/connection');

/**
 * Save user settings for a specific page using MSSQL MERGE (UPSERT).
 */
async function saveSettings(pageName, userKey, data) {
  const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
  const sql = `
    MERGE INTO USER_SETTINGS WITH (HOLDLOCK) AS target
    USING (SELECT ? AS page_name, ? AS user_key, ? AS setting_data) AS source
    ON (target.page_name = source.page_name AND target.user_key = source.user_key)
    WHEN MATCHED THEN
      UPDATE SET target.setting_data = source.setting_data, target.updated_at = GETDATE()
    WHEN NOT MATCHED THEN
      INSERT (page_name, user_key, setting_data)
      VALUES (source.page_name, source.user_key, source.setting_data);
  `;
  const [_, result] = await pool.query(sql, [pageName, userKey, serializedData]);
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
  const [_, result] = await pool.query(sql, [pageName, userKey]);
  return result.affectedRows > 0;
}

module.exports = {
  saveSettings,
  getSettings,
  clearSettings
};
