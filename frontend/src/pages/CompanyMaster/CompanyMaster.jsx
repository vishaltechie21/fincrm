import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import CompanyForm from '../../components/CompanyForm/CompanyForm';
import CompanyTable from '../../components/CompanyTable/CompanyTable';
import SearchBar from '../../components/SearchBar/SearchBar';
import Notification from '../../components/Notification/Notification';
import Loading from '../../components/Loading/Loading';
import { useCompanyForm } from '../../hooks/useCompanyForm';
import * as companyService from '../../services/companyService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './CompanyMaster.css';

const INDUSTRY_OPTIONS = [
  'Nutraceuticals', 'Chemical Manufacturing', 'Pharma Marketing', 'Medical Devices',
  'IT Services', 'Retail', 'FMCG', 'Automobile', 'Textile', 'Education',
  'Finance', 'Real Estate', 'Healthcare', 'Logistics', 'Other',
];

const ENQUIRY_SOURCE_OPTIONS = [
  'Existing Client', 'Cold Call', 'WhatsApp', 'Bulk Mail', 'Reference',
  'Website', 'Social Media', 'Exhibition', 'Advertisement', 'Other',
];

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  // Tab and Edit mode states
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' or 'search'
  const [editState, setEditState] = useState('idle'); // 'idle', 'adding', 'modifying'
  const [revertData, setRevertData] = useState(null);

  // Filter state
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ industry: '', state: '', source: '' });
  const [showFilters, setShowFilters] = useState(false);

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
  const fetchCompanies = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const res = await companyService.getCompanies(search);
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
    fetchCompanies(searchQuery);
  }, [searchQuery, fetchCompanies]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Apply filters button handler
  const handleApplyFilters = () => {
    setAppliedFilters({ industry: filterIndustry, state: filterState, source: filterSource });
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterIndustry('');
    setFilterState('');
    setFilterSource('');
    setAppliedFilters({ industry: '', state: '', source: '' });
    setCurrentPage(1);
  };

  // Derive unique state list from loaded companies
  const stateOptions = [...new Set(companies.map((c) => c.state).filter(Boolean))].sort();

  // Apply client-side filter on top of search-fetched companies
  const filteredCompanies = companies.filter((c) => {
    const matchIndustry = !appliedFilters.industry || (c.industry_type || '').toLowerCase() === appliedFilters.industry.toLowerCase();
    const matchState = !appliedFilters.state || (c.state || '').toLowerCase() === appliedFilters.state.toLowerCase();
    const matchSource = !appliedFilters.source || (c.data_source || '').toLowerCase() === appliedFilters.source.toLowerCase();
    return matchIndustry && matchState && matchSource;
  });

  // Excel export
  const handleExportExcel = () => {
    const exportData = filteredCompanies.map((c) => ({
      'Company ID': c.mascom_id,
      'Company Name': c.company_name,
      'Industry Type': c.industry_type,
      'City': c.city,
      'State': c.state,
      'Enquiry/Data Source': c.data_source,
      'ERP Used': c.erp_used,
      'User Name': c.user_name,
      'Remarks': c.mascom_remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    ws['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
      { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
    ];
    XLSX.writeFile(wb, `CompanyMaster_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification(`Exported ${exportData.length} records to Excel`, 'success');
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
    fetchCompanies(searchQuery);
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
        showNotification(
          `Company ${formData.mascom_id} ${editState === 'adding' ? 'saved' : 'updated'} successfully!`,
          'success'
        );
        setEditState('idle');
        fetchCompanies(searchQuery);
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
        fetchCompanies(searchQuery);
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
    setActiveTab('entry');
    showNotification(`Loaded company ${company.mascom_id} into form`, 'info');
  };

  // Sub-header < > now controls PAGE navigation
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getPageText = () => `${currentPage} / ${totalPages}`;

  // Check if any filter is active
  const hasActiveFilters = appliedFilters.industry || appliedFilters.state || appliedFilters.source;

  // Pagination — uses filteredCompanies for search tab, companies for entry tab
  const itemsPerPage = 8;
  const displayCompanies = activeTab === 'search' ? filteredCompanies : companies;
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
        <div className="sub-header-left">
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
            📄 Entry
          </button>
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
            🔍 Search
          </button>
        </div>

        <div className="sub-header-center">
          <span className="sub-title-icon">🏢</span>
          <span className="sub-title-text">Company Master</span>
        </div>

        <div className="sub-header-right">
          <span className="view-pill-badge">VIEW</span>
          <button
            type="button"
            className="nav-arrow-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          <span className="index-counter-text">{getPageText()}</span>
          <button
            type="button"
            className="nav-arrow-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="master-body-container">
        {activeTab === 'entry' ? (
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
                  {hasActiveFilters && displayCompanies.length > 0 && (
                    <div className="filter-count-info">Showing {displayCompanies.length} of {companies.length} records</div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="search-layout-panel">
            {/* Single inline toolbar: search + export + filter toggle */}
            <div className="search-toolbar-row">
              <SearchBar onSearch={handleSearch} value={searchQuery} />
              <div className="search-toolbar-actions">
                <button
                  type="button"
                  className="export-excel-btn"
                  onClick={handleExportExcel}
                  title="Export to Excel"
                >
                  ⬇ Export Excel
                  {filteredCompanies.length > 0 && (
                    <span className="export-count-badge">{filteredCompanies.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`filter-toggle-btn ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-active' : ''}`}
                  onClick={() => setShowFilters((prev) => !prev)}
                  title="Toggle Filters"
                >
                  {hasActiveFilters && <span className="filter-dot-indicator" />}
                  ▼ Filter
                </button>
              </div>
            </div>

            {/* Collapsible filter bar — shown only when showFilters is true */}
            {showFilters && (
              <div className="filter-bar-row">
                <div className="filter-fields-group">
                  <div className="filter-field">
                    <label className="filter-label">INDUSTRY TYPE</label>
                    <select className="filter-select" value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}>
                      <option value="">All Industries</option>
                      {INDUSTRY_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label className="filter-label">STATE</label>
                    <select className="filter-select" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                      <option value="">All States</option>
                      {stateOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label className="filter-label">DATA SOURCE</label>
                    <select className="filter-select" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                      <option value="">All Sources</option>
                      {ENQUIRY_SOURCE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                </div>
                <div className="filter-action-btns">
                  <button type="button" className="filter-apply-btn" onClick={handleApplyFilters}>▼ Apply</button>
                  <button type="button" className="filter-clear-btn" onClick={handleClearFilters} disabled={!filterIndustry && !filterState && !filterSource && !hasActiveFilters}>✕ Clear</button>
                </div>
              </div>
            )}

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
                {hasActiveFilters && filteredCompanies.length > 0 && (
                  <div className="filter-count-info">Showing {filteredCompanies.length} of {companies.length} records (filtered)</div>
                )}
              </>
            )}
          </div>
        )}
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
    </div>
  );
};

export default CompanyMaster;
