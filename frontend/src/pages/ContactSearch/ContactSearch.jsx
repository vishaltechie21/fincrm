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
    setSortField(field);
    setSortAsc(true);
  };

  const renderSortableHeader = (field, label) => {
    const isSearchActive = searchModeColumn === field;
    const isSorted = sortField === field;
    return (
      <th 
        className={`clickable-header ${isSearchActive ? 'active-search-header' : ''}`}
        onClick={() => handleHeaderClick(field)}
        title="Click to toggle Specific Column Search"
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
  const filteredRows = fullRows.filter((r) => {
    // 1. Array filters (new condition-based filters)
    if (Array.isArray(activeFilters)) {
      for (const filter of activeFilters) {
        if (filter.f && filter.v) {
          const val = getPropValue(r, filter.f) || '—';
          if (String(val) !== filter.v) {
            return false;
          }
        }
      }
    } else {
      // Legacy object filters fallback
      for (const field of Object.keys(COLUMN_LABEL_MAP)) {
        const checkedVals = activeFilters[field];
        if (checkedVals !== undefined) {
          const val = getPropValue(r, field) || '—';
          if (!checkedVals.includes(val)) {
            return false;
          }
        }
      }
    }

    // 2. Search Box (General or Column Generic)
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (searchModeColumn) {
        const val = getPropValue(r, searchModeColumn);
        matchesSearch = String(val).toLowerCase().includes(q);
      } else {
        matchesSearch = r.hayContent.includes(q);
      }
    }

    return matchesSearch;
  });

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
          <span className="cs-title-icon"><User size={16} /></span>
          <span className="cs-title-text">Contact Search</span>
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
            const allIds = filteredRows.map((r) => r.ct.mascon_id);
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
              className={`contact-table-container ${isFixedHeader ? 'fixed-header-active' : ''}`}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop - clientHeight < 20) {
                  setVisibleCount((prev) => prev + 50);
                }
              }}
            >
              <table className="contact-table">
                <thead>
                  <tr>
                    <th style={{ width: '54px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}>
                        <label className="checkbox-container select-all-header-cb" style={{ marginRight: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedRowIds.has(r.ct.mascon_id))}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedRowIds(prev => {
                                const next = new Set(prev);
                                paginatedRows.forEach(row => {
                                  if (checked) {
                                    next.add(row.ct.mascon_id);
                                  } else {
                                    next.delete(row.ct.mascon_id);
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
                            setSortField('selection');
                            setSortAsc(true);
                          }}
                          style={{ cursor: 'pointer', opacity: sortField === 'selection' ? 1 : 0.4, fontSize: '10px' }}
                          title="Sort selected first/last"
                        >
                          {sortField === 'selection' ? '▲' : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th style={{ width: '30px' }}></th>
                    {visibleColumns.includes('mascon_id') && renderSortableHeader('mascon_id', 'Code')}
                    {visibleColumns.includes('company_name') && renderSortableHeader('company_name', 'Company')}
                    {visibleColumns.includes('contact_name') && renderSortableHeader('contact_name', 'Contact Name')}
                    {visibleColumns.includes('designation') && renderSortableHeader('designation', 'Designation')}
                    {visibleColumns.includes('mobile') && renderSortableHeader('mobile', 'Mobile')}
                    {visibleColumns.includes('email') && renderSortableHeader('email', 'Email')}
                    {visibleColumns.includes('key_person') && renderSortableHeader('key_person', 'Key Person')}
                    {visibleColumns.includes('user_name') && renderSortableHeader('user_name', 'Sales User')}
                    {visibleColumns.includes('stage') && renderSortableHeader('stage', 'Stage')}
                    {visibleColumns.includes('mascon_remarks') && renderSortableHeader('mascon_remarks', 'Remarks')}
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
                          {visibleColumns.includes('mascon_id') && (
                            <td 
                              className="contact-id hit" 
                              onClick={(e) => handleCellClick(e, 'mascon_id')}
                              title="Click to search in Code"
                            >
                              {renderCellText(r.ct.mascon_id, 'mascon_id')}
                            </td>
                          )}
                          {visibleColumns.includes('company_name') && (
                            <td 
                              className="company-name hit" 
                              onClick={(e) => handleCellClick(e, 'company_name')}
                              title="Click to search in Company"
                            >
                              {renderCellText(r.company.company_name || r.ct.mascom_id, 'company_name')}
                            </td>
                          )}
                          {visibleColumns.includes('contact_name') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'contact_name')}
                              title="Click to search in Contact Name"
                            >
                              <b>{renderCellText(r.ct.contact_name, 'contact_name')}</b>
                              {r.ct.key_person && <span className="keyflag">KEY</span>}
                            </td>
                          )}
                          {visibleColumns.includes('designation') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'designation')}
                              title="Click to search in Designation"
                            >
                              {renderCellText(r.ct.designation || '—', 'designation')}
                            </td>
                          )}
                          {visibleColumns.includes('mobile') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'mobile')}
                              title="Click to search in Mobile"
                            >
                              {renderCellText(r.ct.mobile || '—', 'mobile')}
                            </td>
                          )}
                          {visibleColumns.includes('email') && (
                            <td 
                              className="contact-email hit" 
                              title={r.ct.email}
                              onClick={(e) => handleCellClick(e, 'email')}
                            >
                              {renderCellText(r.ct.email || '—', 'email')}
                            </td>
                          )}
                          {visibleColumns.includes('key_person') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'key_person')}
                              title="Click to search in Key Person"
                            >
                              {renderCellText(r.ct.key_person || '—', 'key_person')}
                            </td>
                          )}
                          {visibleColumns.includes('user_name') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'user_name')}
                              title="Click to search in Sales User"
                            >
                              {renderCellText(r.ct.user_name || '—', 'user_name')}
                            </td>
                          )}
                          {visibleColumns.includes('stage') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'stage')}
                              title="Click to search in Stage"
                            >
                              <span className={`stage ${STAGE_CLASS[r.stage]}`}>{r.stage}</span>
                            </td>
                          )}
                          {visibleColumns.includes('mascon_remarks') && (
                            <td 
                              className="contact-remarks hit" 
                              title={r.ct.mascon_remarks}
                              onClick={(e) => handleCellClick(e, 'mascon_remarks')}
                            >
                              {renderCellText(r.ct.mascon_remarks || '—', 'mascon_remarks')}
                            </td>
                          )}
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
                                  <div className="facts">
                                    <div className="fact">
                                      <span className="k">Company Name</span>
                                      <span className="v">{r.company.company_name || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Industry</span>
                                      <span className="v">{r.company.industry_type || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">City & State</span>
                                      <span className="v">{r.company.city ? `${r.company.city}, ${r.company.state || ''}` : '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Present ERP</span>
                                      <span className="v">{r.company.erp_using || '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Source</span>
                                      <span className="v">{r.company.data_source || '—'}</span>
                                    </div>
                                  </div>
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
