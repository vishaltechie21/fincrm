const contactService = require('../services/contactService');

/**
 * Basic validator for contact input schema constraints.
 */
function validateContactData(data) {
  const errors = {};

  if (!data.contact_name || data.contact_name.trim().length < 2 || data.contact_name.trim().length > 150) {
    errors.contact_name = 'Contact Name is required (2-150 characters).';
  }

  if (!data.mascom_id || data.mascom_id.trim() === '') {
    errors.mascom_id = 'Company is required.';
  }

  if (!data.user_name || data.user_name.trim() === '') {
    errors.user_name = 'Sales User is required.';
  }

  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Invalid email format.';
    } else if (data.email.trim().length > 150) {
      errors.email = 'Email cannot exceed 150 characters.';
    }
  }

  if (data.mobile && data.mobile.trim().length > 20) {
    errors.mobile = 'Mobile cannot exceed 20 characters.';
  }

  if (data.designation && data.designation.trim().length > 100) {
    errors.designation = 'Designation cannot exceed 100 characters.';
  }

  if (data.mascon_remarks && data.mascon_remarks.trim().length > 1000) {
    errors.mascon_remarks = 'Remarks cannot exceed 1000 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function getContacts(req, res, next) {
  try {
    const search = req.query.search || '';
    const contacts = await contactService.getAllContacts(search);
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
}

async function getContact(req, res, next) {
  try {
    const { id } = req.params;
    const contact = await contactService.getContactById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID ${id} not found`
      });
    }
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
}

async function createContact(req, res, next) {
  try {
    const validation = validateContactData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const newContact = await contactService.createContact(req.body);
    res.status(201).json({
      success: true,
      data: newContact
    });
  } catch (error) {
    next(error);
  }
}

async function updateContact(req, res, next) {
  try {
    const { id } = req.params;
    const validation = validateContactData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const updated = await contactService.updateContact(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID ${id} not found`
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

async function deleteContact(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await contactService.deleteContact(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Contact with ID ${id} not found`
      });
    }
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
};
