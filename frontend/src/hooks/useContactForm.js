import { useState } from 'react';
import { validateContact } from '../utils/validation';

const initialFormState = {
  mascon_id: '',
  mascom_id: '',
  contact_name: '',
  designation: '',
  mobile: '',
  email: '',
  key_person: 'N',
  user_name: '',
  mascon_remarks: ''
};

export const useContactForm = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const loadContact = (contact) => {
    setFormData({
      mascon_id: contact.mascon_id || '',
      mascom_id: contact.mascom_id || '',
      contact_name: contact.contact_name || '',
      designation: contact.designation || '',
      mobile: contact.mobile || '',
      email: contact.email || '',
      key_person: contact.key_person || 'N',
      user_name: contact.user_name || '',
      mascon_remarks: contact.mascon_remarks || ''
    });
    setErrors({});
    setIsDirty(false);
  };

  const validate = () => {
    const validationErrors = validateContact(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  return {
    formData,
    errors,
    handleChange,
    handleSelectChange,
    resetForm,
    loadContact,
    validate,
    setErrors,
    setFormData,
    isDirty,
    setIsDirty
  };
};
