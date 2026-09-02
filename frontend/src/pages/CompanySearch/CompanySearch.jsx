/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Loading from '../../components/Loading/Loading';
import FilterModal from '../../components/FilterModal/FilterModal';
import HighlightText from '../../components/HighlightText';
import SmoothDetailRow from '../../components/DataTable/SmoothDetailRow';
import * as settingsService from '../../services/settingsService';
import Swal from 'sweetalert2';
import * as companyService from '../../services/companyService';
import * as contactService from '../../services/contactService';
import { MASCOM_SEED, MASCON_SEED, TRACOM_SEED } from '../../utils/activityData';
import { filterDataset } from '../../utils/filterUtils';
import ActivityModal from '../../components/Modals/ActivityModal';
import DashboardModal from '../../components/Modals/DashboardModal';
import ChecklistModal from '../../components/Modals/ChecklistModal';
import ContactInfoModal from '../../components/Modals/ContactInfoModal';
import { SEARCH_COLUMNS, DEFAULT_VISIBLE_KEYS } from '../../utils/searchColumns';


const COLUMN_LABEL_MAP = {};
SEARCH_COLUMNS.forEach((c) => {
  COLUMN_LABEL_MAP[c.k] = c.lab;
});

const STAGE_CLASS = { "Lead": "lead", "Demo Done": "demo", "Quoted": "quoted", "Negotiation": "nego", "Won": "won", "Lost": "lost" };

