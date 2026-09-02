import { Plus, Edit, Trash2, Save, RefreshCw } from 'lucide-react';
import FormField from '../FormField';
import SelectField from '../SelectField';
import { ALL_STATES, getCitiesForState } from '../../utils/locationData';

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
  errors = {},
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

  const availableCities = getCitiesForState(formData.state);
  const cityOptions = formData.city && !availableCities.includes(formData.city)
    ? [formData.city, ...availableCities]
    : availableCities;

  return (
    <form className="company-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-grid">
        {/* Row 1: 4 Inputs Aligned */}
        <div className="col-3">
          <FormField
            label="Company ID"
            name="mascom_id"
            value={formData.mascom_id}
            placeholder="[Auto-generated]"
            disabled={true}
          />
        </div>
        <div className="col-3">
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
        </div>
        <div className="col-3">
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
        </div>
        <div className="col-3">
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

        {/* Row 2: 4 Inputs Aligned - State & City Dropdowns */}
        <div className="col-3">
          <SelectField
            label="State"
            name="state"
            value={formData.state || ''}
            onChange={(e) => {
              const newState = e.target.value;
              handleSelectChange('state', newState);
              const cities = getCitiesForState(newState);
              if (cities.length > 0) {
                handleSelectChange('city', cities[0]);
              }
            }}
            options={ALL_STATES}
            required={true}
            error={errors.state}
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <SelectField
            label="City"
            name="city"
            value={formData.city || ''}
            onChange={(e) => handleSelectChange('city', e.target.value)}
            options={cityOptions.length > 0 ? cityOptions : ['Noida', 'Delhi', 'Gurugram', 'Mumbai']}
            required={true}
            error={errors.city}
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Website"
            name="web"
            value={formData.web || ''}
            onChange={handleChange}
            placeholder="e.g. www.company.com"
            error={errors.web}
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
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

        {/* Row 3: 4 Inputs Aligned */}
        <div className="col-3">
          <FormField
            label="Head Office"
            name="ho"
            value={formData.ho || ''}
            onChange={handleChange}
            placeholder="Enter head office"
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Plant Location"
            name="plant"
            value={formData.plant || ''}
            onChange={handleChange}
            placeholder="Enter plant location"
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="No. Of Units"
            name="units"
            value={formData.units || ''}
            onChange={handleChange}
            placeholder="e.g. 2"
            error={errors.units}
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="No. Of Users"
            name="users"
            value={formData.users || ''}
            onChange={handleChange}
            placeholder="e.g. 30"
            error={errors.users}
            disabled={isIdle}
          />
        </div>

        {/* Row 4: 4 Inputs Aligned */}
        <div className="col-3">
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
        </div>
        <div className="col-3">
          <SelectField
            label="Client Status"
            name="client"
            value={formData.client || ''}
            onChange={(e) => handleSelectChange('client', e.target.value)}
            options={['Yes', 'No']}
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Next Follow-Up Date"
            name="follow"
            type="date"
            value={formData.follow || ''}
            onChange={handleChange}
            error={errors.follow}
            disabled={isIdle}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Budget"
            name="budget"
            value={formData.budget || ''}
            onChange={handleChange}
            placeholder="Enter budget"
            error={errors.budget}
            disabled={isIdle}
          />
        </div>

        {/* Row 5: 4 Inputs Aligned */}
        <div className="col-3">
          <FormField
            label="Requirement"
            name="want"
            value={formData.want || ''}
            onChange={handleChange}
            placeholder="Enter requirement"
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Competitors Seen"
            name="seen"
            value={formData.seen || ''}
            onChange={handleChange}
            placeholder="Enter competitors"
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Quoted Value"
            name="quoted"
            value={formData.quoted || ''}
            onChange={handleChange}
            placeholder="Enter quoted value"
            error={errors.quoted}
            disabled={isIdle}
          />
        </div>
        <div className="col-3">
          <FormField
            label="Annual Turnover"
            name="turnover"
            value={formData.turnover || ''}
            onChange={handleChange}
            placeholder="Enter turnover"
            error={errors.turnover}
            disabled={isIdle}
          />
        </div>

        {/* Row 6: Company Remarks (Full Width) */}
        <div className="col-12">
          <FormField
            label="Company Remarks"
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
