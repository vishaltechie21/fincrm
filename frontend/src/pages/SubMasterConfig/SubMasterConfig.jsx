import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Plus, Trash2, Search, Sliders, HelpCircle, Layers, Database, Building2, Inbox } from '../../components/Icon';
import * as subMasterService from '../../services/subMasterService';
import DataTable from '../../components/DataTable/DataTable';
import Notification from '../../components/Notification/Notification';
import DashboardStepMaster from '../DashboardStepMaster/DashboardStepMaster';
import ChecklistMaster from '../ChecklistMaster/ChecklistMaster';
import FormField from '../../components/FormField';
import Swal from 'sweetalert2';

const CATEGORY_GROUPS = [
  {
    title: 'STANDARD LOOKUPS',
    items: [
      { key: 'industry_type', label: 'Industry Type', desc: 'Used in Company Master Form', icon: Building2 },
      { key: 'data_source', label: 'Enquiry / Data Source', desc: 'Used in Company & Lead Forms', icon: Inbox },
      { key: 'stage', label: 'Sales Stage', desc: 'Used in Search & Demo Status', icon: Sliders },
      { key: 'erp_using', label: 'ERP System', desc: 'Used in Company Master Form', icon: Database },
      { key: 'state', label: 'State List', desc: 'Used in Addresses & Filters', icon: Database },
      { key: 'designation', label: 'Designation', desc: 'Used in Contact Master Form', icon: Building2 }
    ]
  },
  {
    title: 'WORKFLOW & PROCESS MASTERS',
    items: [
      { key: 'dashboard_steps', label: 'Dashboard Steps Master', desc: 'Sales Closing Cycle Steps', badge: 'Steps', icon: Sliders },
      { key: 'checklist_master', label: 'Checklist Master', desc: 'Stages, Actions & Rules', badge: 'Rules', icon: Layers }
    ]
  }
];

const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.items);

