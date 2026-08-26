import { Plus, Edit, Trash2, Save } from 'lucide-react';
import FormField from '../FormField';
import SelectField from '../SelectField';
import TextareaField from '../TextareaField';
import { RefreshCw } from 'lucide-react';
import './ContactForm.css';

const KEY_PERSON_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' }
];

const ContactForm = ({
  formData,
  errors,
  companies = [],
  handleChange,
  handleSelectChange,
  onNew,
  onSave,
  onDelete,
  editState = 'idle',
  onModify,
  onCancel,
  onRefresh
}) => {
  const isIdle = editState === 'idle';

  // Format companies into select options list
  const companyOptions = companies.map(
    (c) => `${c.mascom_id} — ${c.company_name}`
  );

  const handleCompanySelect = (val) => {
    const mascom_id = val ? val.split(' — ')[0] : '';
    handleSelectChange('mascom_id', mascom_id);
  };

  const selectedCompanyOption = formData.mascom_id
    ? companies.find((c) => c.mascom_id === formData.mascom_id)
      ? `${formData.mascom_id} — ${
          companies.find((c) => c.mascom_id === formData.mascom_id).company_name
        }`
      : ''
    : '';

  return (
    <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-grid">
        {/* Row 1 */}
        <div className="col-3">
          <FormField
            label="Contact ID"
            name="mascon_id"
            value={formData.mascon_id}
            placeholder="[Auto-generated]"
            disabled={true}
          />
        </div>
        <div className="col-5">
          <SelectField
            label="Company"
            name="mascom_id"
            value={selectedCompanyOption}
            onChange={(e) => handleCompanySelect(e.target.value)}
            options={companyOptions}
            required={true}
            error={errors.mascom_id}
            disabled={isIdle}
          />
        </div>
        <div className="col-4">
          <FormField
            label="Contact Name"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            placeholder="Enter contact name"
            required={true}
            error={errors.contact_name}
            maxLength={150}
            disabled={isIdle}
          />
        </div>

        {/* Row 2 */}
        <div className="col-4">
          <FormField
            label="Designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="Enter designation"
            error={errors.designation}
            maxLength={100}
            disabled={isIdle}
          />
        </div>
        <div className="col-4">
          <FormField
            label="Mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter mobile number"
            error={errors.mobile}
            maxLength={13}
            disabled={isIdle}
          />
        </div>
        <div className="col-4">
          <FormField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            error={errors.email}
            maxLength={150}
            disabled={isIdle}
          />
        </div>

        {/* Row 3 */}
        <div className="col-3">
          <SelectField
            label="Key Person"
            name="key_person"
            value={formData.key_person}
            onChange={(e) => handleSelectChange('key_person', e.target.value)}
            options={KEY_PERSON_OPTIONS}
            error={errors.key_person}
            disabled={isIdle}
          />
        </div>
        <div className="col-5">
          <FormField
            label="Sales User"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            placeholder="Enter sales user"
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
            name="mascon_remarks"
            value={formData.mascon_remarks}
            onChange={handleChange}
            placeholder="Enter remarks (Optional)"
            error={errors.mascon_remarks}
            rows={2}
            maxLength={1000}
            disabled={isIdle}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {formData.mascon_remarks ? 1000 - formData.mascon_remarks.length : 1000} characters remaining
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
    style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }} // Keeps icon and text aligned
  >
    <RefreshCw 
      size={14} 
      className={!isIdle ? 'spin-animation' : ''} // Optional: spins icon when not idle
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
        <button
          type="button"
          className="btn btn-primary"
          onClick={onModify}
          disabled={!isIdle}
        >
          <Edit size={14} style={{ marginRight: '6px' }} /> Modify
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onDelete}
          disabled={!isIdle || !formData.mascon_id}
        >
          <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
        </button>
        {!isIdle && (
          <>
            <button
              type="button"
              className="btn btn-success"
              onClick={onSave}
              style={{ marginLeft: 'auto' }}
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
      </div>
    </form>
  );
};

export default ContactForm;
