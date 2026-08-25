const { pool } = require('../db/connection');
const { generateId } = require('../utils/idGenerator');

/**
 * Service to retrieve all contacts, joining with MASCOM to get the company name.
 */
async function getAllContacts(searchQuery) {
  let sql = `
    SELECT c.*, com.company_name 
    FROM MASCON c
    JOIN MASCOM com ON c.mascom_id = com.mascom_id
  `;
  let params = [];

  if (searchQuery) {
    sql += ' WHERE c.contact_name LIKE ? OR c.email LIKE ? OR c.mobile LIKE ? OR com.company_name LIKE ?';
    const pattern = `%${searchQuery}%`;
    params = [pattern, pattern, pattern, pattern];
  }

  sql += ' ORDER BY c.created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Service to retrieve a single contact by ID.
 */
async function getContactById(id) {
  const [rows] = await pool.query('SELECT * FROM MASCON WHERE mascon_id = ?', [id]);
  return rows[0] || null;
}

/**
 * Service to create a new contact inside a transaction.
 */
async function createContact(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const newId = await generateId(connection, 'MASCON', 'mascon_id');

    const sql = `
      INSERT INTO MASCON (
        mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      newId,
      data.mascom_id,
      data.contact_name.trim(),
      data.designation ? data.designation.trim() : null,
      data.mobile ? data.mobile.trim() : null,
      data.email ? data.email.trim() : null,
      data.key_person || 'N',
      data.user_name.trim(),
      data.mascon_remarks ? data.mascon_remarks.trim() : null
    ];

    await connection.query(sql, params);
    await connection.commit();

    return { mascon_id: newId, ...data };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Service to update an existing contact.
 */
async function updateContact(id, data) {
  const sql = `
    UPDATE MASCON SET
      mascom_id = ?,
      contact_name = ?,
      designation = ?,
      mobile = ?,
      email = ?,
      key_person = ?,
      user_name = ?,
      mascon_remarks = ?
    WHERE mascon_id = ?
  `;
  const params = [
    data.mascom_id,
    data.contact_name.trim(),
    data.designation ? data.designation.trim() : null,
    data.mobile ? data.mobile.trim() : null,
    data.email ? data.email.trim() : null,
    data.key_person || 'N',
    data.user_name.trim(),
    data.mascon_remarks ? data.mascon_remarks.trim() : null,
    id
  ];

  const [result] = await pool.query(sql, params);
  if (result.affectedRows === 0) {
    return null;
  }
  return { mascon_id: id, ...data };
}

/**
 * Service to delete a contact by ID.
 */
async function deleteContact(id) {
  const [result] = await pool.query('DELETE FROM MASCON WHERE mascon_id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
};
