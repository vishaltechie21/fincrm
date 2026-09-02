/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Loading from '../../components/Loading/Loading';
import FilterModal from '../../components/FilterModal/FilterModal';
import HighlightText from '../../components/HighlightText';
import * as settingsService from '../../services/settingsService';
import Swal from 'sweetalert2';
import * as companyService from '../../services/companyService';
import * as contactService from '../../services/contactService';
import { MASCOM_SEED, MASCON_SEED, TRACOM_SEED } from '../../utils/activityData';
import { filterDataset } from '../../utils/filterUtils';


const COLUMN_LABEL_MAP = {
  mascon_id: 'Code',
  company_name: 'Company',
  contact_name: 'Contact Name',
  designation: 'Designation',
  mobile: 'Mobile',
  email: 'Email',
  key_person: 'Key Person',
  user_name: 'Sales User',
  stage: 'Stage',
  mascon_remarks: 'Remarks'
};

const STAGE_CLASS = { "Lead": "lead", "Demo Done": "demo", "Quoted": "quoted", "Negotiation": "nego", "Won": "won", "Lost": "lost" };

const formatMoney = (val) => {
  if (val == null || val === '') return null;
  const str = String(val).trim();
  const num = Number(str.replace(/[^0-9.-]+/g, ""));
  if (!isNaN(num) && num > 0) {
    return `₹ ${num.toLocaleString('en-IN')}`;
  }
  return str;
};

const getQuotedValue = (r) => {
  if (!r) return '—';
  const coObj = r.company || r.co || {};
  
  // 1. Direct company quoted field from DB (`quoted` / `quoted_value` / `price_quoted` / `amount` / `deal_value`)
  const directQuoted = coObj.quoted ?? coObj.quoted_value ?? coObj.price_quoted ?? coObj.amount ?? coObj.deal_value;
  if (directQuoted != null && String(directQuoted).trim() !== '') {
    return formatMoney(directQuoted);
  }

  // 2. Activity logs lastQuote
  if (r.lastQuote && (r.lastQuote.price_quoted != null || r.lastQuote.amount != null || r.lastQuote.quoted != null)) {
    const val = r.lastQuote.price_quoted ?? r.lastQuote.amount ?? r.lastQuote.quoted;
    return formatMoney(val);
  }

  // 3. Scan all activity logs
  const quoteAct = (r.acts || []).find((a) => a && (a.price_quoted != null || a.amount != null || a.quoted != null));
  if (quoteAct) {
    const val = quoteAct.price_quoted ?? quoteAct.amount ?? quoteAct.quoted;
    return formatMoney(val);
  }

  // 4. Contact level quoted field if available
  if (r.ct) {
    const ctVal = r.ct.quoted ?? r.ct.quoted_value ?? r.ct.deal_value ?? r.ct.price_quoted ?? r.ct.amount;
    if (ctVal != null && String(ctVal).trim() !== '') return formatMoney(ctVal);
  }

  return '—';
};

