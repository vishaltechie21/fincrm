const { pool } = require('../db/connection');

// --- DASHBOARD STEPS ---
async function getDashboardSteps() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM MAS_DASHBOARD_STEPS WHERE is_active = 1 ORDER BY sort_order ASC, step_id ASC'
    );
    return rows;
  } catch (err) {
    console.error('Error fetching MAS_DASHBOARD_STEPS:', err.message);
    return [];
  }
}

async function saveDashboardStep(stepData) {
  const { step_id, step_key, step_number, step_name, responsibility, note, requires_doc, sort_order } = stepData;
  if (step_id) {
    await pool.query(
      `UPDATE MAS_DASHBOARD_STEPS 
       SET step_key = ?, step_number = ?, step_name = ?, responsibility = ?, note = ?, requires_doc = ?, sort_order = ?, updated_at = GETDATE()
       WHERE step_id = ?`,
      [step_key, step_number, step_name, responsibility, note || null, requires_doc ? 1 : 0, sort_order || 0, step_id]
    );
    return { step_id, ...stepData };
  } else {
    const [result] = await pool.query(
      `INSERT INTO MAS_DASHBOARD_STEPS (step_key, step_number, step_name, responsibility, note, requires_doc, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [step_key, step_number, step_name, responsibility, note || null, requires_doc ? 1 : 0, sort_order || 0]
    );
    return { step_id: result.insertId, ...stepData };
  }
}

async function deleteDashboardStep(step_id) {
  await pool.query('UPDATE MAS_DASHBOARD_STEPS SET is_active = 0 WHERE step_id = ?', [step_id]);
  return true;
}

// --- CHECKLIST STAGES & ITEMS ---
async function getChecklistStages() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM MAS_CHECKLIST_STAGES WHERE is_active = 1 ORDER BY sort_order ASC, stage_id ASC'
    );
    return rows;
  } catch (err) {
    console.error('Error fetching MAS_CHECKLIST_STAGES:', err.message);
    return [];
  }
}

async function getChecklistItems() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM MAS_CHECKLIST_ITEMS WHERE is_active = 1 ORDER BY sort_order ASC, item_id ASC'
    );
    return rows;
  } catch (err) {
    console.error('Error fetching MAS_CHECKLIST_ITEMS:', err.message);
    return [];
  }
}

async function saveChecklistStage(stageData) {
  const { stage_id, stage_name, sort_order } = stageData;
  if (stage_id) {
    await pool.query(
      'UPDATE MAS_CHECKLIST_STAGES SET stage_name = ?, sort_order = ? WHERE stage_id = ?',
      [stage_name, sort_order || 0, stage_id]
    );
    return { stage_id, ...stageData };
  } else {
    const [result] = await pool.query(
      'INSERT INTO MAS_CHECKLIST_STAGES (stage_name, sort_order) VALUES (?, ?)',
      [stage_name, sort_order || 0]
    );
    return { stage_id: result.insertId, ...stageData };
  }
}

async function saveChecklistItem(itemData) {
  const { item_id, stage_name, action_name, responsibility, is_mandatory, evidence_label, sort_order } = itemData;
  if (item_id) {
    await pool.query(
      `UPDATE MAS_CHECKLIST_ITEMS 
       SET stage_name = ?, action_name = ?, responsibility = ?, is_mandatory = ?, evidence_label = ?, sort_order = ?
       WHERE item_id = ?`,
      [stage_name, action_name, responsibility, is_mandatory ? 1 : 0, evidence_label || null, sort_order || 0, item_id]
    );
    return { item_id, ...itemData };
  } else {
    const [result] = await pool.query(
      `INSERT INTO MAS_CHECKLIST_ITEMS (stage_name, action_name, responsibility, is_mandatory, evidence_label, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [stage_name, action_name, responsibility, is_mandatory ? 1 : 0, evidence_label || null, sort_order || 0]
    );
    return { item_id: result.insertId, ...itemData };
  }
}

async function deleteChecklistItem(item_id) {
  await pool.query('UPDATE MAS_CHECKLIST_ITEMS SET is_active = 0 WHERE item_id = ?', [item_id]);
  return true;
}

module.exports = {
  getDashboardSteps,
  saveDashboardStep,
  deleteDashboardStep,
  getChecklistStages,
  getChecklistItems,
  saveChecklistStage,
  saveChecklistItem,
  deleteChecklistItem
};
