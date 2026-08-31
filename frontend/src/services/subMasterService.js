import api from './api';

/**
 * Fetch all sub masters, optionally filtered by category type
 */
export const getSubMasters = async (type = '') => {
  try {
    const url = type ? `/sub-masters?type=${encodeURIComponent(type)}` : '/sub-masters';
    const res = await api.get(url);
    return res.data;
  } catch (err) {
    console.error('Failed to fetch sub-masters:', err);
    throw err;
  }
};

/**
 * Create a new sub-master lookup option
 */
export const createSubMaster = async (masterType, valueName) => {
  try {
    const res = await api.post('/sub-masters', {
      master_type: masterType,
      value_name: valueName
    });
    return res.data;
  } catch (err) {
    console.error('Failed to create sub-master:', err);
    throw err;
  }
};

/**
 * Update an existing sub-master lookup option
 */
export const updateSubMaster = async (id, valueName) => {
  try {
    const res = await api.put(`/sub-masters/${id}`, {
      value_name: valueName
    });
    return res.data;
  } catch (err) {
    console.error(`Failed to update sub-master ${id}:`, err);
    throw err;
  }
};

/**
 * Delete a sub-master option by ID
 */
export const deleteSubMaster = async (id) => {
  try {
    const res = await api.delete(`/sub-masters/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to delete sub-master ${id}:`, err);
    throw err;
  }
};
