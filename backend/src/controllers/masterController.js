const masterService = require('../services/masterService');

async function getDashboardSteps(req, res) {
  try {
    const steps = await masterService.getDashboardSteps();
    return res.json({ success: true, data: steps });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function saveDashboardStep(req, res) {
  try {
    const result = await masterService.saveDashboardStep(req.body);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteDashboardStep(req, res) {
  try {
    await masterService.deleteDashboardStep(req.params.id);
    return res.json({ success: true, message: 'Step deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getChecklist(req, res) {
  try {
    const [stages, items] = await Promise.all([
      masterService.getChecklistStages(),
      masterService.getChecklistItems()
    ]);
    return res.json({ success: true, data: { stages, items } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function saveChecklistStage(req, res) {
  try {
    const result = await masterService.saveChecklistStage(req.body);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function saveChecklistItem(req, res) {
  try {
    const result = await masterService.saveChecklistItem(req.body);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteChecklistItem(req, res) {
  try {
    await masterService.deleteChecklistItem(req.params.id);
    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardSteps,
  saveDashboardStep,
  deleteDashboardStep,
  getChecklist,
  saveChecklistStage,
  saveChecklistItem,
  deleteChecklistItem
};
