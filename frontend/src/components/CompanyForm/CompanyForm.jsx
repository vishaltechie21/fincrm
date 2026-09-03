import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  UserPlus, 
  Briefcase, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw, 
  UserCheck 
} from '../Icon';
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
  sourceOptions = SOURCE_DEFAULT_OPTIONS,
  defaultTab = 'company_info'
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['company_info', 'address_info', 'contacts_info', 'commercial_info', 'remarks_info'].includes(tabParam)) {
      return tabParam;
    }
    return defaultTab;
  });

  // Contact Entry Sub-Form State
  const [contactInput, setContactInput] = useState({
    contact_name: '',
    designation: '',
    mobile: '',
    email: '',
    key_person: 'N',
    mascon_remarks: ''
  });

  // Listen for URL tab param change or defaultTab prop change
  useEffect(() => {
    const handleUrlTab = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['company_info', 'address_info', 'contacts_info', 'commercial_info', 'remarks_info'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (defaultTab) {
        setActiveTab(defaultTab);
      }
    };
    handleUrlTab();
    window.addEventListener('popstate', handleUrlTab);
    return () => window.removeEventListener('popstate', handleUrlTab);
  }, [defaultTab]);

  const handleSubTabClick = (tabKey) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabKey);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  const isIdle = editState === 'idle';

  const availableCities = getCitiesForState(formData.state);
  const cityOptions = formData.city && !availableCities.includes(formData.city)
    ? [formData.city, ...availableCities]
    : availableCities;

  // Completion badges calculation
  const isCompanyInfoComplete = Boolean(formData.company_name && formData.industry_type && formData.data_source && formData.user_name);
  const isAddressInfoComplete = Boolean(formData.state && formData.city);
  const isContactsComplete = Boolean(contactInput.contact_name || (formData.contacts && formData.contacts.length > 0));
  const isCommercialComplete = Boolean(formData.erp_using || formData.budget || formData.quoted || formData.units || formData.users);
  const isRemarksComplete = Boolean(formData.mascom_remarks);

  return (
    <form className="company-form" onSubmit={(e) => e.preventDefault()}>
      {/* Sub Tabs Navigation Bar */}
      <div className="company-subtabs-bar">
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'company_info' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('company_info')}
        >
          <Building2 size={13} className="subtab-icon" />
          <span>Company Info</span>
          {isCompanyInfoComplete && <span className="subtab-check-badge">✓</span>}
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'address_info' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('address_info')}
        >
          <MapPin size={13} className="subtab-icon" />
          <span>Address & Location</span>
          {isAddressInfoComplete && <span className="subtab-check-badge">✓</span>}
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'contacts_info' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('contacts_info')}
        >
          <UserPlus size={13} className="subtab-icon" />
          <span>Contact Persons</span>
          {isContactsComplete && <span className="subtab-check-badge">✓</span>}
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'commercial_info' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('commercial_info')}
        >
          <Briefcase size={13} className="subtab-icon" />
          <span>Tech & Commercials</span>
          {isCommercialComplete && <span className="subtab-check-badge">✓</span>}
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'remarks_info' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('remarks_info')}
        >
          <FileText size={13} className="subtab-icon" />
          <span>Remarks & Notes</span>
          {isRemarksComplete && <span className="subtab-check-badge">✓</span>}
        </button>
      </div>

      {/* Sub Tab 1: Company Details */}
      {activeTab === 'company_info' && (
        <div className="subtab-content-panel">
          <div className="form-grid">
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
          </div>
        </div>
      )}

      {/* Sub Tab 2: Address & Location */}
      {activeTab === 'address_info' && (
        <div className="subtab-content-panel">
          <div className="form-grid">
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
                label="Head Office Address"
                name="ho"
                value={formData.ho || ''}
                onChange={handleChange}
                placeholder="Enter head office address"
                maxLength={150}
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
                maxLength={150}
                disabled={isIdle}
              />
            </div>
            <div className="col-6">
              <FormField
                label="Website"
                name="web"
                value={formData.web || ''}
                onChange={handleChange}
                placeholder="e.g. www.company.com"
                error={errors.web}
                maxLength={150}
                disabled={isIdle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Contact Persons Entry Form */}
      {activeTab === 'contacts_info' && (
        <div className="subtab-content-panel">
          <div className="form-grid">
            <div className="col-3">
              <FormField
                label="Contact Name"
                name="contact_name"
                value={contactInput.contact_name}
                onChange={(e) => setContactInput({ ...contactInput, contact_name: e.target.value })}
                placeholder="Enter contact name"
                maxLength={100}
                disabled={isIdle}
              />
            </div>
            <div className="col-3">
              <FormField
                label="Designation"
                name="designation"
                value={contactInput.designation}
                onChange={(e) => setContactInput({ ...contactInput, designation: e.target.value })}
                placeholder="e.g. Manager"
                maxLength={100}
                disabled={isIdle}
              />
            </div>
            <div className="col-3">
              <FormField
                label="Mobile No (10 Digits)"
                name="mobile"
                value={contactInput.mobile}
                onChange={(e) => {
                  const cleanMobile = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setContactInput({ ...contactInput, mobile: cleanMobile });
                }}
                placeholder="10-digit mobile number"
                maxLength={10}
                disabled={isIdle}
                error={contactInput.mobile && contactInput.mobile.length !== 10 ? 'Mobile must be 10 digits' : ''}
              />
            </div>
            <div className="col-3">
              <FormField
                label="Email ID"
                name="email"
                value={contactInput.email}
                onChange={(e) => setContactInput({ ...contactInput, email: e.target.value })}
                placeholder="Enter email"
                maxLength={100}
                disabled={isIdle}
              />
            </div>
            <div className="col-3">
              <SelectField
                label="Key Person"
                name="key_person"
                value={contactInput.key_person}
                onChange={(e) => setContactInput({ ...contactInput, key_person: e.target.value })}
                options={['N', 'Y']}
                disabled={isIdle}
              />
            </div>
            <div className="col-9">
              <FormField
                label="Remarks"
                name="mascon_remarks"
                value={contactInput.mascon_remarks}
                onChange={(e) => setContactInput({ ...contactInput, mascon_remarks: e.target.value })}
                placeholder="Contact notes (Optional)"
                maxLength={500}
                disabled={isIdle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 4: Tech & Commercials */}
      {activeTab === 'commercial_info' && (
        <div className="subtab-content-panel">
          <div className="form-grid">
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
            <div className="col-3">
              <FormField
                label="No. Of Units"
                name="units"
                value={formData.units || ''}
                onChange={handleChange}
                placeholder="e.g. 2"
                error={errors.units}
                maxLength={10}
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
                maxLength={10}
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
                maxLength={50}
                disabled={isIdle}
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
                maxLength={50}
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
                maxLength={50}
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
                maxLength={100}
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

            <div className="col-12">
              <FormField
                label="Requirement"
                name="want"
                value={formData.want || ''}
                onChange={handleChange}
                placeholder="Enter requirement"
                maxLength={500}
                disabled={isIdle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 5: Remarks & Notes */}
      {activeTab === 'remarks_info' && (
        <div className="subtab-content-panel">
          <div className="form-grid">
            <div className="col-12">
              <FormField
                label="Company Remarks"
                name="mascom_remarks"
                value={formData.mascom_remarks}
                onChange={handleChange}
                placeholder="Enter company remarks (Optional)"
                error={errors.mascom_remarks}
                maxLength={1000}
                disabled={isIdle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Form Action Buttons */}
      <div className="form-actions mt-3">
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
