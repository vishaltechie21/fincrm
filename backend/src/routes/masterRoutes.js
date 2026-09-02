const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

// Dashboard Steps Routes
router.get('/dashboard-steps', masterController.getDashboardSteps);
router.post('/dashboard-steps', masterController.saveDashboardStep);
router.delete('/dashboard-steps/:id', masterController.deleteDashboardStep);

// Checklist Master Routes
router.get('/checklist', masterController.getChecklist);
router.post('/checklist/stage', masterController.saveChecklistStage);
router.post('/checklist/item', masterController.saveChecklistItem);
router.delete('/checklist/item/:id', masterController.deleteChecklistItem);

module.exports = router;
