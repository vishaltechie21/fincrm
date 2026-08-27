import api from './api';

/**
 * Get or generate a unique browser ID stored in localStorage.
 */
const getBrowserId = () => {
  let browserId = localStorage.getItem('fincrm_browser_id');
  if (!browserId) {
    browserId = 'fincrm_browser_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('fincrm_browser_id', browserId);
  }
  return browserId;
};

/**
 * Save configuration settings for a specific search page.
 * @param {string} pageName - Page name key ('company_search' or 'contact_search')
 * @param {object} settingsData - Config state to serialize and store
 */
export const saveSettings = async (pageName, settingsData) => {
  try {
    const res = await api.post('/settings', {
      page_name: pageName,
      setting_data: settingsData,
      user_key: getBrowserId()
    });
    return res.data;
  } catch (err) {
    console.error('saveSettings error:', err);
    throw err;
  }
};

/**
 * Fetch configuration settings for a search page.
 * @param {string} pageName
 */
export const getSettings = async (pageName) => {
  try {
    const res = await api.get(`/settings/${pageName}`, {
      params: { user_key: getBrowserId() }
    });
    return res.data;
  } catch (err) {
    console.error('getSettings error:', err);
    throw err;
  }
};

/**
 * Delete configuration settings for a search page.
 * @param {string} pageName
 */
export const clearSettings = async (pageName) => {
  try {
    const res = await api.delete(`/settings/${pageName}`, {
      params: { user_key: getBrowserId() }
    });
    return res.data;
  } catch (err) {
    console.error('clearSettings error:', err);
    throw err;
  }
};
