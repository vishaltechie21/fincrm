import api from './api';

export const masterService = {
  // Dashboard Steps
  getDashboardSteps: async () => {
    try {
      const res = await api.get('/masters/dashboard-steps');
      return res.data.success ? res.data.data : [];
    } catch (e) {
      console.warn('Failed to fetch dashboard steps master from backend:', e);
      return [];
    }
  },

  saveDashboardStep: async (stepData) => {
    try {
      const res = await api.post('/masters/dashboard-steps', stepData);
      return res.data;
    } catch (e) {
      console.error('Failed to save dashboard step master:', e);
      return { success: false, error: e.message };
    }
  },

  deleteDashboardStep: async (id) => {
    try {
      const res = await api.delete(`/masters/dashboard-steps/${id}`);
      return res.data;
    } catch (e) {
      console.error('Failed to delete dashboard step master:', e);
      return { success: false, error: e.message };
    }
  },

  // Checklist Stages & Items
  getChecklist: async () => {
    try {
      const res = await api.get('/masters/checklist');
      return res.data.success ? res.data.data : { stages: [], items: [] };
    } catch (e) {
      console.warn('Failed to fetch checklist master from backend:', e);
      return { stages: [], items: [] };
    }
  },

  saveChecklistStage: async (stageData) => {
    try {
      const res = await api.post('/masters/checklist/stage', stageData);
      return res.data;
    } catch (e) {
      console.error('Failed to save checklist stage master:', e);
      return { success: false, error: e.message };
    }
  },

  saveChecklistItem: async (itemData) => {
    try {
      const res = await api.post('/masters/checklist/item', itemData);
      return res.data;
    } catch (e) {
      console.error('Failed to save checklist item master:', e);
      return { success: false, error: e.message };
    }
  },

  deleteChecklistItem: async (id) => {
    try {
      const res = await api.delete(`/masters/checklist/item/${id}`);
      return res.data;
    } catch (e) {
      console.error('Failed to delete checklist item master:', e);
      return { success: false, error: e.message };
    }
  }
};
