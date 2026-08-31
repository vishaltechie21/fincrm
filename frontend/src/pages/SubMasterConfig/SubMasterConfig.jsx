import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import * as subMasterService from '../../services/subMasterService';
import DataTable from '../../components/DataTable/DataTable';
import Notification from '../../components/Notification/Notification';
import Swal from 'sweetalert2';

const CATEGORIES = [
  { key: 'industry_type', label: 'Industry Type' },
  { key: 'data_source', label: 'Enquiry/Data Source' },
  { key: 'stage', label: 'Sales Stage' }
];

const SubMasterConfig = () => {
  const [selectedCategory, setSelectedCategory] = useState('industry_type');
  const [options, setOptions] = useState([]);
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Fetch options for the selected category
  const fetchOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await subMasterService.getSubMasters(selectedCategory);
      if (res.success) {
        setOptions(res.data);
      } else {
        showNotification(res.message || 'Failed to fetch options', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error occurred while fetching options', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Add new option handler
  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newValue.trim()) {
      showNotification('Please enter a value name', 'warning');
      return;
    }

    try {
      const res = await subMasterService.createSubMaster(selectedCategory, newValue.trim());
      if (res.success) {
        showNotification('Lookup option added successfully!', 'success');
        setNewValue('');
        fetchOptions();
      } else {
        showNotification(res.message || 'Failed to add option', 'error');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Network error: failed to add option';
      showNotification(msg, 'error');
    }
  };

  // Delete option handler
  const handleDeleteOption = async (id, valueName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete lookup option "${valueName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c9973c', // Theme Gold
      cancelButtonColor: '#5a6268',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await subMasterService.deleteSubMaster(id);
      if (res.success) {
        showNotification('Lookup option deleted successfully!', 'success');
        fetchOptions();
      } else {
        showNotification(res.message || 'Failed to delete option', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error: failed to delete option', 'error');
    }
  };

  // Define columns for our reusable DataTable
  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: 80,
      sortable: false
    },
    {
      key: 'value_name',
      label: 'Option Value',
      width: 300,
      sortable: true
    },
    {
      key: 'actions',
      label: 'Action',
      width: 100,
      sortable: false,
      render: (row) => (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          style={{ padding: '2px 8px', height: 'auto', minHeight: 'unset' }}
          onClick={() => handleDeleteOption(row.id, row.value_name)}
        >
          <Trash2 size={12} style={{ marginRight: '4px' }} /> Delete
        </button>
      )
    }
  ];

  return (
    <div className="master-page">
      {/* Sub-header navigation row matching CompanyMaster/ContactMaster */}
      <div className="master-sub-header">
        <div className="sub-header-center">
          <span className="sub-title-icon"><Settings size={16} /></span>
          <span className="sub-title-text">Sub Master Configuration</span>
        </div>
      </div>

      <div className="master-layout-content" style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px', overflow: 'hidden' }}>
        {/* Left Side: Category selector & Add Value Form */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div className="panel-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: 'var(--text-h)' }}>Category Details</h3>
          </div>

          <div className="form-field">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase' }}>Select Category</label>
            <div className="field-control-container">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleAddOption} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div className="form-field">
              <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', textTransform: 'uppercase' }}>New Lookup Value</label>
              <div className="field-control-container">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`Enter new option for ${CATEGORIES.find(c => c.key === selectedCategory)?.label}`}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', fontSize: '11px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-success"
              style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add Option
            </button>
          </form>
        </div>

        {/* Right Side: Options List Table */}
        <div className="col-8 lower-table-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: 'var(--text-h)' }}>
              Current Options: {CATEGORIES.find(c => c.key === selectedCategory)?.label}
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>
              Total: {options.length} item(s)
            </span>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DataTable
              columns={columns}
              data={options}
              loading={isLoading}
              storageKey="sub_masters_table"
              idField="id"
              emptyMessage={`No options configured for ${CATEGORIES.find(c => c.key === selectedCategory)?.label}.`}
            />
          </div>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default SubMasterConfig;
