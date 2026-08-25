const companyService = require('../services/companyService');

/**
 * Basic validator for company input schema constraints.
 */
function validateCompanyData(data) {
  const errors = {};

  if (!data.company_name || data.company_name.trim().length < 2 || data.company_name.trim().length > 150) {
    errors.company_name = 'Company Name is required (2-150 characters).';
  }

  if (!data.industry_type || data.industry_type.trim() === '') {
    errors.industry_type = 'Industry Type is required.';
  }

  if (!data.city || data.city.trim() === '') {
    errors.city = 'City is required.';
  }

  if (!data.state || data.state.trim() === '') {
    errors.state = 'State is required.';
  }

  if (!data.data_source || data.data_source.trim() === '') {
    errors.data_source = 'Data Source is required.';
  }

  if (!data.user_name || data.user_name.trim() === '') {
    errors.user_name = 'User Name is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function getCompanies(req, res, next) {
  try {
    const search = req.query.search || '';
    const companies = await companyService.getAllCompanies(search);
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
}

async function getCompany(req, res, next) {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${id} not found`
      });
    }
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
}

async function createCompany(req, res, next) {
  try {
    const validation = validateCompanyData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const newCompany = await companyService.createCompany(req.body);
    res.status(201).json({
      success: true,
      data: newCompany
    });
  } catch (error) {
    next(error);
  }
}

async function updateCompany(req, res, next) {
  try {
    const { id } = req.params;
    const validation = validateCompanyData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const updated = await companyService.updateCompany(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCompany(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await companyService.deleteCompany(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${id} not found`
      });
    }
    res.json({
      success: true,
      message: `Company ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany
};
