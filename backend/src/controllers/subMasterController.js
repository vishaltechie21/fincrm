const subMasterService = require('../services/subMasterService');

async function getSubMasters(req, res, next) {
  try {
    const { type } = req.query;
    const data = await subMasterService.getSubMasters(type);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function createSubMaster(req, res, next) {
  try {
    const { master_type, value_name } = req.body;
    if (!master_type || !value_name) {
      return res.status(400).json({
        success: false,
        message: 'master_type and value_name are required'
      });
    }

    const insertId = await subMasterService.createSubMaster(master_type, value_name);
    res.json({
      success: true,
      data: { id: insertId, master_type, value_name },
      message: 'Sub master option created successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'This option already exists'
      });
    }
    next(error);
  }
}

async function updateSubMaster(req, res, next) {
  try {
    const { id } = req.params;
    const { value_name } = req.body;
    if (!value_name) {
      return res.status(400).json({
        success: false,
        message: 'value_name is required'
      });
    }

    const success = await subMasterService.updateSubMaster(id, value_name);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Option not found or unchanged'
      });
    }

    res.json({
      success: true,
      message: 'Sub master option updated successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'This option already exists'
      });
    }
    next(error);
  }
}

async function deleteSubMaster(req, res, next) {
  try {
    const { id } = req.params;
    const success = await subMasterService.deleteSubMaster(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    res.json({
      success: true,
      message: 'Sub master option deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubMasters,
  createSubMaster,
  updateSubMaster,
  deleteSubMaster
};
