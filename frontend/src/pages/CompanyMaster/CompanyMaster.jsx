/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import CompanyForm from '../../components/CompanyForm/CompanyForm';
import CompanyTable from '../../components/CompanyTable/CompanyTable';
import Notification from '../../components/Notification/Notification';
import Loading from '../../components/Loading/Loading';
import { useCompanyForm } from '../../hooks/useCompanyForm';
import * as companyService from '../../services/companyService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import ImportModal from '../../components/ImportModal/ImportModal';
import './CompanyMaster.css';

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  
  // Client-side Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
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
    if (!validate()) return;
    try {
      let res;
      if (editState === 'adding') {
        res = await companyService.createCompany(formData);
      } else {
        res = await companyService.updateCompany(formData.mascom_id, formData);
      }

      if (res.success) {
        const savedCompany = res.data;
        showNotification(
          `Company ${savedCompany.mascom_id} ${editState === 'adding' ? 'saved' : 'updated'} successfully!`,
          'success'
        );
        loadCompany(savedCompany);
        setEditState('idle');
        if (editState === 'adding') {
          setCurrentPage(1);
        }
        fetchCompanies();
      } else {
        showNotification(res.message || 'Failed to save company', 'error');
        if (res.errors) setErrors(res.errors);
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Network error: failed to save company';
      showNotification(apiMsg, 'error');
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    }
  };

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

  const displayCompanies = companies;
  const totalPages = Math.max(1, Math.ceil(displayCompanies.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompanies = displayCompanies.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [displayCompanies.length, totalPages, currentPage]);


  return (
    <div className="company-master-page">
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
                  companies={currentCompanies}
                  onEdit={handleRowClick}
                  onDelete={handleDelete}
                  activeId={formData.mascom_id}
                  onRowDoubleClick={handleRowDoubleClick}
                />
                <div className="table-pagination-bar">
                  <div className="pagination-left">
                    <span className="pagination-rows-label">Rows</span>
                    <select
                      className="pagination-rows-select"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={15}>15</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="pagination-info-text" style={{ marginLeft: '8px' }}>
                      {displayCompanies.length > 0
                        ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, displayCompanies.length)} of ${displayCompanies.length}`
                        : '0-0 of 0'}
                    </span>
                  </div>
                  
                  <div className="pagination-center">
                    [↑↓] navigate  [Space] select  [Alt+D] delete  [Esc] clear
                  </div>
                  
                  <div className="pagination-right">
                    <button
                      type="button"
                      className="pagination-arrow-btn"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </button>
                    <span className="pagination-info-text">{currentPage} / {totalPages}</span>
                    <button
                      type="button"
                      className="pagination-arrow-btn"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
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
};

export default CompanyMaster;
