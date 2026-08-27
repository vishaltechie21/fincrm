const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.post('/', settingsController.saveSettings);
router.get('/:pageName', settingsController.getSettings);
router.delete('/:pageName', settingsController.clearSettings);

module.exports = router;
