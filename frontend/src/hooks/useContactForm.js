/**
 * useContactForm — thin wrapper over useEntityForm.
 * Kept for backward compatibility with existing ContactMaster usage.
 */
import { useEntityForm } from './useEntityForm';
import { validateContact } from '../utils/validation';

const CONTACT_INITIAL_STATE = {
  mascon_id: '',
  mascom_id: '',
  contact_name: '',
  designation: '',
  mobile: '',
  email: '',
  key_person: '',
  user_name: 'admin_fincrm',
  mascon_remarks: '',
};

export const useContactForm = () => {
  const form = useEntityForm({
    initialState: CONTACT_INITIAL_STATE,
    validationFn: validateContact,
  });

  // Alias loadEntity -> loadContact for backward compatibility
  return {
    ...form,
    loadContact: form.loadEntity,
    validate: form.validate,
  };
};
