/**
 * Frontend form validation helper.
 * Returns an object containing error messages for invalid fields.
 */
export const validateCompany = (data) => {
  const errors = {};

  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.company_name = 'Company Name must be at least 2 characters.';
  } else if (data.company_name.trim().length > 150) {
    errors.company_name = 'Company Name cannot exceed 150 characters.';
  }

  if (!data.industry_type || data.industry_type.trim() === '') {
    errors.industry_type = 'Industry Type is required.';
  }

  if (!data.city || data.city.trim() === '') {
    errors.city = 'City is required.';
  } else if (data.city.trim().length > 100) {
    errors.city = 'City cannot exceed 100 characters.';
  } else if (!/^[a-zA-Z\s.\-']+$/.test(data.city.trim())) {
    errors.city = 'City can only contain letters, spaces, dots, and hyphens.';
  }

  if (!data.state || data.state.trim() === '') {
    errors.state = 'State is required.';
  } else if (data.state.trim().length > 100) {
    errors.state = 'State cannot exceed 100 characters.';
  } else if (!/^[a-zA-Z\s.\-']+$/.test(data.state.trim())) {
    errors.state = 'State can only contain letters, spaces, dots, and hyphens.';
  }

  if (!data.data_source || data.data_source.trim() === '') {
    errors.data_source = 'Data Source is required.';
  }

  if (!data.user_name || data.user_name.trim() === '') {
    errors.user_name = 'User Name is required.';
  } else if (data.user_name.trim().length > 100) {
    errors.user_name = 'User Name cannot exceed 100 characters.';
  } else if (!/^[a-zA-Z0-9_.]+$/.test(data.user_name.trim())) {
    errors.user_name = 'User Name can only contain letters, numbers, underscores, and dots.';
  }

  if (data.erp_using && data.erp_using.trim().length > 100) {
    errors.erp_using = 'ERP Used cannot exceed 100 characters.';
  }

  if (data.mascom_remarks && data.mascom_remarks.trim().length > 1000) {
    errors.mascom_remarks = 'Remarks cannot exceed 1000 characters.';
  }

  return errors;
};

export const validateContact = (data) => {
  const errors = {};

  if (!data.contact_name || data.contact_name.trim().length < 2) {
    errors.contact_name = 'Contact Name must be at least 2 characters.';
  } else if (data.contact_name.trim().length > 150) {
    errors.contact_name = 'Contact Name cannot exceed 150 characters.';
  } else if (!/^[a-zA-Z\s.\-']+$/.test(data.contact_name.trim())) {
    errors.contact_name = 'Contact Name can only contain letters, spaces, dots, and hyphens.';
  }

  if (!data.mascom_id || data.mascom_id.trim() === '') {
    errors.mascom_id = 'Company is required.';
  }

  if (!data.user_name || data.user_name.trim() === '') {
    errors.user_name = 'Sales User is required.';
  } else if (data.user_name.trim().length > 100) {
    errors.user_name = 'Sales User cannot exceed 100 characters.';
  } else if (!/^[a-zA-Z0-9_.]+$/.test(data.user_name.trim())) {
    errors.user_name = 'Sales User can only contain letters, numbers, underscores, and dots.';
  }

  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Invalid email format.';
    } else if (data.email.trim().length > 150) {
      errors.email = 'Email cannot exceed 150 characters.';
    }
  }

  if (data.mobile && data.mobile.trim() !== '') {
    if (data.mobile.trim().length > 20) {
      errors.mobile = 'Mobile cannot exceed 20 characters.';
    } else if (!/^[0-9+\s\-()]+$/.test(data.mobile.trim())) {
      errors.mobile = 'Mobile can only contain numbers, spaces, and formatting symbols.';
    }
  }

  if (data.designation && data.designation.trim().length > 100) {
    errors.designation = 'Designation cannot exceed 100 characters.';
  }

  if (data.mascon_remarks && data.mascon_remarks.trim().length > 1000) {
    errors.mascon_remarks = 'Remarks cannot exceed 1000 characters.';
  }

  return errors;
};
