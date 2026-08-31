/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Building2 } from 'lucide-react';
import CompanyForm from '../../components/CompanyForm/CompanyForm';
import CompanyTable from '../../components/CompanyTable/CompanyTable';
import Notification from '../../components/Notification/Notification';
import Loading from '../../components/Loading/Loading';
import { useCompanyForm } from '../../hooks/useCompanyForm';
import * as companyService from '../../services/companyService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import ImportModal from '../../components/ImportModal/ImportModal';
import Swal from 'sweetalert2';
import { validateCompany } from '../../utils/validation';


const CompanyMaster = forwardRef(({ onEditStateChange }, ref) => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  
  // Infinite Scroll & Sorting state
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState('mascom_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  // Edit mode states
  const [editState, setEditState] = useState('idle'); // 'idle', 'adding', 'modifying'
  const [revertData, setRevertData] = useState(null);

  const {
    formData,
    errors,
    handleChange,
    handleSelectChange,
    resetForm,
    loadCompany,
    validate,
    setErrors,
    setFormData
  } = useCompanyForm();

  // Fetch companies list from backend
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await companyService.getCompanies('');
      if (res.success) {
        setCompanies(res.data);
        setVisibleCount(50);
      } else {
        showNotification(res.message || 'Failed to fetch companies', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error occurred while fetching companies', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortField('mascom_id');
      setSortAsc(true);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const predictNextId = () => {
    const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);
    
    let nextSeq = 1;
    if (companies.length > 0) {
      const sequences = companies
        .map((c) => {
          const parts = c.mascom_id ? c.mascom_id.split('-') : [];
          return parts.length === 2 ? parseInt(parts[1], 10) : 0;
        })
        .filter((seq) => !isNaN(seq));
      
      if (sequences.length > 0) {
        nextSeq = Math.max(...sequences) + 1;
      }
    }
    
    const paddedSeq = String(nextSeq).padStart(5, '0');
    return `${timestampPrefix}-${paddedSeq}`;
  };

  // Actions row toolbar handlers
  const handleRefresh = () => {
    resetForm();
    setErrors({});
    setEditState('idle');
    fetchCompanies();
    setVisibleCount(50);
    showNotification('Form refreshed', 'info');
  };

  const handleNew = () => {
    resetForm();
    setErrors({});
    const nextId = predictNextId();
    setFormData((prev) => ({ ...prev, mascom_id: nextId }));
    setEditState('adding');
    showNotification('Creating new record. Form inputs unlocked.', 'info');
  };

  const handleModifyMode = () => {
    if (!formData.mascom_id) {
      showNotification('Please select a company to modify first', 'warning');
      return;
    }
    setRevertData({ ...formData });
    setEditState('modifying');
    showNotification('Modifying selected record. Form inputs unlocked.', 'info');
  };

  const handleCancelEdit = () => {
    if (editState === 'adding') {
      resetForm();
    } else if (editState === 'modifying' && revertData) {
      setFormData(revertData);
    }
    setErrors({});
    setEditState('idle');
    showNotification('Edit cancelled. Form inputs locked.', 'info');
  };

  const handleSave = async () => {
    if (!validate()) {
      const validationErrors = validateCompany(formData);
      const errorMessages = Object.values(validationErrors);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Warning',
        html: `<ul style="text-align: left; font-size: 11px; margin: 0; padding-left: 20px;">
          ${errorMessages.map(msg => `<li style="margin-bottom: 4px; color: var(--text-h);">${msg}</li>`).join('')}
        </ul>`,
        confirmButtonColor: 'var(--accent)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });
      return false;
    }
    try {
      let res;
      const isAdding = editState === 'adding';
      if (isAdding) {
        res = await companyService.createCompany(formData);
      } else {
        res = await companyService.updateCompany(formData.mascom_id, formData);
      }

      if (res.success) {
        const savedCompany = res.data;
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Company ${savedCompany.mascom_id} ${isAdding ? 'saved' : 'updated'} successfully!`,
          confirmButtonColor: 'var(--accent)',
          background: 'var(--panel)',
          color: 'var(--text-h)'
        });
        loadCompany(savedCompany);
        setEditState('idle');
        fetchCompanies();
        return true;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || 'Failed to save company',
          confirmButtonColor: 'var(--accent)',
          background: 'var(--panel)',
          color: 'var(--text-h)'
        });
        if (res.errors) setErrors(res.errors);
        return false;
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Network error: failed to save company';
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: apiMsg,
        confirmButtonColor: 'var(--accent)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      return false;
    }
  };

  useEffect(() => {
    if (onEditStateChange) {
      onEditStateChange(editState !== 'idle');
    }
  }, [editState, onEditStateChange]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      return await handleSave();
    },
    discard: () => {
      handleCancelEdit();
    }
  }));

  const handleDelete = (idToDelete) => {
    const targetId = idToDelete || formData.mascom_id;
    if (!targetId) {
      showNotification('No company selected to delete', 'warning');
      return;
    }
    setDeleteConfirm({ isOpen: true, id: targetId });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null });
    try {
      const res = await companyService.deleteCompany(id);
      if (res.success) {
        showNotification(`Company ${id} deleted successfully!`, 'success');
        if (id === formData.mascom_id) {
          resetForm();
        }
        setEditState('idle');
        fetchCompanies();
      } else {
        showNotification(res.message || 'Failed to delete company', 'error');
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Network error: failed to delete company';
      showNotification(apiMsg, 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  // Row selection handler
  const handleRowClick = (company) => {
    if (editState !== 'idle') {
      showNotification('Please save or cancel your current edit first.', 'warning');
      return;
    }
    loadCompany(company);
    setErrors({});
  };

  const handleRowDoubleClick = (company) => {
    loadCompany(company);
    setErrors({});
    showNotification(`Loaded company ${company.mascom_id} into form`, 'info');
  };

  // Excel template data and import row handler
  const IMPORT_TEMPLATE_HEADERS = ['Company Name', 'Industry Type', 'City', 'State', 'Enquiry/Data Source', 'ERP Used', 'User Name', 'Remarks'];
  
  const IMPORT_SAMPLE_DATA = [{
    'Company Name': 'Sample Company Ltd',
    'Industry Type': 'Pharma Marketing',
    'City': 'Noida',
    'State': 'Uttar Pradesh',
    'Enquiry/Data Source': 'WhatsApp',
    'ERP Used': 'Tally',
    'User Name': 'admin_fincrm',
    'Remarks': 'Interested in CRM modules'
  }];

  const handleSaveImportedRow = async (row) => {
    const payload = {
      company_name: row['Company Name'] || '',
      industry_type: row['Industry Type'] || '',
      city: row['City'] || '',
      state: row['State'] || '',
      data_source: row['Enquiry/Data Source'] || '',
      erp_using: row['ERP Used'] || '',
      user_name: row['User Name'] || '',
      mascom_remarks: row['Remarks'] || ''
    };
    return await companyService.createCompany(payload);
  };

  const handleImportComplete = (count) => {
    showNotification(`Successfully imported ${count} companies!`, 'success');
    fetchCompanies();
    setIsImportOpen(false);
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const visibleCompanies = sortedCompanies.slice(0, visibleCount);


  return (
    <div className="master-page">
      {/* Sub-header navigation row */}
      <div className="master-sub-header">
        {/* <div className="sub-header-left">
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'entry' ? 'active' : ''}`}
            onClick={() => {
              if (editState !== 'idle') {
                showNotification('Please save or cancel your current edit first.', 'warning');
                return;
              }
              setActiveTab('entry');
            }}
          >
            <FileText size={14} /> Entry
          </button>
          <span className="sub-tab-separator">|</span>
          <button
            type="button"
            className={`sub-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => {
              if (editState !== 'idle') {
                showNotification('Please save or cancel your current edit first.', 'warning');
                return;
              }
              setActiveTab('search');
            }}
          >
            <Search size={14} /> Search
          </button>
        </div> */}

        <div className="sub-header-center">
          <span className="sub-title-icon"><Building2 size={16} /></span>
          <span className="sub-title-text">Company Master Entry</span>
        </div>

        <div className="sub-header-right">
          <span className="view-pill-badge">VIEW</span>
        </div>
      </div>

      <div className="master-body-container">
        <div className="entry-layout-split">
          {/* Top Form Panel */}
          <div className="form-panel">
            <CompanyForm
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              onNew={handleNew}
              onSave={handleSave}
              onUpdate={handleSave}
              onDelete={() => handleDelete()}
              onClear={handleRefresh}
              editState={editState}
              onModify={handleModifyMode}
              onCancel={handleCancelEdit}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Bottom Lower Table view */}
          <div className="lower-table-panel">
            <div className="panel-title">
              <h3>Registered Companies List</h3>
            </div>
            {isLoading ? (
              <Loading type="skeleton" />
            ) : (
              <>
                <CompanyTable
                  companies={visibleCompanies}
                  onEdit={handleRowClick}
                  onDelete={handleDelete}
                  activeId={formData.mascom_id}
                  onRowDoubleClick={handleRowDoubleClick}
                  onLoadMore={() => setVisibleCount((prev) => prev + 50)}
                  sortField={sortField}
                  sortAsc={sortAsc}
                  onSort={handleSort}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'success' })}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Confirmation"
        message={`Are you sure you want to delete company ${deleteConfirm.id}?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Companies"
        templateHeaders={IMPORT_TEMPLATE_HEADERS}
        sampleData={IMPORT_SAMPLE_DATA}
        onSaveRow={handleSaveImportedRow}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
});

export default CompanyMaster;
