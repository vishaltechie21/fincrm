import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Plus, Trash2, Search, Sliders, Database, HelpCircle } from 'lucide-react';
import * as subMasterService from '../../services/subMasterService';
import DataTable from '../../components/DataTable/DataTable';
import Notification from '../../components/Notification/Notification';
import Swal from 'sweetalert2';

const CATEGORIES = [
  { key: 'industry_type', label: 'Industry Type', desc: 'Used in Company Master Form' },
  { key: 'data_source', label: 'Enquiry/Data Source', desc: 'Used in Company & Lead Forms' },
  { key: 'stage', label: 'Sales Stage', desc: 'Used in Search & Demo Status' },
  { key: 'erp_using', label: 'ERP System', desc: 'Used in Company Master Form' },
  { key: 'state', label: 'State List', desc: 'Used in Addresses & Filters' },
  { key: 'designation', label: 'Designation', desc: 'Used in Contact Master Form' }
];

const SubMasterConfig = () => {
  const [selectedCategory, setSelectedCategory] = useState('industry_type');
  const [allItems, setAllItems] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Fetch all lookup items
  const fetchAllItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await subMasterService.getSubMasters();
      if (res.success) {
        setAllItems(res.data);
      } else {
        showNotification(res.message || 'Failed to fetch options', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error occurred while fetching options', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  // Grouped options for currently selected category
  const filteredOptions = useMemo(() => {
    return allItems.filter(item => item.master_type === selectedCategory);
  }, [allItems, selectedCategory]);

  // Live item count per category helper
  const getCategoryCount = useCallback((categoryKey) => {
    return allItems.filter(item => item.master_type === categoryKey).length;
  }, [allItems]);

  // Filtered list of categories based on category search input
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat =>
      cat.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
      cat.desc.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  // Add lookup value handler
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
        fetchAllItems();
      } else {
        showNotification(res.message || 'Failed to add option', 'error');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Network error: failed to add option';
      showNotification(msg, 'error');
    }
  };

  // Delete lookup value handler
  const handleDeleteOption = async (id, valueName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete lookup option "${valueName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c9973c',
      cancelButtonColor: '#5a6268',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await subMasterService.deleteSubMaster(id);
      if (res.success) {
        showNotification('Lookup option deleted successfully!', 'success');
        fetchAllItems();
      } else {
        showNotification(res.message || 'Failed to delete option', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error: failed to delete option', 'error');
    }
  };

  // Column config for DataTable
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
      width: 320,
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
          style={{ padding: '3px 8px', height: 'auto', minHeight: 'unset' }}
          onClick={() => handleDeleteOption(row.id, row.value_name)}
        >
          <Trash2 size={11} style={{ marginRight: '4px' }} /> Delete
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-50">
      {/* Dynamic Sub-header Panel */}
      <div className="flex items-center justify-between px-4 py-3 bg-navy-800 border-b-2 border-gold text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gold"><Settings size={16} /></span>
          <span className="text-sm font-bold tracking-wide uppercase">Sub Master Configuration</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-gold-deep text-gold border border-gold-muted">LOOKUPS</span>
        </div>
      </div>

      {/* Main Configurations Dashboard Layout */}
      <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4 overflow-hidden">
        
        {/* LEFT COLUMN: Categories Browser Sidebar */}
        <div className="w-full lg:w-80 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden shrink-0">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders size={13} className="text-slate-400" />
              Dropdown Types
            </h3>
          </div>

          {/* Search box for filtering categories */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search master categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-2xs border border-slate-200 rounded-md focus:border-gold outline-none"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => {
                const isActive = selectedCategory === cat.key;
                const count = getCategoryCount(cat.key);
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`w-full text-left p-2.5 rounded-md transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-navy-800 text-white border-l-4 border-gold'
                        : 'hover:bg-slate-100 text-slate-600 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className={`text-2xs font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                        {cat.label}
                      </span>
                      <span className={`text-3xs truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {cat.desc}
                      </span>
                    </div>
                    <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-gold text-navy-800' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-3xs italic flex flex-col items-center gap-1">
                <HelpCircle size={20} className="text-slate-300" />
                No categories match search
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active category options workspace */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* Quick Option Add Form Panel */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 shrink-0">
            <div className="border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Database size={13} className="text-slate-400" />
                Add Value: {CATEGORIES.find(c => c.key === selectedCategory)?.label}
              </h3>
            </div>

            <form onSubmit={handleAddOption} className="flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full text-left">
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Lookup Name Value
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`e.g. Enter value for ${CATEGORIES.find(c => c.key === selectedCategory)?.label}`}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:border-gold"
                  maxLength={100}
                />
              </div>
              <button
                type="submit"
                className="btn btn-success w-full md:w-auto px-5 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ height: '32px' }}
              >
                <Plus size={14} /> Add Option
              </button>
            </form>
          </div>

          {/* Current Options List (Reusable DataTable) */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
              <h3 className="text-xs font-bold text-white bg-navy-800 px-3 py-1 rounded uppercase tracking-wide">
                Current List Values
              </h3>
              <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
                Total: {filteredOptions.length} items
              </span>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <DataTable
                columns={columns}
                data={filteredOptions}
                loading={isLoading}
                storageKey={`sub_masters_${selectedCategory}`}
                idField="id"
                emptyMessage={`No values configured yet for ${CATEGORIES.find(c => c.key === selectedCategory)?.label}.`}
              />
            </div>
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
