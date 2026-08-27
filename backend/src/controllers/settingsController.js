const settingsService = require('../services/settingsService');

/**
 * Save settings for a page
 */
async function saveSettings(req, res, next) {
  try {
    const { page_name, setting_data } = req.body;
    const userKey = req.body.user_key || 'admin_fincrm'; // Default user key
    
    if (!page_name || !setting_data) {
      return res.status(400).json({
        success: false,
        message: 'page_name and setting_data are required'
      });
    }

    await settingsService.saveSettings(page_name, userKey, setting_data);
    res.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve settings for a page
 */
async function getSettings(req, res, next) {
  try {
    const { pageName } = req.params;
    const userKey = req.query.user_key || 'admin_fincrm';

    const settings = await settingsService.getSettings(pageName, userKey);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete settings for a page
 */
async function clearSettings(req, res, next) {
  try {
    const { pageName } = req.params;
    const userKey = (req.body && req.body.user_key) || req.query.user_key || 'admin_fincrm';

    await settingsService.clearSettings(pageName, userKey);
    res.json({
      success: true,
      message: 'Settings cleared successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  saveSettings,
  getSettings,
  clearSettings
};
