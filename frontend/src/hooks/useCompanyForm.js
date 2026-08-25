import { useState } from 'react';
import { validateCompany } from '../utils/validation';

const initialFormState = {
  mascom_id: '',
  company_name: '',
  industry_type: '',
  city: '',
  state: '',
  data_source: '',
  erp_using: '',
  user_name: '',
  mascom_remarks: ''
};

export const useCompanyForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Proactively clear validation errors as the user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setIsDirty(false);
  };

  const loadCompany = (company) => {
    setFormData({
      mascom_id: company.mascom_id || '',
      company_name: company.company_name || '',
      industry_type: company.industry_type || '',
      city: company.city || '',
      state: company.state || '',
      data_source: company.data_source || '',
      erp_using: company.erp_using || '',
      user_name: company.user_name || '',
      mascom_remarks: company.mascom_remarks || ''
    });
    setErrors({});
    setIsDirty(false);
  };

  const validate = () => {
    const validationErrors = validateCompany(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  return {
    formData,
    errors,
    handleChange,
    handleSelectChange,
    resetForm,
    loadCompany,
    validate,
    setErrors,
    setFormData,
    isDirty,
    setIsDirty
  };
};