const CompanySearch = () => {
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModeColumn, setSearchModeColumn] = useState(null); // null = General, 'field_name' = Generic

  // Layout & Persistent Settings State
  const [isFixedHeader, setIsFixedHeader] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_KEYS);
  const [activeFilters, setActiveFilters] = useState([]);
  const [hasSavedSettings, setHasSavedSettings] = useState(false);
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('company_search_column_widths');
    return saved ? JSON.parse(saved) : {};
  });

  // Selection Checkbox State (Set of mascom_id keys)
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Accordion expanded row IDs (Set of mascom_id keys)
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

  // Infinite Scroll & Sorting
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState('mascom_id');
  const [sortAsc, setSortAsc] = useState(true);

  // Active Modal States
  const [activeActivityCompany, setActiveActivityCompany] = useState(null);
  const [activeDashboardCompany, setActiveDashboardCompany] = useState(null);
  const [activeChecklistCompany, setActiveChecklistCompany] = useState(null);
  const [activeContactInfoCompany, setActiveContactInfoCompany] = useState(null);

  // Auto-expand row if expandId is passed in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expandId = params.get('expandId');
    if (expandId) {
      setExpandedRowIds(new Set([expandId]));
      setTimeout(() => {
        const el = document.querySelector(`[data-code="${expandId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  }, []);
  const [selectedFirst, setSelectedFirst] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, contRes] = await Promise.all([
        companyService.getCompanies(''),
        contactService.getContacts('')
      ]);

      let dbCompanies = [];
      if (compRes && compRes.success) {
        dbCompanies = compRes.data;
      }
      
      let dbContacts = [];
      if (Array.isArray(contRes)) {
        dbContacts = contRes;
      } else if (contRes && Array.isArray(contRes.data)) {
        dbContacts = contRes.data;
      }

      const mergedCompanies = [...dbCompanies];
      MASCOM_SEED.forEach((seedComp) => {
        if (!mergedCompanies.some(c => c.mascom_id === seedComp.mascom_id)) {
          mergedCompanies.push(seedComp);
        }
      });

      const mergedContacts = [...dbContacts];
      MASCON_SEED.forEach((seedCont) => {
        if (!mergedContacts.some(c => c.mascon_id === seedCont.mascon_id)) {
          mergedContacts.push(seedCont);
        }
      });

      setCompanies(mergedCompanies);
      setContacts(mergedContacts);
      setVisibleCount(50);
    } catch (err) {
      console.error('CompanySearch loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Load saved settings on mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const res = await settingsService.getSettings('company_search');
        if (res && res.success && res.data) {
          const saved = res.data;
          setIsFixedHeader(saved.isFixedHeader !== undefined ? saved.isFixedHeader : false);
          if (saved.visibleColumns !== undefined) setVisibleColumns(saved.visibleColumns);
          if (saved.activeFilters !== undefined) setActiveFilters(Array.isArray(saved.activeFilters) ? saved.activeFilters : []);
          if (saved.sortField !== undefined) setSortField(saved.sortField);
          if (saved.sortAsc !== undefined) setSortAsc(saved.sortAsc);
          if (saved.selectedRowIds !== undefined) setSelectedRowIds(new Set(saved.selectedRowIds));
          if (saved.searchQuery !== undefined) setSearchQuery(saved.searchQuery);
          if (saved.searchModeColumn !== undefined) setSearchModeColumn(saved.searchModeColumn);
          setHasSavedSettings(true);
        }
      } catch (err) {
        console.error('Failed to load saved settings:', err);
      }
    };
    loadSavedSettings();
  }, []);

  // Resolve values helper for 68 MASCOM, MASCON, TRACOM columns
  const getPropValue = useCallback((row, field) => {
    if (!row) return '';
    const colDef = SEARCH_COLUMNS.find((c) => c.k === field);
    if (colDef) {
      const val = colDef.get(row);
      return val === null || val === undefined ? '' : String(val);
    }
    if (field === 'key_person') return row.key?.contact_name || '';
    if (field === 'stage') return row.stage || '';
    if (row.co && row.co[field] !== undefined) return String(row.co[field]);
    return row[field] !== undefined ? String(row[field]) : '';
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortField('mascom_id');
      setSortAsc(true);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDragStart = (e, colKey) => {
    e.dataTransfer.setData('text/plain', colKey);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColKey) => {
    e.preventDefault();
    const draggedColKey = e.dataTransfer.getData('text/plain');
    if (draggedColKey === targetColKey) return;

    setVisibleColumns((prev) => {
      const next = [...prev];
      const draggedIdx = next.indexOf(draggedColKey);
      const targetIdx = next.indexOf(targetColKey);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, draggedColKey);
      }
      return next;
    });
  };

  const handleResizeStart = (e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = e.target.parentElement.getBoundingClientRect().width;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      setColumnWidths((prev) => {
        const next = { ...prev, [colKey]: newWidth };
        localStorage.setItem('company_search_column_widths', JSON.stringify(next));
        return next;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderSortableHeader = (field, label) => {
    const isSearchActive = searchModeColumn === field;
    const isSorted = sortField === field;
    return (
      <th 
        className={`clickable-header ${isSearchActive ? 'active-search-header' : ''}`}
        onClick={() => handleHeaderClick(field)}
        title="Click to toggle Specific Column Search"
        style={{ 
          width: columnWidths[field] ? `${columnWidths[field]}px` : undefined,
          position: 'relative',
          userSelect: 'none'
        }}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, field)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, field)}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'space-between' }}>
          <span>{label}</span>
          <span 
            className="sort-trigger-icon"
            onClick={(e) => { e.stopPropagation(); handleSort(field); }}
            style={{ cursor: 'pointer', padding: '0 2px', opacity: isSorted ? 1 : 0.4 }}
            title="Click to sort by this column"
          >
            {isSorted ? '▲' : '⇅'}
          </span>
        </div>
        <div 
          className="column-resizer" 
          onMouseDown={(e) => handleResizeStart(e, field)} 
          onClick={(e) => e.stopPropagation()} 
        />
      </th>
    );
  };

  // Header click handler toggles search mode
  const handleHeaderClick = (field) => {
    if (searchModeColumn === field) {
      setSearchModeColumn(null);
    } else {
      setSearchModeColumn(field);
      setTimeout(() => {
        const input = document.getElementById('search-input');
        if (input) input.focus();
      }, 50);
    }
  };

  // Pre-calculate full company rows
  const fullRows = companies.map((co) => {
    const companyContacts = contacts.filter((c) => c.mascom_id === co.mascom_id);
    const companyActs = [...(co.acts || []), ...TRACOM_SEED.filter((t) => t.mascom_id === co.mascom_id)]
      .reduce((acc, curr) => {
        if (!acc.some(a => (a.tracom_id && a.tracom_id === curr.tracom_id) || (a.remarks === curr.remarks && a.tracom_date === curr.tracom_date))) {
          acc.push(curr);
        }
        return acc;
      }, [])
      .sort((a, b) => (a.tracom_date < b.tracom_date ? -1 : 1));

    const counts = {};
    companyActs.forEach((a) => {
      counts[a.mode] = (counts[a.mode] || 0) + 1;
    });

    const lastQuote = [...companyActs].reverse().find((a) => a.price_quoted != null);
    const firstDemo = companyActs.find((a) => a.mode === "Demo");
    const invoice = companyActs.find((a) => a.mode === "Invoice");
    const lost = /marked lost/i.test(companyActs.length ? companyActs[companyActs.length - 1].remarks || "" : "");

    let stage = "Lead";
    if (firstDemo) stage = "Demo Done";
    if (counts.Quotation) stage = "Quoted";
    if (counts.Quotation && companyActs.some((a) => /negotiat/i.test(a.remarks || "") || /hold price/i.test(a.remarks || ""))) stage = "Negotiation";
    if (invoice) stage = "Won";
    if (lost) stage = "Lost";

    const key = companyContacts.find((c) => c.key_person === "Y") || companyContacts[0] || {};

    const hayContent = [
      co.company_name, co.city, co.state, co.industry_type, co.data_source, co.erp_using, co.user_name, co.mascom_remarks,
      ...companyContacts.map((c) => `${c.contact_name} ${c.designation} ${c.mobile} ${c.email} ${c.mascon_remarks}`),
      ...companyActs.map((a) => `${a.mode} ${a.remarks}`)
    ].join(" ").toLowerCase();

    return {
      co,
      contacts: companyContacts,
      acts: companyActs,
      counts,
      stage,
      key,
      lastQuote,
      firstDemo,
      invoice,
      hayContent
    };
  });

  // Unique options generators for dropdown selectors
  const uniqueValuesMap = useMemo(() => {
    const map = {};
    Object.keys(COLUMN_LABEL_MAP).forEach((field) => {
      const vals = fullRows.map((r) => {
        const val = getPropValue(r, field);
        return val === null || val === undefined ? '' : String(val).trim();
      });
      map[field] = Array.from(new Set(vals)).map(v => v || '—').sort();
    });
    return map;
  }, [fullRows]);

  const activeFilterCount = useMemo(() => {
    if (Array.isArray(activeFilters)) {
      return activeFilters.filter((f) => f.f && f.v).length;
    }
    return 0;
  }, [activeFilters]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return filterDataset(
      fullRows,
      activeFilters,
      searchQuery,
      searchModeColumn,
      getPropValue,
      (r) => r.hayContent
    );
  }, [fullRows, activeFilters, searchQuery, searchModeColumn, getPropValue]);

  const handleRowClick = (co) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(co.mascom_id)) {
        next.delete(co.mascom_id);
      } else {
        next.add(co.mascom_id);
      }
      return next;
    });
  };

  const handleCellClick = (e, field) => {
    e.stopPropagation();
    setSearchModeColumn(field);
    setTimeout(() => {
      const input = document.getElementById('search-input');
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }, 50);
  };

  // Sorting & Infinite Scroll Slice
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortField === 'selection') {
      const aSel = selectedRowIds.has(a.co.mascom_id) ? 1 : 0;
      const bSel = selectedRowIds.has(b.co.mascom_id) ? 1 : 0;
      if (aSel !== bSel) {
        return sortAsc ? (bSel - aSel) : (aSel - bSel); // sortAsc true -> selected (1) first
      }
    }

    let valA = getPropValue(a, sortField);
    let valB = getPropValue(b, sortField);
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const paginatedRows = sortedRows.slice(0, visibleCount);

  // Settings Save & Clear actions
  const handleSaveSettings = async () => {
    try {
      const payload = {
        isFixedHeader,
        visibleColumns,
        activeFilters,
        sortField,
        sortAsc,
        selectedRowIds: Array.from(selectedRowIds),
        searchQuery,
        searchModeColumn
      };
      await settingsService.saveSettings('company_search', payload);
      setHasSavedSettings(true);
      Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: 'Your grid layout, filters, and sticky header preferences have been saved!',
        confirmButtonColor: 'var(--accent)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });
    } catch (err) {
      console.error('Save settings error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save settings. Please try again.',
        confirmButtonColor: 'var(--accent)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });
    }
  };

  const handleClearSettings = async () => {
    try {
      await settingsService.clearSettings('company_search');
      setHasSavedSettings(false);
      setIsFixedHeader(false);
      setVisibleColumns(DEFAULT_VISIBLE_KEYS);
      setActiveFilters([]);
      setSortField('mascom_id');
      setSortAsc(true);
      setSelectedRowIds(new Set());
      setSearchQuery('');
      setSearchModeColumn(null);
      Swal.fire({
        icon: 'success',
        title: 'Settings Cleared',
        text: 'Grid layout has been restored to default settings.',
        confirmButtonColor: 'var(--accent)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });
    } catch (err) {
      console.error('Clear settings error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Clear Failed',
        text: 'Failed to clear settings. Please try again.',
        confirmButtonColor: 'var(--accent)',
        background: 'var(--panel)',
        color: 'var(--text-h)'
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchModeColumn(null);
    setActiveFilters({});
    setSelectedRowIds(new Set());
  };

  const handleExportExcel = () => {
    const exportData = filteredRows.map((r) => ({
      'Company ID': r.co.mascom_id,
      'Company Name': r.co.company_name,
      'Industry Type': r.co.industry_type,
      'City': r.co.city,
      'State': r.co.state,
      'Data Source': r.co.data_source,
      'ERP Used': r.co.erp_using || '',
      'Key Person': r.key.contact_name || '',
      'Stage': r.stage,
      'Remarks': r.co.mascom_remarks || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    XLSX.writeFile(wb, 'Company_Activity_Search.xlsx');
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    const [y, m, dd] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${dd} ${months[parseInt(m) - 1]} ${y.slice(2)}`;
  };

  const money = (n) => {
    if (n == null) return "";
    return `₹ ${Number(n).toLocaleString("en-IN")}`;
  };

  const getChecklistDoneCount = (co) => {
    if (!co) return 0;
    let data = co.checklistData || co.checklist_data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    if (!data || typeof data !== 'object') return 0;
    return Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length > 0).length;
  };

  const getDashboardDoneCount = (co) => {
    if (!co) return 0;
    let data = co.dashboardData || co.dashboard_data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    if (!data || typeof data !== 'object') return 0;
    return Object.keys(data).filter(k => data[k] && data[k].status === 'Done').length;
  };

  return (
    <div className="search-page">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-header-left">
          <span className="cs-title-icon"><Building2 size={16} /></span>
          <span className="cs-title-text">Company Search</span>
        </div>
        <div className="cs-header-right">
          <span className="view-pill-badge">VIEW</span>
        </div>
      </div>

      {/* Reordered Toolbar: Filter Modal, Sticky Toggle, Settings Save/Clear, Search Mode, Search Input */}
      <div className="cs-toolbar-row">
        {/* Advanced Layout & Filter buttons */}
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={() => setIsFilterModalOpen(true)}
          title="Configure Visible Columns & Excel-like Value Filters"
        >
          Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </button>

        <button 
          type="button" 
          className={`btn ${isFixedHeader ? 'btn-success' : 'btn-secondary'}`}
          onClick={() => setIsFixedHeader(prev => !prev)}
          title="Toggle locking table headers at the top on scroll (Freeze Header)"
        >
          Freeze Header
        </button>

        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={handleSaveSettings}
          title="Save layout and filter settings to backend"
        >
          Save Settings
        </button>

        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={handleClearSettings}
          disabled={filteredRows.length === 0 || !hasSavedSettings}
          title="Clear saved layout settings from backend"
        >
          Clear Settings
        </button>

        {/* Search Mode Toggles */}
        <div style={{ display: 'flex', gap: '2px', borderLeft: '1px solid var(--border)', paddingLeft: '6px', marginLeft: '2px' }}>
          <button 
            type="button" 
            className={`btn ${!searchModeColumn ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => {
              setSearchModeColumn(null);
              setTimeout(() => {
                const input = document.getElementById('search-input');
                if (input) input.focus();
              }, 50);
            }}
            title="Search across all columns with highlighting"
          >
            Generic Search
          </button>
          <button 
            type="button" 
            className={`btn specific-search-btn ${searchModeColumn ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => {
              if (searchModeColumn) {
                setSearchModeColumn(null);
              } else {
                setSearchModeColumn(visibleColumns[0] || 'company_name');
                setTimeout(() => {
                  const input = document.getElementById('search-input');
                  if (input) input.focus();
                }, 50);
              }
            }}
            title="Search specific field (click table cells to choose)"
          >
            {searchModeColumn ? COLUMN_LABEL_MAP[searchModeColumn] : "Specific Field Search"}
          </button>
        </div>

        {/* Single General Search input */}
        <div className="cs-search-box">
          <Search size={13} className="cs-search-icon" />
          <input
            id="search-input"
            type="text"
            className={`cs-search-input ${searchModeColumn ? 'active-col-search' : ''}`}
            placeholder={searchModeColumn ? `Search ${COLUMN_LABEL_MAP[searchModeColumn]}...` : "General Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchModeColumn && (
            <button 
              type="button" 
              className="search-mode-clear-btn" 
              onClick={() => { setSearchModeColumn(null); setSearchQuery(''); }}
              title="Switch back to General Search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Reusable Styled Green and Red buttons - Expand All and Collapse All */}
        <button 
          className="btn btn-success" 
          type="button" 
          onClick={() => {
            const allIds = filteredRows.map((r) => r.co.mascom_id);
            setExpandedRowIds(new Set(allIds));
          }}
          title="Expand all table rows"
        >
          Expand all
        </button>
        <button 
          className="btn btn-danger" 
          type="button" 
          onClick={() => {
            setExpandedRowIds(new Set());
          }}
          title="Collapse all table rows"
        >
          Collapse all
        </button>

        <div className="cs-toolbar-actions" style={{ marginLeft: 'auto' }}>
          <button type="button" className="total-records-btn" onClick={handleClearFilters} title="Reset filters">
            <RefreshCw size={11} style={{ marginRight: '4px' }} />
            Records: {filteredRows.length}
          </button>
          <button type="button" className="export-excel-btn" onClick={handleExportExcel} title="Export to Excel">
            <FileSpreadsheet size={14} style={{ marginRight: '6px' }} />
            Export Excel
            {filteredRows.length > 0 && <span className="export-count-badge">{filteredRows.length}</span>}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="cs-table-area">
        {isLoading ? (
          <Loading type="skeleton" />
        ) : (
          <>
            <div 
              className={`data-table-container company-search-table-container ${isFixedHeader ? 'fixed-header-active' : ''}`}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop - clientHeight < 20) {
                  setVisibleCount((prev) => prev + 50);
                }
              }}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '54px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}>
                        <label className="checkbox-container select-all-header-cb" style={{ marginRight: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedRowIds.has(r.co.mascom_id))}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedRowIds(prev => {
                                const next = new Set(prev);
                                paginatedRows.forEach(row => {
                                  if (checked) {
                                    next.add(row.co.mascom_id);
                                  } else {
                                    next.delete(row.co.mascom_id);
                                  }
                                });
                                return next;
                              });
                            }}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <span 
                          className="sort-trigger-icon"
                          onClick={() => {
                            if (sortField === 'selection') {
                              setSortField('mascom_id');
                              setSortAsc(true);
                            } else {
                              setSortField('selection');
                              setSortAsc(true);
                            }
                          }}
                          style={{ cursor: 'pointer', opacity: sortField === 'selection' ? 1 : 0.4, fontSize: '10px' }}
                          title="Sort selected first/last"
                        >
                          {sortField === 'selection' ? '▲' : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th style={{ width: '45px', textAlign: 'center', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-h)', letterSpacing: '0.6px' }}>Detail</th>
                    {visibleColumns.map((colKey) => renderSortableHeader(colKey, COLUMN_LABEL_MAP[colKey]))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((r, idx) => {
                    const isExpanded = expandedRowIds.has(r.co.mascom_id);
                    
                    const renderCellText = (text, field) => {
                      const isHighlightActive = !searchModeColumn || searchModeColumn === field;
                      return <HighlightText text={text} highlight={isHighlightActive ? searchQuery : ''} />;
                    };

                    return (
                      <React.Fragment key={r.co.mascom_id}>
                        <tr 
                          className={`master-row ${isExpanded ? 'open-row' : ''} ${idx % 2 === 1 ? 'even-row' : 'odd-row'} clickable-row`}
                          onClick={() => handleRowClick(r.co)}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <label className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={selectedRowIds.has(r.co.mascom_id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedRowIds(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(r.co.mascom_id);
                                    } else {
                                      next.delete(r.co.mascom_id);
                                    }
                                    return next;
                                  });
                                }}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="twisty-icon" style={{ fontWeight: 'bold', fontSize: '12px' }}>{isExpanded ? '−' : '＋'}</span>
                          </td>
                          {visibleColumns.map((colKey) => {
                             const colDef = SEARCH_COLUMNS.find(c => c.k === colKey);
                             const colLabel = colDef ? colDef.lab : (COLUMN_LABEL_MAP[colKey] || colKey);
                             const cellVal = colDef ? colDef.get(r) : (r.co[colKey] || '—');
                             const clsName = colDef ? colDef.cls : 'muted';

                             if (colKey === 'code' || colKey === 'mascom_id') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="company-id hit" 
                                   onClick={(e) => handleCellClick(e, colKey)}
                                   title="Click to search in Code"
                                 >
                                   {renderCellText(r.co.mascom_id, colKey)}
                                 </td>
                               );
                             }
                             if (colKey === 'name' || colKey === 'company_name') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="company-name hit" 
                                   onClick={(e) => handleCellClick(e, colKey)}
                                   title="Click to search in Company Name"
                                 >
                                   {renderCellText(r.co.company_name, colKey)}
                                 </td>
                               );
                             }
                             if (colKey === 'stage') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="hit" 
                                   onClick={(e) => handleCellClick(e, 'stage')}
                                   title="Click to search in Stage"
                                 >
                                   <span className={`stage ${STAGE_CLASS[r.stage]}`}>{r.stage}</span>
                                 </td>
                               );
                             }
                             if (colKey === 'rem' || colKey === 'mascom_remarks') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="company-remarks hit" 
                                   title={r.co.mascom_remarks}
                                   onClick={(e) => handleCellClick(e, colKey)}
                                 >
                                   {renderCellText(r.co.mascom_remarks || '—', colKey)}
                                 </td>
                               );
                             }

                             return (
                               <td 
                                 key={colKey} 
                                 className={`${clsName} hit`} 
                                 onClick={(e) => handleCellClick(e, colKey)}
                                 title={`Click to search in ${colLabel}`}
                               >
                                 {renderCellText(cellVal === null || cellVal === undefined || cellVal === '' ? '—' : String(cellVal), colKey)}
                               </td>
                             );
                           })}
                        </tr>

                        <SmoothDetailRow isExpanded={isExpanded} colSpan={visibleColumns.length + 2}>
                               <div className="detail-box">
                                 {/* Row Action Buttons Toolbar */}
                                 <div className="arow">
                                   <button 
                                     type="button" 
                                     className="abtn go" 
                                     onClick={() => {
                                       window.history.pushState({}, '', `/company?editId=${r.co.mascom_id}&returnTo=/company-search&expandId=${r.co.mascom_id}`);
                                       window.dispatchEvent(new PopStateEvent('popstate'));
                                     }}
                                   >
                                     Company Info
                                   </button>
                                   <button 
                                     type="button" 
                                     className="abtn go" 
                                     onClick={() => setActiveContactInfoCompany(r.co)}
                                   >
                                     Contact Info
                                   </button>
                                   <button 
                                     type="button" 
                                     className="abtn go" 
                                     onClick={() => setActiveActivityCompany(r.co)}
                                   >
                                     Activity Info
                                   </button>
                                   <button 
                                     type="button" 
                                     className="abtn go" 
                                     onClick={() => setActiveDashboardCompany(r.co)}
                                   >
                                     Dashboard ({getDashboardDoneCount(r.co)}/15)
                                   </button>
                                   <button 
                                     type="button" 
                                     className="abtn go" 
                                     onClick={() => setActiveChecklistCompany(r.co)}
                                   >
                                     Checklist ({getChecklistDoneCount(r.co)}/128)
                                   </button>

                                   {r.key.mobile ? (
                                     <a className="abtn" href={`tel:+91${r.key.mobile.replace(/\D/g, '')}`}>Calling</a>
                                   ) : (
                                     <span className="abtn off">Calling</span>
                                   )}

                                   {r.key.mobile ? (
                                     <a className="abtn" href={`https://wa.me/91${r.key.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                                   ) : (
                                     <span className="abtn off">WhatsApp</span>
                                   )}

                                   {r.key.email ? (
                                     <a className="abtn" href={`mailto:${r.key.email}`}>E-Mail</a>
                                   ) : (
                                     <span className="abtn off">E-Mail</span>
                                   )}
                                 </div>

                                 {/* Company Info Facts */}
                                 <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Company Details</span>
                                    <span className="src">MASCOM · {r.co.mascom_id}</span>
                                  </div>
                                  <div className="facts">
                                    <div className="fact">
                                      <span className="k">State</span>
                                      <span className="v">{r.co.state}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Data Source</span>
                                      <span className="v">{r.co.data_source}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Present ERP</span>
                                      <span className="v">{r.co.erp_using || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Quoted Value</span>
                                      <span className="v money">{r.lastQuote ? money(r.lastQuote.price_quoted) : '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Owner</span>
                                      <span className="v">{r.co.user_name}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">E-mail</span>
                                      <span className="v">{r.key.email || '—'}</span>
                                    </div>
                                  </div>
                                  {r.co.mascom_remarks && (
                                    <div className="muted" style={{ marginTop: '7px', fontSize: '11px' }}>
                                      {r.co.mascom_remarks}
                                    </div>
                                  )}
                                </div>

                                {/* Contact Table */}
                                <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Contact Persons</span>
                                    <span className="src">CUSCON · {r.contacts.length} record(s)</span>
                                  </div>
                                  <table className="sub">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '70px' }}>Code</th>
                                        <th style={{ width: '180px' }}>Name</th>
                                        <th style={{ width: '150px' }}>Designation</th>
                                        <th>Mobile No</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {r.contacts.length ? (
                                        r.contacts.map((ct) => (
                                          <tr key={ct.mascon_id}>
                                            <td className="mono dim">{ct.mascon_id}</td>
                                            <td>
                                              <b>{ct.contact_name}</b>
                                              {ct.key_person === "Y" && <span className="keyflag">KEY</span>}
                                            </td>
                                            <td className="muted">{ct.designation || '—'}</td>
                                            <td className="mono">{ct.mobile || '—'}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="4" className="dim" style={{ textAlign: 'center', padding: '12px' }}>
                                            No contact persons recorded.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Recent Activity Table */}
                                <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Recent Activity</span>
                                    <span className="src">ACTTRN · {r.acts.length} log(s)</span>
                                  </div>
                                  <table className="sub">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '90px' }}>Date</th>
                                        <th style={{ width: '110px' }}>Mode</th>
                                        <th>Remarks</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {r.acts.length ? (
                                        [...r.acts].reverse().map((act) => (
                                          <tr key={act.tracom_id}>
                                            <td className="mono">{fmtDate(act.tracom_date)}</td>
                                            <td>
                                              <span className="pill c" style={{ display: 'inline-block', fontSize: '8.5px', fontWeight: 700, padding: '1px 4px', borderRadius: '2px', border: '1px solid', color: '#1c7a4a', borderColor: '#a9d9be', backgroundColor: '#ecf8f1' }}>{act.mode}</span>
                                            </td>
                                            <td className="muted">{act.remarks}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="3" className="dim" style={{ textAlign: 'center', padding: '12px' }}>
                                            No recent activities recorded.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                        </SmoothDetailRow>
                      </React.Fragment>
                    );
                  })}
                  {!paginatedRows.length && (
                    <tr>
                      <td colSpan={visibleColumns.length + 2}>
                        <div className="table-empty-state">
                          <p>No records match your filters. Select different values above or toggle search columns.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ActivityModal 
        isOpen={!!activeActivityCompany} 
        onClose={() => setActiveActivityCompany(null)} 
        company={activeActivityCompany}
        onAddRemark={async (companyId, remarkText, mode) => {
          const todayStr = new Date().toISOString().slice(0, 10);
          const newAct = {
            tracom_id: `TR-${Date.now()}`,
            mascom_id: companyId,
            tracom_date: todayStr,
            date: todayStr,
            mode: mode || 'Call',
            remarks: remarkText,
            user_name: 'admin_fincrm'
          };

          const targetCompany = companies.find(c => c.mascom_id === companyId);
          const currentActs = targetCompany?.acts || activeActivityCompany?.remarksList || activeActivityCompany?.acts || [];
          const updatedActs = [newAct, ...currentActs];

          try {
            await companyService.updateCompany(companyId, { acts: updatedActs, activity_data: updatedActs });
            
            setActiveActivityCompany(prev => {
              if (!prev) return null;
              return {
                ...prev,
                acts: updatedActs,
                remarksList: updatedActs
              };
            });

            setCompanies(prev => prev.map(c => {
              if (c.mascom_id === companyId) {
                return {
                  ...c,
                  acts: updatedActs
                };
              }
              return c;
            }));
          } catch (err) {
            console.error('Failed to save activity remark to database:', err);
          }
        }}
        onUpdateRemark={async (companyId, updateIdx, remarkText, mode) => {
          const targetCompany = companies.find(c => c.mascom_id === companyId);
          const currentActs = [...(targetCompany?.acts || activeActivityCompany?.remarksList || activeActivityCompany?.acts || [])];
          if (currentActs[updateIdx]) {
            currentActs[updateIdx] = {
              ...currentActs[updateIdx],
              mode: mode || 'Call',
              remarks: remarkText
            };
          }

          try {
            await companyService.updateCompany(companyId, { acts: currentActs, activity_data: currentActs });

            setActiveActivityCompany(prev => {
              if (!prev) return null;
              return {
                ...prev,
                acts: currentActs,
                remarksList: currentActs
              };
            });

            setCompanies(prev => prev.map(c => {
              if (c.mascom_id === companyId) {
                return {
                  ...c,
                  acts: currentActs
                };
              }
              return c;
            }));
          } catch (err) {
            console.error('Failed to update activity remark in database:', err);
          }
        }}
        onDeleteRemark={async (companyId, deleteIdx) => {
          const targetCompany = companies.find(c => c.mascom_id === companyId);
          const currentActs = [...(targetCompany?.acts || activeActivityCompany?.remarksList || activeActivityCompany?.acts || [])];
          currentActs.splice(deleteIdx, 1);

          try {
            await companyService.updateCompany(companyId, { acts: currentActs, activity_data: currentActs });

            setActiveActivityCompany(prev => {
              if (!prev) return null;
              return {
                ...prev,
                acts: currentActs,
                remarksList: currentActs
              };
            });

            setCompanies(prev => prev.map(c => {
              if (c.mascom_id === companyId) {
                return {
                  ...c,
                  acts: currentActs
                };
              }
              return c;
            }));
          } catch (err) {
            console.error('Failed to delete activity remark from database:', err);
          }
        }}
      />
      <DashboardModal 
        isOpen={!!activeDashboardCompany} 
        onClose={() => setActiveDashboardCompany(null)} 
        company={activeDashboardCompany}
        onSaveDashboard={async (companyId, updatedDashboard) => {
          try {
            await companyService.updateCompany(companyId, { dashboard_data: updatedDashboard });
            setActiveDashboardCompany(prev => {
              if (!prev) return null;
              return { ...prev, dashboard_data: updatedDashboard, dashboardData: updatedDashboard };
            });
            setCompanies(prev => prev.map(c => {
              if (c.mascom_id === companyId) {
                return { ...c, dashboard_data: updatedDashboard, dashboardData: updatedDashboard };
              }
              return c;
            }));
          } catch (err) {
            console.error('Failed to save dashboard step progress to database:', err);
          }
        }}
      />
      <ChecklistModal 
        isOpen={!!activeChecklistCompany} 
        onClose={() => setActiveChecklistCompany(null)} 
        company={activeChecklistCompany}
        onSaveChecklist={async (companyId, updatedChecklist) => {
          try {
            await companyService.updateCompany(companyId, { checklist_data: updatedChecklist });
            setActiveChecklistCompany(prev => {
              if (!prev) return null;
              return { ...prev, checklist_data: updatedChecklist, checklistData: updatedChecklist };
            });
            setCompanies(prev => prev.map(c => {
              if (c.mascom_id === companyId) {
                return { ...c, checklist_data: updatedChecklist, checklistData: updatedChecklist };
              }
              return c;
            }));
          } catch (err) {
            console.error('Failed to save checklist to database:', err);
          }
        }}
      />
      <ContactInfoModal
        isOpen={!!activeContactInfoCompany}
        onClose={() => setActiveContactInfoCompany(null)}
        company={activeContactInfoCompany}
        contacts={contacts}
        onAddContact={(comp) => {
          setActiveContactInfoCompany(null);
          window.history.pushState({}, '', `/contact?companyId=${comp.mascom_id}&mode=add&returnTo=/company-search&expandId=${comp.mascom_id}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        onEditContact={(cont) => {
          setActiveContactInfoCompany(null);
          window.history.pushState({}, '', `/contact?editId=${cont.mascon_id}&companyId=${cont.mascom_id}&returnTo=/company-search&expandId=${cont.mascom_id}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        onDeleteContact={async (cont) => {
          const confirm = await Swal.fire({
            title: 'Delete Contact?',
            text: `Delete contact ${cont.contact_name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--btn-danger)',
            cancelButtonColor: 'var(--border)',
            background: 'var(--panel)',
            color: 'var(--text-h)'
          });
          if (confirm.isConfirmed) {
            try {
              await contactService.deleteContact(cont.mascon_id);
              setContacts(prev => prev.filter(c => c.mascon_id !== cont.mascon_id));
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Contact deleted successfully.',
                confirmButtonColor: 'var(--accent)',
                background: 'var(--panel)',
                color: 'var(--text-h)'
              });
            } catch (err) {
              console.error(err);
            }
          }
        }}
      />

      {/* Checklist Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        columns={COLUMN_LABEL_MAP}
        dataset={fullRows}
        getPropValue={getPropValue}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
      />
    </div>
  );
};

export default CompanySearch;
