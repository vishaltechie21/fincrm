import React, { useState, useEffect, useCallback } from 'react';
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

  const predictNextId = () => {
    const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);
    const prefixPattern = `${timestampPrefix}-`;
    const samePrefixContacts = contacts.filter((c) => c.mascon_id && c.mascon_id.startsWith(prefixPattern));
    
    let nextSeq = 1;
    if (samePrefixContacts.length > 0) {
      const sequences = samePrefixContacts
        .map((c) => {
          const parts = c.mascon_id.split('-');
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
        showNotification(
          `Contact ${formData.mascon_id} ${editState === 'adding' ? 'saved' : 'updated'} successfully!`,
          'success'
        );
        setEditState('idle');
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

  // Prev / Next record navigation controls in sub-header
  const handlePrevRecord = () => {
    if (contacts.length === 0 || editState !== 'idle') return;
    const currentIndex = contacts.findIndex((c) => c.mascon_id === formData.mascon_id);
    if (currentIndex > 0) {
      handleRowClick(contacts[currentIndex - 1]);
    }
  };

  const handleNextRecord = () => {
    if (contacts.length === 0 || editState !== 'idle') return;
    const currentIndex = contacts.findIndex((c) => c.mascon_id === formData.mascon_id);
    if (currentIndex >= 0 && currentIndex < contacts.length - 1) {
      handleRowClick(contacts[currentIndex + 1]);
    }
  };

  const getRecordIndexText = () => {
    if (!formData.mascon_id || contacts.length === 0) return '0 / 0';
    const index = contacts.findIndex((c) => c.mascon_id === formData.mascon_id);
    return index >= 0 ? `${index + 1} / ${contacts.length}` : `0 / ${contacts.length}`;
  };

  // Pagination bounds
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(contacts.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContacts = contacts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [contacts.length, totalPages, currentPage]);

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
            onClick={handlePrevRecord}
            disabled={contacts.length === 0 || editState !== 'idle'}
          >
            &lt;
          </button>
          <span className="index-counter-text">{getRecordIndexText()}</span>
          <button
            type="button"
            className="nav-arrow-btn"
            onClick={handleNextRecord}
            disabled={contacts.length === 0 || editState !== 'idle'}
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
                  {contacts.length > 0 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, contacts.length)} of {contacts.length} entries
                      </div>
                      <div className="pagination-buttons">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          ◀ Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            className={`pagination-btn page-num-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next ▶
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="search-layout-panel">
            <div className="search-header-row">
              <h3>Search and Double-Click to Edit</h3>
              <SearchBar onSearch={handleSearch} value={searchQuery} />
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
                {contacts.length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, contacts.length)} of {contacts.length} entries
                    </div>
                    <div className="pagination-buttons">
                      <button
                        type="button"
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        ◀ Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={`pagination-btn page-num-btn ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
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