const SubMasterConfig = () => {
  const [openSubTabs, setOpenSubTabs] = useState(['industry_type']);
  const [selectedCategory, setSelectedCategory] = useState('industry_type');
  const [allItems, setAllItems] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  const activeCategoryObj = useMemo(() => {
    return ALL_CATEGORIES.find(c => c.key === selectedCategory) || null;
  }, [selectedCategory]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Open category in sub-tab
  const handleOpenCategory = (catKey) => {
    if (!openSubTabs.includes(catKey)) {
      setOpenSubTabs(prev => [...prev, catKey]);
    }
    setSelectedCategory(catKey);
  };

  // Close sub-tab handler
  const handleCloseSubTab = (e, catKey) => {
    e.stopPropagation();
    const nextTabs = openSubTabs.filter(k => k !== catKey);
    setOpenSubTabs(nextTabs);
    if (selectedCategory === catKey) {
      if (nextTabs.length > 0) {
        setSelectedCategory(nextTabs[nextTabs.length - 1]);
      } else {
        setSelectedCategory(null);
      }
    }
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
    if (!selectedCategory) return [];
    return allItems.filter(item => item.master_type === selectedCategory);
  }, [allItems, selectedCategory]);

  // Live item count per category helper
  const getCategoryCount = useCallback((categoryKey) => {
    return allItems.filter(item => item.master_type === categoryKey).length;
  }, [allItems]);

  // Filtered list of category groups based on search input
  const filteredGroups = useMemo(() => {
    const term = categorySearch.toLowerCase().trim();
    if (!term) return CATEGORY_GROUPS;

    return CATEGORY_GROUPS.map(group => {
      const matchingItems = group.items.filter(cat =>
        cat.label.toLowerCase().includes(term) ||
        cat.desc.toLowerCase().includes(term)
      );
      return { ...group, items: matchingItems };
    }).filter(group => group.items.length > 0);
  }, [categorySearch]);

  // Add lookup value handler
  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !newValue.trim()) {
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
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await subMasterService.deleteSubMaster(id);
    } catch (err) {
      console.warn(`Backend submaster delete call for option ${id}:`, err);
    }

    setAllItems((prev) => prev.filter((item) => item.id !== id));

    Swal.fire({
      title: 'Deleted!',
      text: `Lookup option "${valueName}" deleted successfully.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
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
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-50 submaster-page">
      {/* Dynamic Sub-header Panel */}
      <div className="submaster-header flex items-center justify-between px-4 py-3 bg-navy-800 border-b-2 border-gold text-white shrink-0">
        <div className="submaster-header-left flex items-center gap-2">
          <span className="text-gold flex items-center"><Settings size={16} /></span>
          <span className="submaster-header-title text-sm font-bold tracking-wide uppercase">
            SUB MASTER CONFIGURATION {activeCategoryObj ? `» ${activeCategoryObj.label}` : ''}
          </span>
        </div>
        <div>
          <span className="submaster-header-badge text-2xs font-semibold px-2 py-0.5 rounded bg-gold-deep text-gold border border-gold-muted uppercase">
            {activeCategoryObj?.badge || 'LOOKUPS'}
          </span>
        </div>
      </div>

      {/* Main Configurations Dashboard Layout */}
      <div className="submaster-dashboard flex flex-col lg:flex-row flex-1 p-3 gap-3 overflow-hidden">
        
        {/* LEFT COLUMN: Categories Browser Sidebar */}
        <div className="submaster-sidebar w-full lg:w-80 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden shrink-0">
          {/* Header */}
          <div className="submaster-sidebar-header p-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5" style={{ margin: 0 }}>
              <Sliders size={13} className="text-slate-400 flex shrink-0" />
              Sub Master Categories
            </h3>
          </div>

          {/* Search box for filtering categories */}
          <div className="submaster-search-wrapper p-2.5 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 text-slate-400" size={13} style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="submaster-search-input w-full pl-7 pr-3 py-1.5 text-2xs border border-slate-200 rounded-md focus:border-gold outline-none"
                style={{ paddingLeft: '28px' }}
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="submaster-cat-list flex-1 overflow-y-auto p-1.5 space-y-3">
            {filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <div key={group.title} className="space-y-1">
                  <div className="px-2 py-1 text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </div>
                  {group.items.map(cat => {
                    const isActive = selectedCategory === cat.key;
                    const isOpen = openSubTabs.includes(cat.key);
                    const count = cat.badge ? null : getCategoryCount(cat.key);
                    const ItemIcon = cat.icon || Settings;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => handleOpenCategory(cat.key)}
                        className={`submaster-cat-btn w-full text-left p-2.5 rounded-md transition-all flex items-center justify-between group ${
                          isActive
                            ? 'active bg-navy-800 text-white border-l-4 border-gold'
                            : isOpen
                            ? 'bg-slate-100 text-navy-800 border-l-4 border-slate-400'
                            : 'hover:bg-slate-100 text-slate-600 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 max-w-[82%]">
                          <ItemIcon size={14} className={isActive ? 'text-white shrink-0' : 'text-slate-400 shrink-0'} />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className={`submaster-cat-title text-2xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                              {cat.label}
                            </span>
                            <span className={`submaster-cat-desc text-3xs truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                              {cat.desc}
                            </span>
                          </div>
                        </div>
                        {cat.badge ? (
                          <span className="submaster-cat-badge text-3xs font-bold px-2 py-0.5 rounded bg-gold text-navy-800">
                            {cat.badge}
                          </span>
                        ) : (
                          <span className={`submaster-cat-badge text-3xs font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-gold text-navy-800' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-3xs italic flex flex-col items-center gap-1">
                <HelpCircle size={20} className="text-slate-300" />
                No categories match search
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Content Area with Sub-Tabs */}
        <div className="submaster-right-panel flex-1 flex flex-col gap-2 overflow-hidden">
          
          {/* Sub-Tabs Bar */}
          <div className="submaster-tabs-bar flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0 overflow-x-auto">
            <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">OPEN TABS:</span>
            {openSubTabs.map(catKey => {
              const catObj = ALL_CATEGORIES.find(c => c.key === catKey);
              if (!catObj) return null;
              const isActive = selectedCategory === catKey;
              const ItemIcon = catObj.icon || Settings;
              return (
                <div
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`submaster-subtab-pill flex items-center gap-1.5 px-3 py-1 rounded-md text-2xs font-bold cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? 'bg-navy-800 text-white shadow-sm border border-navy-900'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <ItemIcon size={12} className={isActive ? 'text-gold' : 'text-slate-400'} />
                  <span>{catObj.label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCloseSubTab(e, catKey)}
                    className="subtab-close-btn ml-1.5 hover:text-red-400 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none text-xs"
                    title="Close sub-tab"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
            {openSubTabs.length === 0 && (
              <span className="text-2xs italic text-slate-400">Select any category from the sidebar to open its configuration sub-tab.</span>
            )}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedCategory === 'dashboard_steps' ? (
              <DashboardStepMaster isStandalone={false} />
            ) : selectedCategory === 'checklist_master' ? (
              <ChecklistMaster isStandalone={false} />
            ) : selectedCategory && activeCategoryObj ? (
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* Add New Value Form */}
                <div className="submaster-card bg-white border border-slate-200 rounded-lg shadow-sm p-4 shrink-0">
                  <div className="submaster-card-header flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h3 className="submaster-card-title text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2" style={{ margin: 0 }}>
                      <Plus size={14} className="text-gold" />
                      Add Option to {activeCategoryObj.label}
                    </h3>
                    <span className="submaster-card-badge text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Category: {selectedCategory}
                    </span>
                  </div>

                  <form onSubmit={handleAddOption} className="submaster-lookup-form flex flex-col md:flex-row items-center gap-3" style={{ margin: 0 }}>
                    <div className="flex-1 w-full">
                      <FormField
                        label="Lookup Option Value"
                        name="newValue"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={`Enter value name for ${activeCategoryObj.label}...`}
                        required={true}
                        maxLength={100}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-success px-4 py-1 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </form>
                </div>

                {/* Current Options List */}
                <div className="submaster-card flex-1 bg-white border border-slate-200 rounded-lg shadow-sm p-4 overflow-hidden flex flex-col">
                  <div className="submaster-card-header flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
                    <h3 className="submaster-card-title text-xs font-bold text-white bg-navy-800 px-3 py-1 rounded uppercase tracking-wide" style={{ margin: 0, color: '#ffffff' }}>
                      Current List Values
                    </h3>
                    <span className="submaster-card-badge text-3xs font-extrabold text-slate-400 uppercase tracking-wider">
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
                      emptyMessage={`No values configured yet for ${activeCategoryObj.label}.`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State Overview Grid */
              <div className="flex-1 bg-white border border-slate-200 rounded-lg p-6 overflow-y-auto flex flex-col items-center justify-center text-center">
                <Sliders size={36} className="text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Sub Master Categories Overview</h3>
                <p className="text-2xs text-slate-500 max-w-md mb-6">Select any master category from the sidebar or click a category card below to open its configuration sub-tab.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl text-left">
                  {ALL_CATEGORIES.map(cat => {
                    const ItemIcon = cat.icon || Settings;
                    const count = cat.badge ? cat.badge : `${getCategoryCount(cat.key)} items`;
                    return (
                      <div
                        key={cat.key}
                        onClick={() => handleOpenCategory(cat.key)}
                        className="p-3 border border-slate-200 rounded-lg hover:border-gold hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <span className="p-2 rounded bg-navy-800 text-gold shrink-0"><ItemIcon size={14} /></span>
                          <div>
                            <h4 className="text-2xs font-bold text-slate-800 m-0">{cat.label}</h4>
                            <p className="text-3xs text-slate-500 m-0 mt-0.5">{cat.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-3xs font-extrabold text-gold-deep uppercase">{count}</span>
                          <span className="text-3xs font-bold text-navy-800 hover:underline">Open &rarr;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
