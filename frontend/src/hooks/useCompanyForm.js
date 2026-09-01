/**
 * useCompanyForm — thin wrapper over useEntityForm.
 * Kept for backward compatibility with existing CompanyMaster usage.
 */
import { useEntityForm } from './useEntityForm';
import { validateCompany } from '../utils/validation';

const COMPANY_INITIAL_STATE = {
  mascom_id: '',
  company_name: '',
  industry_type: '',
  city: '',
  state: '',
  data_source: '',
  erp_using: '',
  user_name: '',
  mascom_remarks: '',
  ho: '',
  plant: '',
  web: '',
  units: '',
  users: '',
  client: '',
  follow: '',
  want: '',
  seen: '',
  budget: '',
  quoted: '',
  turnover: ''
};

export const useCompanyForm = () => {
  const form = useEntityForm({
    initialState: COMPANY_INITIAL_STATE,
    validationFn: validateCompany,
  });

  // Alias loadEntity -> loadCompany for backward compatibility
  return {
    ...form,
    loadCompany: form.loadEntity,
    validate: form.validate,
  };
};
