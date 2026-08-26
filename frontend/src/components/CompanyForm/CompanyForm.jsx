import React from 'react';
import FormField from '../FormField';
import SelectField from '../SelectField';
import TextareaField from '../TextareaField';
import './CompanyForm.css';

const INDUSTRY_OPTIONS = [
  'Pharma Manufacturing',
  'Pharma Marketing',
  'Medical Devices',
  'Nutraceuticals',
  'Food Manufacturing',
  'Chemical Manufacturing',
  'Other'
];

const SOURCE_OPTIONS = [
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
  onUpdate,
  onDelete,
  onClear,
  editState = 'idle',
  onModify,
  onCancel,
  onRefresh
}) => {
  const isIdle = editState === 'idle';

  return (
    <form className="company-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-grid">
        {/* Row 1 */}
        <div className="col-3">
          <FormField
            label="Company ID"
            name="mascom_id"
            value={formData.mascom_id}
            placeholder="[Auto-generated]"
            disabled={true}
          />
        </div>
        <div className="col-9">
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

        {/* Row 2 */}
        <div className="col-4">
          <SelectField
            label="Industry Type"
            name="industry_type"
            value={formData.industry_type}
            onChange={(e) => handleSelectChange('industry_type', e.target.value)}
            options={INDUSTRY_OPTIONS}
            required={true}
            error={errors.industry_type}
            disabled={isIdle}
          />
        </div>
        <div className="col-4">
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
        </div>
        <div className="col-4">
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
        </div>

        {/* Row 3 */}
        <div className="col-4">
          <SelectField
            label="Enquiry/Data Source"
            name="data_source"
            value={formData.data_source}
            onChange={(e) => handleSelectChange('data_source', e.target.value)}
            options={SOURCE_OPTIONS}
            required={true}
            error={errors.data_source}
            disabled={isIdle}
          />
        </div>
        <div className="col-4">
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
        <div className="col-4">
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

        {/* Row 4 */}
        <div className="col-12">
          <TextareaField
            label="Remarks"
            name="mascom_remarks"
            value={formData.mascom_remarks}
            onChange={handleChange}
            placeholder="Enter remarks (Optional)"
            error={errors.mascom_remarks}
            rows={2}
            maxLength={1000}
            disabled={isIdle}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {formData.mascom_remarks ? 1000 - formData.mascom_remarks.length : 1000} characters remaining
            </span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={!isIdle}
        >
          🔄 Refresh
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={onNew}
          disabled={!isIdle}
        >
          ✚ Add
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onModify}
          disabled={!isIdle}
        >
          ✎ Modify
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onDelete}
          disabled={!isIdle || !formData.mascom_id}
        >
          🗑 Delete
        </button>
        {!isIdle && (
          <>
            <button
              type="button"
              className="btn btn-success"
              onClick={onSave}
              style={{ marginLeft: 'auto' }}
            >
              💾 Save
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
      </div>
    </form>
  );
};

export default CompanyForm;
