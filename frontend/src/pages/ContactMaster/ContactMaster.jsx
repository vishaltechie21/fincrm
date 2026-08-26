/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import ContactForm from '../../components/ContactForm/ContactForm';
import ContactTable from '../../components/ContactTable/ContactTable';
import Notification from '../../components/Notification/Notification';
import Loading from '../../components/Loading/Loading';
import { useContactForm } from '../../hooks/useContactForm';
import * as contactService from '../../services/contactService';
import * as companyService from '../../services/companyService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import ImportModal from '../../components/ImportModal/ImportModal';
import './ContactMaster.css';

const ContactMaster = () => {
  const [contacts, setContacts] = useState([]);
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

  // Edit states
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
  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await contactService.getContacts('');
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
    fetchContacts();
    fetchCompaniesList();
  }, [fetchContacts, fetchCompaniesList]);

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
    fetchContacts();
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
        fetchContacts();
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
        fetchContacts();
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
    showNotification(`Loaded contact ${contact.mascon_id} into form`, 'info');
  };

  // Excel template data and import row handler
  const IMPORT_TEMPLATE_HEADERS = ['Company ID', 'Contact Name', 'Designation', 'Mobile', 'Email', 'Key Person', 'Sales User', 'Remarks'];
  
  const IMPORT_SAMPLE_DATA = [{
    'Company ID': '123-00001',
    'Contact Name': 'John Doe',
    'Designation': 'Manager',
    'Mobile': '9876543210',
    'Email': 'john.doe@example.com',
    'Key Person': 'Y',
    'Sales User': 'sales_agent',
    'Remarks': 'Follow up next week'
  }];

  const handleSaveImportedRow = async (row) => {
    const payload = {
      mascom_id: row['Company ID'] || '',
      contact_name: row['Contact Name'] || '',
      designation: row['Designation'] || '',
      mobile: row['Mobile'] || '',
      email: row['Email'] || '',
      key_person: row['Key Person'] || 'N',
      user_name: row['Sales User'] || '',
      mascon_remarks: row['Remarks'] || ''
    };
    return await contactService.createContact(payload);
  };

  const handleImportComplete = (count) => {
    showNotification(`Successfully imported ${count} contacts!`, 'success');
    fetchContacts();
    setIsImportOpen(false);
  };

  const displayContacts = contacts;
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
        <div className="sub-header-center">
          <span className="sub-title-icon"><User size={16} /></span>
          <span className="sub-title-text">Contact Master Entry</span>
        </div>

        <div className="sub-header-right">
          <span className="view-pill-badge">VIEW</span>
        </div>
      </div>

      <div className="master-body-container">
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
                      {displayContacts.length > 0
                        ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, displayContacts.length)} of ${displayContacts.length}`
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
        message={`Are you sure you want to delete contact ${deleteConfirm.id}?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Contacts"
        templateHeaders={IMPORT_TEMPLATE_HEADERS}
        sampleData={IMPORT_SAMPLE_DATA}
        onSaveRow={handleSaveImportedRow}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

export default ContactMaster;
