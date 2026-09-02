import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { User, Building2 } from 'lucide-react';
import ContactForm from '../../components/ContactForm/ContactForm';
import ContactTable from '../../components/ContactTable/ContactTable';
import Notification from '../../components/Notification/Notification';
import Loading from '../../components/Loading/Loading';
import { useContactForm } from '../../hooks/useContactForm';
import * as contactService from '../../services/contactService';
import * as companyService from '../../services/companyService';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import ImportModal from '../../components/ImportModal/ImportModal';
import Swal from 'sweetalert2';
import { validateContact } from '../../utils/validation';
import { MASCON_SEED } from '../../utils/activityData';


const ContactMaster = forwardRef(({ onEditStateChange }, ref) => {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const hasAutoLoadedRef = useRef(false);

  // Infinite Scroll & Sorting state
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState('mascon_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

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
      let dbContacts = [];
      if (res && res.success) {
        dbContacts = res.data;
      }
      const mergedContacts = [...MASCON_SEED];
      dbContacts.forEach((dbCont) => {
        if (!mergedContacts.some(c => c.mascon_id === dbCont.mascon_id)) {
          mergedContacts.push(dbCont);
        }
      });
      setContacts(mergedContacts);
      setVisibleCount(50);
    } catch (err) {
      console.error(err);
      setContacts([...MASCON_SEED]);
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

  const handleReturnNavigation = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    const expandId = params.get('expandId');
    if (returnTo) {
      const targetUrl = expandId ? `${returnTo}?expandId=${expandId}` : returnTo;
      window.history.pushState({}, '', targetUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchCompaniesList();
  }, [fetchContacts, fetchCompaniesList]);

  // Auto-load contact in modifying or adding mode if params in URL
  useEffect(() => {
    if (hasAutoLoadedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('editId');
    const companyId = params.get('companyId');
    const mode = params.get('mode');

    if (editId) {
      if (contacts.length > 0) {
        const cont = contacts.find(c => c.mascon_id === editId);
        if (cont) {
          hasAutoLoadedRef.current = true;
          loadContact(cont);
          setEditState('modifying');
        }
      }
    } else if (companyId) {
      if (mode === 'add') {
        hasAutoLoadedRef.current = true;
        const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);
        let nextSeq = 1;
        if (contacts.length > 0) {
          const seqs = contacts.map(c => c.mascon_id ? parseInt(c.mascon_id.split('-')[1], 10) : 0).filter(n => !isNaN(n));
          if (seqs.length > 0) nextSeq = Math.max(...seqs) + 1;
        }
        const newId = `${timestampPrefix}-${String(nextSeq).padStart(5, '0')}`;
        resetForm();
        setFormData(prev => ({
          ...prev,
          mascon_id: newId,
          mascom_id: companyId
        }));
        setEditState('adding');
      } else if (contacts.length > 0) {
        const compCont = contacts.find(c => c.mascom_id === companyId);
        if (compCont) {
          hasAutoLoadedRef.current = true;
          loadContact(compCont);
          setEditState('modifying');
        }
      }
    }
  }, [contacts, loadContact, resetForm, setFormData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortField('mascon_id');
      setSortAsc(true);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
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

  // Actions row toolbar handlers
  const handleRefresh = () => {
    resetForm();
    setErrors({});
    setEditState('idle');
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
    if (onEditStateChange) onEditStateChange(false);
    showNotification('Edit cancelled. Form inputs locked.', 'info');
    setTimeout(() => handleReturnNavigation(), 50);
  };

  const handleSave = async () => {
    if (!validate()) {
      const validationErrors = validateContact(formData);
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
        res = await contactService.createContact(formData);
      } else {
        res = await contactService.updateContact(formData.mascon_id, formData);
      }

      if (res.success) {
        const savedContact = res.data;
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Contact ${savedContact.mascon_id} ${isAdding ? 'saved' : 'updated'} successfully!`,
          confirmButtonColor: 'var(--accent)',
          background: 'var(--panel)',
          color: 'var(--text-h)'
        });
        loadContact(savedContact);
        setEditState('idle');
        if (onEditStateChange) onEditStateChange(false);
        fetchContacts();
        setTimeout(() => handleReturnNavigation(), 50);
        return true;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || 'Failed to save contact',
          confirmButtonColor: 'var(--accent)',
          background: 'var(--panel)',
          color: 'var(--text-h)'
        });
        if (res.errors) setErrors(res.errors);
        return false;
      }
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Network error: failed to save contact';
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
    const targetId = idToDelete || formData.mascon_id;
    if (!targetId) {
      Swal.fire({
        title: 'No Contact Selected',
        text: 'Please select a contact to delete.',
        icon: 'warning',
        confirmButtonColor: '#1e293b'
      });
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete contact ${targetId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await contactService.deleteContact(targetId);
        } catch (err) {
          console.warn(`Backend delete call for contact ${targetId}:`, err);
        }

        // Always remove from contacts state so seed & DB records disappear immediately
        setContacts((prev) => prev.filter((c) => c.mascon_id !== targetId));

        if (formData.mascon_id === targetId) {
          resetForm();
        }
        setEditState('idle');

        Swal.fire({
          title: 'Deleted!',
          text: `Contact ${targetId} deleted successfully.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
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
      key_person: row['Key Person'] || '',
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

  const sortedContacts = [...contacts].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    
    if (sortField === 'company_name') {
      valA = a.company_name || a.mascom_id || '';
      valB = b.company_name || b.mascom_id || '';
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const visibleContacts = sortedContacts.slice(0, visibleCount);
  const matchedComp = companies.find(c => c.mascom_id === formData.mascom_id);
  const targetCompanyName = matchedComp ? matchedComp.company_name : formData.mascom_id;

  return (
    <div className="master-page">
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
            {formData.mascom_id && (
              <div 
                className="company-editing-banner" 
                style={{
                  background: editState === 'adding' ? '#e1f5ee' : '#fff7e8',
                  border: `1px solid ${editState === 'adding' ? '#0f6e56' : '#c9973c'}`,
                  color: editState === 'adding' ? '#0f6e56' : '#8a6512',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}
              >
                <Building2 size={16} />
                <span>
                  {editState === 'adding' ? (
                    <>Adding new contact under company: <strong>{targetCompanyName}</strong> ({formData.mascom_id})</>
                  ) : (
                    <>Editing contact for company: <strong>{targetCompanyName}</strong> ({formData.mascom_id}){formData.contact_name ? <> · Contact: <strong>{formData.contact_name}</strong> ({formData.mascon_id})</> : null}</>
                  )}
                </span>
              </div>
            )}
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
                  contacts={visibleContacts}
                  onEdit={handleRowClick}
                  onDelete={handleDelete}
                  activeId={formData.mascon_id}
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
});

export default ContactMaster;
