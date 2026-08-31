/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
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
  mascom_id: 'Code',
  company_name: 'Company Name',
  industry_type: 'Industry',
  city: 'City',
  state: 'State',
  data_source: 'Source',
  erp_using: 'ERP Used',
  key_person: 'Key Person',
  stage: 'Stage',
  mascom_remarks: 'Remarks'
};

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
  const [visibleColumns, setVisibleColumns] = useState(Object.keys(COLUMN_LABEL_MAP));
  const [activeFilters, setActiveFilters] = useState([]);
  const [hasSavedSettings, setHasSavedSettings] = useState(false);

  // Selection Checkbox State (Set of mascom_id keys)
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Accordion expanded row IDs (Set of mascom_id keys)
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

  // Infinite Scroll & Sorting
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState('mascom_id');
  const [sortAsc, setSortAsc] = useState(true);
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

  // Resolve values helper
  const getPropValue = (row, field) => {
    if (!row) return '';
    if (field === 'key_person') return row.key?.contact_name || '';
    if (field === 'stage') return row.stage || '';
    if (row.co && row.co[field] !== undefined) return row.co[field];
    if (row[field] !== undefined) return row[field];
    return '';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
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
            {isSorted ? (sortAsc ? '▲' : '▼') : '⇅'}
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

  // Pre-calculate full company rows
  const fullRows = companies.map((co) => {
    const companyContacts = contacts.filter((c) => c.mascom_id === co.mascom_id);
    const companyActs = TRACOM_SEED.filter((t) => t.mascom_id === co.mascom_id)
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
      setVisibleColumns(Object.keys(COLUMN_LABEL_MAP));
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
            className={`btn ${searchModeColumn ? 'btn-success' : 'btn-secondary'}`}
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
            setSearchQuery('');
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
              className={`company-table-container ${isFixedHeader ? 'fixed-header-active' : ''}`}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop - clientHeight < 20) {
                  setVisibleCount((prev) => prev + 50);
                }
              }}
            >
              <table className="company-table">
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
                              setSortAsc(prev => !prev);
                            } else {
                              setSortField('selection');
                              setSortAsc(true);
                            }
                          }}
                          style={{ cursor: 'pointer', opacity: sortField === 'selection' ? 1 : 0.4, fontSize: '10px' }}
                          title="Sort selected first/last"
                        >
                          {sortField === 'selection' ? (sortAsc ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th style={{ width: '30px' }}></th>
                    {visibleColumns.includes('mascom_id') && renderSortableHeader('mascom_id', 'Code')}
                    {visibleColumns.includes('company_name') && renderSortableHeader('company_name', 'Company Name')}
                    {visibleColumns.includes('industry_type') && renderSortableHeader('industry_type', 'Industry')}
                    {visibleColumns.includes('city') && renderSortableHeader('city', 'City')}
                    {visibleColumns.includes('state') && renderSortableHeader('state', 'State')}
                    {visibleColumns.includes('data_source') && renderSortableHeader('data_source', 'Source')}
                    {visibleColumns.includes('erp_using') && renderSortableHeader('erp_using', 'ERP Used')}
                    {visibleColumns.includes('key_person') && renderSortableHeader('key_person', 'Key Person')}
                    {visibleColumns.includes('stage') && renderSortableHeader('stage', 'Stage')}
                    {visibleColumns.includes('mascom_remarks') && renderSortableHeader('mascom_remarks', 'Remarks')}
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
                           {visibleColumns.includes('mascom_id') && (
                            <td 
                              className="company-id hit" 
                              onClick={(e) => handleCellClick(e, 'mascom_id')}
                              title="Click to search in Code"
                            >
                              {renderCellText(r.co.mascom_id, 'mascom_id')}
                            </td>
                          )}
                          {visibleColumns.includes('company_name') && (
                            <td 
                              className="company-name hit" 
                              onClick={(e) => handleCellClick(e, 'company_name')}
                              title="Click to search in Company Name"
                            >
                              {renderCellText(r.co.company_name, 'company_name')}
                            </td>
                          )}
                          {visibleColumns.includes('industry_type') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'industry_type')}
                              title="Click to search in Industry"
                            >
                              {renderCellText(r.co.industry_type, 'industry_type')}
                            </td>
                          )}
                          {visibleColumns.includes('city') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'city')}
                              title="Click to search in City"
                            >
                              {renderCellText(r.co.city, 'city')}
                            </td>
                          )}
                          {visibleColumns.includes('state') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'state')}
                              title="Click to search in State"
                            >
                              {renderCellText(r.co.state, 'state')}
                            </td>
                          )}
                          {visibleColumns.includes('data_source') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'data_source')}
                              title="Click to search in Source"
                            >
                              {renderCellText(r.co.data_source, 'data_source')}
                            </td>
                          )}
                          {visibleColumns.includes('erp_using') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'erp_using')}
                              title="Click to search in ERP Used"
                            >
                              {renderCellText(r.co.erp_using || '—', 'erp_using')}
                            </td>
                          )}
                          {visibleColumns.includes('key_person') && (
                            <td 
                              className="hit" 
                              onClick={(e) => handleCellClick(e, 'key_person')}
                              title="Click to search in Key Person"
                            >
                              {renderCellText(r.key.contact_name || '—', 'key_person')}
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
                          {visibleColumns.includes('mascom_remarks') && (
                            <td 
                              className="company-remarks hit" 
                              title={r.co.mascom_remarks}
                              onClick={(e) => handleCellClick(e, 'mascom_remarks')}
                            >
                              {renderCellText(r.co.mascom_remarks || '—', 'mascom_remarks')}
                            </td>
                          )}
                        </tr>

                        {isExpanded && (
                          <tr className="detail">
                            <td colSpan={visibleColumns.length + 2} className="detail-cell">
                              <div className="detail-box">
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

export default CompanySearch;