const ContactSearch = () => {
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModeColumn, setSearchModeColumn] = useState(null); // null = General, 'field_name' = Generic

  // Layout & Persistent Settings State
  const [isFixedHeader, setIsFixedHeader] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(Object.keys(COLUMN_LABEL_MAP));
  const [activeFilters, setActiveFilters] = useState([]);
  const [hasSavedSettings, setHasSavedSettings] = useState(false);
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('contact_search_column_widths');
    return saved ? JSON.parse(saved) : {};
  });

  // Selection Checkbox State (Set of mascon_id keys)
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Accordion expanded row IDs (Set of mascon_id keys)
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

  // Infinite Scroll & Sorting
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState('mascon_id');
  const [sortAsc, setSortAsc] = useState(true);

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

      const mergedCompanies = [...MASCOM_SEED];
      dbCompanies.forEach((dbComp) => {
        if (!mergedCompanies.some(c => c.mascom_id === dbComp.mascom_id)) {
          mergedCompanies.push(dbComp);
        }
      });

      const mergedContacts = [...MASCON_SEED];
      dbContacts.forEach((dbCont) => {
        if (!mergedContacts.some(c => c.mascon_id === dbCont.mascon_id)) {
          mergedContacts.push(dbCont);
        }
      });

      setCompanies(mergedCompanies);
      setContacts(mergedContacts);
      setVisibleCount(50);
    } catch (err) {
      console.error('ContactSearch loading error:', err);
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
        const res = await settingsService.getSettings('contact_search');
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

  // Resolve values helper
  const getPropValue = (row, field) => {
    if (!row) return '';
    if (field === 'company_name') return row.company?.company_name || row.ct.mascom_id || '';
    if (field === 'key_person') return row.ct.key_person || '';
    if (field === 'user_name') return row.ct.user_name || '';
    if (field === 'stage') return row.stage || '';
    if (row.ct && row.ct[field] !== undefined) return row.ct[field];
    if (row[field] !== undefined) return row[field];
    return '';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField('mascon_id');
        setSortAsc(true);
      }
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
        localStorage.setItem('contact_search_column_widths', JSON.stringify(next));
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
    const isSorted = sortField === field;
    const isSearchActive = searchModeColumn === field;
    return (
      <th 
        key={field}
        className={`clickable-header sortable-header ${isSorted ? 'active-sorted-header' : ''} ${isSearchActive ? 'active-search-header' : ''}`}
        onClick={() => handleSort(field)}
        title="Click to sort by this column"
        style={{ 
          width: columnWidths[field] ? `${columnWidths[field]}px` : undefined,
          position: 'relative',
          userSelect: 'none',
          cursor: 'pointer'
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
            style={{ padding: '0 3px', opacity: isSorted ? 1 : 0.6 }}
          >
            {isSorted ? (sortAsc ? '▲' : '▼') : 'Δ'}
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

  // Pre-calculate full contact rows
  const fullRows = contacts.map((ct) => {
    const parentCompany = companies.find((c) => c.mascom_id === ct.mascom_id) || {};
    const contactActs = TRACOM_SEED.filter((t) => t.mascon_id === ct.mascon_id)
      .sort((a, b) => (a.tracom_date < b.tracom_date ? -1 : 1));

    const counts = {};
    contactActs.forEach((a) => {
      counts[a.mode] = (counts[a.mode] || 0) + 1;
    });

    const lastQuote = [...contactActs].reverse().find((a) => a.price_quoted != null);
    const firstDemo = contactActs.find((a) => a.mode === "Demo");
    const invoice = contactActs.find((a) => a.mode === "Invoice");
    const lost = /marked lost/i.test(contactActs.length ? contactActs[contactActs.length - 1].remarks || "" : "");

    let stage = "Lead";
    if (firstDemo) stage = "Demo Done";
    if (counts.Quotation) stage = "Quoted";
    if (counts.Quotation && contactActs.some((a) => /negotiat/i.test(a.remarks || "") || /hold price/i.test(a.remarks || ""))) stage = "Negotiation";
    if (invoice) stage = "Won";
    if (lost) stage = "Lost";

    const last = contactActs.length ? contactActs[contactActs.length - 1] : null;

    const hayContent = [
      ct.contact_name, ct.designation, ct.mobile, ct.email, ct.mascon_remarks,
      parentCompany.company_name, parentCompany.city, parentCompany.state,
      ...contactActs.map((a) => `${a.mode} ${a.remarks}`)
    ].join(" ").toLowerCase();

    return {
      ct,
      company: parentCompany,
      acts: contactActs,
      counts,
      stage,
      last,
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

  const handleRowClick = (ct) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(ct.mascon_id)) {
        next.delete(ct.mascon_id);
      } else {
        next.add(ct.mascon_id);
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

  const handleSelectAll = () => {
    const isCurrentlyAllSelected = filteredRows.length > 0 && filteredRows.every(r => selectedRowIds.has(r.ct.mascon_id));
    const currentUserName = 'Suman';

    if (!isCurrentlyAllSelected) {
      Swal.fire({
        title: 'Select All Contacts',
        html: `<div style="text-align: left; font-size: 13px; color: var(--text-h); line-height: 1.6;">
          All <b>${filteredRows.length}</b> contacts in the grid will be marked by <b>${currentUserName}</b>.<br/>
          Do you want to continue?
        </div>`,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        confirmButtonColor: '#0e6245',
        cancelButtonColor: '#e2f2e9',
        customClass: {
          confirmButton: 'swal-btn-confirm-custom',
          cancelButton: 'swal-btn-cancel-custom'
        },
        background: 'var(--panel)',
        color: 'var(--text-h)'
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedRowIds(new Set(filteredRows.map(r => r.ct.mascon_id)));
        }
      });
    } else {
      Swal.fire({
        title: 'Clear All Contacts',
        html: `<div style="text-align: left; font-size: 13px; color: var(--text-h); line-height: 1.6;">
          The marks of <b>${currentUserName}</b> on all <b>${filteredRows.length}</b> contacts in the grid will be cleared.<br/>
          Other users' marks are not affected.<br/>
          Do you want to continue?
        </div>`,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        confirmButtonColor: '#0e6245',
        cancelButtonColor: '#e2f2e9',
        customClass: {
          confirmButton: 'swal-btn-confirm-custom',
          cancelButton: 'swal-btn-cancel-custom'
        },
        background: 'var(--panel)',
        color: 'var(--text-h)'
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedRowIds(new Set());
        }
      });
    }
  };

  // Sorting & Infinite Scroll Slice
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortField === 'selection') {
      const aSel = selectedRowIds.has(a.ct.mascon_id) ? 1 : 0;
      const bSel = selectedRowIds.has(b.ct.mascon_id) ? 1 : 0;
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
      await settingsService.saveSettings('contact_search', payload);
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
      await settingsService.clearSettings('contact_search');
      setHasSavedSettings(false);
      setIsFixedHeader(false);
      setVisibleColumns(Object.keys(COLUMN_LABEL_MAP));
      setActiveFilters([]);
      setSortField('mascon_id');
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
      'Contact ID': r.ct.mascon_id,
      'Company Name': r.company.company_name || r.ct.mascom_id,
      'Contact Name': r.ct.contact_name,
      'Designation': r.ct.designation || '',
      'Mobile': r.ct.mobile || '',
      'Email': r.ct.email || '',
      'Key Person': r.ct.key_person || '',
      'Sales Agent': r.ct.user_name || '',
      'Stage': r.stage,
      'Remarks': r.ct.mascon_remarks || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'Contact_Activity_Search.xlsx');
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

  return (
    <div className="search-page">
      {/* Header */}
      <div className="cs-header">
        <div className="cs-header-left">
          <span className="cs-title-text">Searching Data</span>
          <span className="cs-header-badge">MASCON</span>
        </div>
      </div>

      {/* Toolbar Container */}
      <div className="cs-toolbar-container">
        {/* Row 1 Toolbar Buttons */}
        <div className="cs-toolbar-row">
          <button 
            type="button" 
            className={`btn ${isFixedHeader ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setIsFixedHeader(prev => !prev)}
            title="Toggle locking table headers at the top on scroll"
          >
            ✓ Fixed Header
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setIsFilterModalOpen(true)}
            title="Configure Visible Columns & Value Filters"
          >
            Filter Condition {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </button>

          <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={() => {
              const allIds = filteredRows.map((r) => r.ct.mascon_id);
              setExpandedRowIds(new Set(allIds));
            }}
            title="Expand all table rows"
          >
            Expand All
          </button>

          <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={() => {
              setExpandedRowIds(new Set());
            }}
            title="Collapse all table rows"
          >
            Collapse All
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleSaveSettings}
            title="Save layout and filter settings"
          >
            Save Setting
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleClearSettings}
            disabled={filteredRows.length === 0 || !hasSavedSettings}
            title="Reset saved layout settings"
          >
            Reset Setting
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              Swal.fire({
                icon: 'info',
                title: 'Permission Settings',
                text: 'User permissions for Contact Search are active.',
                confirmButtonColor: 'var(--accent)',
                background: 'var(--panel)',
                color: 'var(--text-h)'
              });
            }}
            title="View permission settings"
          >
            Permission
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

        {/* Row 2 Search Controls */}
        <div className="cs-toolbar-row cs-toolbar-row-2">
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
            title="Search across all columns"
          >
            Generic Search
          </button>

          <button 
            type="button" 
            className={`btn ${searchModeColumn ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => {
              if (searchModeColumn) {
                setSearchModeColumn(null);
              } else {
                setSearchModeColumn(visibleColumns[0] || 'contact_name');
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

          <div className="cs-search-box">
            <Search size={13} className="cs-search-icon" />
            <input
              id="search-input"
              type="text"
              className={`cs-search-input ${searchModeColumn ? 'active-col-search' : ''}`}
              placeholder="Text to search"
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
        </div>
      </div>

      {/* Main Grid */}
      <div className="cs-table-area">
        {isLoading ? (
          <Loading type="skeleton" />
        ) : (
          <>
            <div 
              className={`data-table-container contact-search-table-container ${isFixedHeader ? 'fixed-header-active' : ''}`}
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
                            checked={filteredRows.length > 0 && filteredRows.every(r => selectedRowIds.has(r.ct.mascon_id))}
                            onChange={handleSelectAll}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <span 
                          className="sort-trigger-icon"
                          onClick={() => handleSort('selection')}
                          style={{ cursor: 'pointer', opacity: sortField === 'selection' ? 1 : 0.6, fontSize: '10px' }}
                          title="Click to sort by selected rows"
                        >
                          {sortField === 'selection' ? (sortAsc ? '▲' : '▼') : 'Δ'}
                        </span>
                      </div>
                    </th>
                    <th style={{ width: '54px', textAlign: 'center' }}>Detail</th>
                    {visibleColumns.map((colKey) => renderSortableHeader(colKey, COLUMN_LABEL_MAP[colKey]))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((r, idx) => {
                    const isExpanded = expandedRowIds.has(r.ct.mascon_id);
                    
                    const renderCellText = (text, field) => {
                      const isHighlightActive = !searchModeColumn || searchModeColumn === field;
                      return <HighlightText text={text} highlight={isHighlightActive ? searchQuery : ''} />;
                    };

                    return (
                      <React.Fragment key={r.ct.mascon_id}>
                        <tr 
                          className={`master-row ${isExpanded ? 'open-row' : ''} ${idx % 2 === 1 ? 'even-row' : 'odd-row'} clickable-row`}
                          onClick={() => handleRowClick(r.ct)}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <label className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={selectedRowIds.has(r.ct.mascon_id)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedRowIds(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(r.ct.mascon_id);
                                    } else {
                                      next.delete(r.ct.mascon_id);
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
                             if (colKey === 'mascon_id') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="contact-id hit" 
                                   onClick={(e) => handleCellClick(e, 'mascon_id')}
                                   title="Click to search in Code"
                                 >
                                   {renderCellText(r.ct.mascon_id, 'mascon_id')}
                                 </td>
                               );
                             }
                             if (colKey === 'company_name') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="company-name hit" 
                                   onClick={(e) => handleCellClick(e, 'company_name')}
                                   title="Click to search in Company"
                                 >
                                   {renderCellText(r.company.company_name || r.ct.mascom_id, 'company_name')}
                                 </td>
                               );
                             }
                             if (colKey === 'contact_name') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="hit" 
                                   onClick={(e) => handleCellClick(e, 'contact_name')}
                                   title="Click to search in Contact Name"
                                 >
                                   <b>{renderCellText(r.ct.contact_name, 'contact_name')}</b>
                                   {r.ct.key_person && <span className="keyflag">KEY</span>}
                                 </td>
                               );
                             }
                             if (colKey === 'email') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="contact-email hit" 
                                   title={r.ct.email}
                                   onClick={(e) => handleCellClick(e, 'email')}
                                 >
                                   {renderCellText(r.ct.email || '—', 'email')}
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
                             if (colKey === 'mascon_remarks') {
                               return (
                                 <td 
                                   key={colKey} 
                                   className="contact-remarks hit" 
                                   title={r.ct.mascon_remarks}
                                   onClick={(e) => handleCellClick(e, 'mascon_remarks')}
                                 >
                                   {renderCellText(r.ct.mascon_remarks || '—', 'mascon_remarks')}
                                 </td>
                               );
                             }
                             // Default cell rendering for designation, mobile, key_person, user_name
                             return (
                               <td 
                                 key={colKey} 
                                 className="hit" 
                                 onClick={(e) => handleCellClick(e, colKey)}
                                 title={`Click to search in ${COLUMN_LABEL_MAP[colKey]}`}
                               >
                                 {renderCellText(r.ct[colKey] || '—', colKey)}
                                </td>
                             );
                           })}
                        </tr>

                        {isExpanded && (
                          <tr className="detail">
                            <td colSpan={visibleColumns.length + 2} className="detail-cell">
                              <div className="detail-box">
                                {/* Contact Info */}
                                <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Contact Details</span>
                                    <span className="src">MASCON · {r.ct.mascon_id}</span>
                                  </div>
                                  <div className="facts">
                                    <div className="fact">
                                      <span className="k">Designation</span>
                                      <span className="v">{r.ct.designation || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Mobile</span>
                                      <span className="v">{r.ct.mobile || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">E-mail</span>
                                      <span className="v">{r.ct.email || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Key Person</span>
                                      <span className="v">{r.ct.key_person || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Sales Owner</span>
                                      <span className="v">{r.ct.user_name || '—'}</span>
                                    </div>
                                  </div>
                                  {r.ct.mascon_remarks && (
                                    <div className="muted" style={{ marginTop: '7px', fontSize: '11px' }}>
                                      {r.ct.mascon_remarks}
                                    </div>
                                  )}
                                </div>

                                {/* Company Details Facts */}
                                <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Company Association</span>
                                    <span className="src">MASCOM · {r.company.mascom_id || '—'}</span>
                                  </div>
                                  <div className="facts" style={{ gap: '6px 14px' }}>
                                    <div className="fact">
                                      <span className="k">Company Name</span>
                                      <span className="v" style={{ fontSize: '10px' }}>{r.company.company_name || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Industry</span>
                                      <span className="v" style={{ fontSize: '10px' }}>{r.company.industry_type || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">City & State</span>
                                      <span className="v" style={{ fontSize: '10px' }}>{r.company.city ? `${r.company.city}, ${r.company.state || ''}` : r.company.state || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Present ERP</span>
                                      <span className="v" style={{ fontSize: '10px' }}>{r.company.erp_using || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Quoted Value</span>
                                      <span className="v money" style={{ fontSize: '10.5px', color: '#0f766e', fontWeight: '700' }}>{getQuotedValue(r)}</span>
                                    </div>
                                    {r.company.budget && (
                                      <div className="fact">
                                        <span className="k">Budget</span>
                                        <span className="v money" style={{ fontSize: '10px', color: '#2563eb' }}>{formatMoney(r.company.budget)}</span>
                                      </div>
                                    )}
                                    {r.company.turnover && (
                                      <div className="fact">
                                        <span className="k">Turnover</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.turnover}</span>
                                      </div>
                                    )}
                                    <div className="fact">
                                      <span className="k">Source</span>
                                      <span className="v" style={{ fontSize: '10px' }}>{r.company.data_source || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Owner</span>
                                      <span className="v" style={{ fontSize: '10px' }}>{r.company.user_name || '—'}</span>
                                    </div>
                                    {r.company.users && (
                                      <div className="fact">
                                        <span className="k">Users</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.users}</span>
                                      </div>
                                    )}
                                    {r.company.units && (
                                      <div className="fact">
                                        <span className="k">Units</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.units}</span>
                                      </div>
                                    )}
                                    {r.company.ho && (
                                      <div className="fact">
                                        <span className="k">HO Location</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.ho}</span>
                                      </div>
                                    )}
                                    {r.company.plant && (
                                      <div className="fact">
                                        <span className="k">Plant Location</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.plant}</span>
                                      </div>
                                    )}
                                    {r.company.client && (
                                      <div className="fact">
                                        <span className="k">Existing Client</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.client}</span>
                                      </div>
                                    )}
                                    {r.company.follow && (
                                      <div className="fact">
                                        <span className="k">Follow-up Date</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.follow}</span>
                                      </div>
                                    )}
                                    {(r.company.web || r.company.website) && (
                                      <div className="fact">
                                        <span className="k">Website</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.web || r.company.website}</span>
                                      </div>
                                    )}
                                    {r.company.want && (
                                      <div className="fact" style={{ minWidth: '130px' }}>
                                        <span className="k">Requirement</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.want}</span>
                                      </div>
                                    )}
                                    {r.company.seen && (
                                      <div className="fact" style={{ minWidth: '130px' }}>
                                        <span className="k">Competitors Seen</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.seen}</span>
                                      </div>
                                    )}
                                    {r.company.phone && (
                                      <div className="fact">
                                        <span className="k">Phone</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.phone}</span>
                                      </div>
                                    )}
                                    {r.company.email && (
                                      <div className="fact">
                                        <span className="k">E-mail</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.email}</span>
                                      </div>
                                    )}
                                    {r.company.address && (
                                      <div className="fact" style={{ minWidth: '160px' }}>
                                        <span className="k">Address</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.address}</span>
                                      </div>
                                    )}
                                    {r.company.gst_no && (
                                      <div className="fact">
                                        <span className="k">GST No</span>
                                        <span className="v" style={{ fontSize: '10px' }}>{r.company.gst_no}</span>
                                      </div>
                                    )}
                                  </div>
                                  {r.company.mascom_remarks && (
                                    <div className="muted" style={{ marginTop: '7px', fontSize: '10.5px', fontStyle: 'italic', background: 'var(--panel2)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid var(--accent)' }}>
                                      <strong>Company Remarks:</strong> {r.company.mascom_remarks}
                                    </div>
                                  )}
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
                            </td>
                          </tr>
                        )}
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

export default ContactSearch;
