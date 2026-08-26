import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import ContactForm from '../../components/ContactForm/ContactForm';
import ContactTable from '../../components/ContactTable/ContactTable';
import SearchBar from '../../components/SearchBar/SearchBar';
import Notification from '../../components/Notification/Notification';
import Loading from '../../components/Loading/Loading';
import { useContactForm } from '../../hooks/useContactForm';
import * as contactService from '../../services/contactService';
import * as companyService from '../../services/companyService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './ContactMaster.css';

const ContactMaster = () => {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  // Tab and Edit states
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' or 'search'
  const [editState, setEditState] = useState('idle'); // 'idle', 'adding', 'modifying'
  const [revertData, setRevertData] = useState(null);

  // Filter states
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterKeyPerson, setFilterKeyPerson] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ company: '', designation: '', keyPerson: '' });
  const [showFilters, setShowFilters] = useState(false);

  const {
    formData,
    errors,
    handleChange,
    handleSelectChange,
    resetForm,
    loadContact,
    validate,
    setErrors,
    setFormData
  } = useContactForm();

  // Fetch contacts from backend
  const fetchContacts = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const res = await contactService.getContacts(search);
      if (res.success) {
        setContacts(res.data);
      } else {
        showNotification(res.message || 'Failed to fetch contacts', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error occurred while fetching contacts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch companies list for dropdown selector mapping
  const fetchCompaniesList = useCallback(async () => {
    try {
      const res = await companyService.getCompanies();
      if (res.success) {
        setCompanies(res.data);
      }
    } catch (err) {
      console.error('Failed to load companies for selector dropdown', err);
    }
  }, []);

  useEffect(() => {
    fetchContacts(searchQuery);
    fetchCompaniesList();
  }, [searchQuery, fetchContacts, fetchCompaniesList]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Apply filters button handler
  const handleApplyFilters = () => {
    setAppliedFilters({ company: filterCompany, designation: filterDesignation, keyPerson: filterKeyPerson });
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterCompany('');
    setFilterDesignation('');
    setFilterKeyPerson('');
    setAppliedFilters({ company: '', designation: '', keyPerson: '' });
    setCurrentPage(1);
  };

  // Derive unique options dynamically
  const companyOptions = [...new Set(contacts.map((c) => c.company_name || c.mascom_id).filter(Boolean))].sort();
  const designationOptions = [...new Set(contacts.map((c) => c.designation).filter(Boolean))].sort();

  // Apply filters on top of search-fetched contacts
  const filteredContacts = contacts.filter((c) => {
    const matchCompany = !appliedFilters.company || (c.company_name || c.mascom_id || '').toLowerCase() === appliedFilters.company.toLowerCase();
    const matchDesignation = !appliedFilters.designation || (c.designation || '').toLowerCase() === appliedFilters.designation.toLowerCase();
    const matchKeyPerson = !appliedFilters.keyPerson || (c.key_person || '') === appliedFilters.keyPerson;
    return matchCompany && matchDesignation && matchKeyPerson;
  });

  // Excel export
  const handleExportExcel = () => {
    const exportData = filteredContacts.map((c) => ({
      'Contact ID': c.mascon_id,
      'Company Name': c.company_name || c.mascom_id,
      'Contact Name': c.contact_name,
      'Designation': c.designation,
      'Mobile': c.mobile,
      'Email': c.email,
      'Key Person': c.key_person,
      'Sales User': c.user_name,
      'Remarks': c.mascon_remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    ws['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 16 },
      { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 30 }
    ];
    XLSX.writeFile(wb, `ContactMaster_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification(`Exported ${exportData.length} records to Excel`, 'success');
  };

  const predictNextId = () => {
    const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);
    
    let nextSeq = 1;
    if (contacts.length > 0) {
      const sequences = contacts
        .map((c) => {
          const parts = c.mascon_id ? c.mascon_id.split('-') : [];
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

  // Button toolbar event handlers
  const handleRefresh = () => {
    resetForm();
    setErrors({});
    setEditState('idle');
    fetchContacts(searchQuery);
    fetchCompaniesList();
    showNotification('Form refreshed', 'info');
  };

  const handleNew = () => {
    resetForm();
    setErrors({});
    const nextId = predictNextId();
    setFormData((prev) => ({ ...prev, mascon_id: nextId }));
    setEditState('adding');
    showNotification('Creating new contact. Form inputs unlocked.', 'info');
  };

  const handleModifyMode = () => {
    if (!formData.mascon_id) {
      showNotification('Please select a contact to modify first', 'warning');
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
        res = await contactService.createContact(formData);
      } else {
        res = await contactService.updateContact(formData.mascon_id, formData);
      }

      if (res.success) {
        const savedContact = res.data;
        showNotification(
          `Contact ${savedContact.mascon_id} ${editState === 'adding' ? 'saved' : 'updated'} successfully!`,
          'success'
        );
        loadContact(savedContact);
        setEditState('idle');
        if (editState === 'adding') {
          setCurrentPage(1);
        }
        fetchContacts(searchQuery);
      } else {
        showNotification(res.message || 'Failed to save contact', 'error');
        if (res.errors) setErrors(res.errors);
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Network error: failed to save contact';
      showNotification(apiMsg, 'error');
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    }
  };

  const handleDelete = (idToDelete) => {
    const targetId = idToDelete || formData.mascon_id;
    if (!targetId) {
      showNotification('No contact selected to delete', 'warning');
      return;
    }
    setDeleteConfirm({ isOpen: true, id: targetId });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null });
    try {
      const res = await contactService.deleteContact(id);
      if (res.success) {
        showNotification(`Contact ${id} deleted successfully!`, 'success');
        if (id === formData.mascon_id) {
          resetForm();
        }
        setEditState('idle');
        fetchContacts(searchQuery);
      } else {
        showNotification(res.message || 'Failed to delete contact', 'error');
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Network error: failed to delete contact';
      showNotification(apiMsg, 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleRowClick = (contact) => {
    if (editState !== 'idle') {
      showNotification('Please save or cancel your current edit first.', 'warning');
      return;
    }
    loadContact(contact);
    setErrors({});
  };

  const handleRowDoubleClick = (contact) => {
    loadContact(contact);
    setErrors({});
    setActiveTab('entry');
    showNotification(`Loaded contact ${contact.mascon_id} into form`, 'info');
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
  const hasActiveFilters = appliedFilters.company || appliedFilters.designation || appliedFilters.keyPerson;

  // Pagination bounds
  const itemsPerPage = 8;
  const displayContacts = activeTab === 'search' ? filteredContacts : contacts;
  const totalPages = Math.max(1, Math.ceil(displayContacts.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = displayContacts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [displayContacts.length, totalPages, currentPage]);

  return (
    <div className="contact-master-page">
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
            🔍 Search
          </button>
        </div>

        <div className="sub-header-center">
          <span className="sub-title-icon">👤</span>
          <span className="sub-title-text">Contact Master</span>
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
              <ContactForm
                formData={formData}
                errors={errors}
                companies={companies}
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
                <h3>Registered Contacts List</h3>
              </div>
              {isLoading ? (
                <Loading type="skeleton" />
              ) : (
                <>
                  <ContactTable
                    contacts={currentContacts}
                    onEdit={handleRowClick}
                    onDelete={handleDelete}
                    activeId={formData.mascon_id}
                    onRowDoubleClick={handleRowDoubleClick}
                  />
                  {hasActiveFilters && displayContacts.length > 0 && (
                    <div className="filter-count-info">Showing {displayContacts.length} of {contacts.length} records</div>
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
                  {filteredContacts.length > 0 && (
                    <span className="export-count-badge">{filteredContacts.length}</span>
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
                    <label className="filter-label">COMPANY NAME</label>
                    <select className="filter-select" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                      <option value="">All Companies</option>
                      {companyOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label className="filter-label">DESIGNATION</label>
                    <select className="filter-select" value={filterDesignation} onChange={(e) => setFilterDesignation(e.target.value)}>
                      <option value="">All Designations</option>
                      {designationOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label className="filter-label">KEY PERSON</label>
                    <select className="filter-select" value={filterKeyPerson} onChange={(e) => setFilterKeyPerson(e.target.value)}>
                      <option value="">All</option>
                      <option value="Y">Yes (Y)</option>
                      <option value="N">No (N)</option>
                    </select>
                  </div>
                </div>
                <div className="filter-action-btns">
                  <button type="button" className="filter-apply-btn" onClick={handleApplyFilters}>▼ Apply</button>
                  <button type="button" className="filter-clear-btn" onClick={handleClearFilters} disabled={!filterCompany && !filterDesignation && !filterKeyPerson && !hasActiveFilters}>✕ Clear</button>
                </div>
              </div>
            )}

            {isLoading ? (
              <Loading type="skeleton" />
            ) : (
              <>
                <ContactTable
                  contacts={currentContacts}
                  onEdit={handleRowClick}
                  onDelete={handleDelete}
                  activeId={formData.mascon_id}
                  onRowDoubleClick={handleRowDoubleClick}
                />
                {hasActiveFilters && filteredContacts.length > 0 && (
                  <div className="filter-count-info">Showing {filteredContacts.length} of {contacts.length} records (filtered)</div>
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
        message={`Are you sure you want to delete contact ${deleteConfirm.id}?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default ContactMaster;
