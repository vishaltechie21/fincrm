import { Plus, Edit, Trash2, Save } from 'lucide-react';
import FormField from '../FormField';
import SelectField from '../SelectField';
import { RefreshCw } from 'lucide-react';


const INDUSTRY_DEFAULT_OPTIONS = [
  'Pharma Manufacturing',
  'Pharma Marketing',
  'Medical Devices',
  'Nutraceuticals',
  'Food Manufacturing',
  'Chemical Manufacturing',
  'Other'
];

const SOURCE_DEFAULT_OPTIONS = [
  'Website',
  'Referral',
  'WhatsApp',
  'Bulk Mail',
  'Cold Call',
  'Exhibition',
  'Existing Client',
  'Other'
];

const CompanyForm = ({
  formData,
  errors,
  handleChange,
  handleSelectChange,
  onNew,
  onSave,
  onDelete,
  editState = 'idle',
  onModify,
  onCancel,
  onRefresh,
  industryOptions = INDUSTRY_DEFAULT_OPTIONS,
  sourceOptions = SOURCE_DEFAULT_OPTIONS
}) => {
  const isIdle = editState === 'idle';

  return (
    <form className="company-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-grid">
        {/* Column 1 */}
        <div className="col-4 form-column">
          <FormField
            label="Company ID"
            name="mascom_id"
            value={formData.mascom_id}
            placeholder="[Auto-generated]"
            disabled={true}
          />
          <SelectField
            label="Industry Type"
            name="industry_type"
            value={formData.industry_type}
            onChange={(e) => handleSelectChange('industry_type', e.target.value)}
            options={industryOptions}
            required={true}
            error={errors.industry_type}
            disabled={isIdle}
          />
          <SelectField
            label="Enquiry/Data Source"
            name="data_source"
            value={formData.data_source}
            onChange={(e) => handleSelectChange('data_source', e.target.value)}
            options={sourceOptions}
            required={true}
            error={errors.data_source}
            disabled={isIdle}
          />
        </div>

        {/* Column 2 */}
        <div className="col-4 form-column">
          <FormField
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Enter company name"
            required={true}
            error={errors.company_name}
            maxLength={150}
            disabled={isIdle}
          />
          <FormField
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            required={true}
            error={errors.city}
            maxLength={100}
            disabled={isIdle}
          />
          <FormField
            label="ERP Used"
            name="erp_using"
            value={formData.erp_using}
            onChange={handleChange}
            placeholder="e.g. Tally, SAP (Optional)"
            error={errors.erp_using}
            maxLength={100}
            disabled={isIdle}
          />
        </div>

        {/* Column 3 */}
        <div className="col-4 form-column">
          <FormField
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter state"
            required={true}
            error={errors.state}
            maxLength={100}
            disabled={isIdle}
          />
          <FormField
            label="User Name"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            placeholder="Enter user name"
            required={true}
            error={errors.user_name}
            maxLength={100}
            disabled={isIdle}
          />
          <FormField
            label="Remarks"
            name="mascom_remarks"
            value={formData.mascom_remarks}
            onChange={handleChange}
            placeholder="Enter remarks (Optional)"
            error={errors.mascom_remarks}
            maxLength={1000}
            disabled={isIdle}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={!isIdle}
        >
          <RefreshCw
            size={14} 
            className={!isIdle ? 'spin-animation' : ''}
            style={{ marginRight: '6px' }}
          />
          Refresh
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={onNew}
          disabled={!isIdle}
        >
          <Plus size={14} style={{ marginRight: '6px' }} /> Add
        </button>
        {!isIdle && (
          <>
            <button
              type="button"
              className="btn btn-success"
              onClick={onSave}
            >
              <Save size={14} style={{ marginRight: '6px' }} /> Save
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
            >
              Cancel
            </button>
          </>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onModify}
          disabled={!isIdle || !formData.mascom_id}
        >
          <Edit size={14} style={{ marginRight: '6px' }} /> Modify
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onDelete}
          disabled={!isIdle || !formData.mascom_id}
        >
          <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;
