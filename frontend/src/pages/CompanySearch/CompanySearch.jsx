/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { Building2, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Loading from '../../components/Loading/Loading';
import * as companyService from '../../services/companyService';
import * as contactService from '../../services/contactService';
import { MASCOM_SEED, MASCON_SEED, TRACOM_SEED } from '../../utils/activityData';
import './CompanySearch.css';

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

  // Dynamic filter slots config
  const [filter1Col, setFilter1Col] = useState('industry_type');
  const [filter2Col, setFilter2Col] = useState('state');
  const [filter3Col, setFilter3Col] = useState('data_source');

  const [filter1Val, setFilter1Val] = useState('');
  const [filter2Val, setFilter2Val] = useState('');
  const [filter3Val, setFilter3Val] = useState('');

  // Infinite Scroll & Sorting
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState('mascom_id');
  const [sortAsc, setSortAsc] = useState(true);

  // Accordion open state (Only one row open at a time)
  const [openRowId, setOpenRowId] = useState(null);

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

  // Header click handler toggles search mode and binds Filter Slot 1
  const handleHeaderClick = (field) => {
    if (searchModeColumn === field) {
      setSearchModeColumn(null);
    } else {
      setSearchModeColumn(field);
      setFilter1Col(field);
      setFilter1Val('');
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
  const getUniqueOptionsForColumn = (field) => {
    const vals = fullRows.map((r) => getPropValue(r, field)).filter(Boolean);
    return [...new Set(vals)].sort();
  };

  const filter1Options = getUniqueOptionsForColumn(filter1Col);
  const filter2Options = getUniqueOptionsForColumn(filter2Col);
  const filter3Options = getUniqueOptionsForColumn(filter3Col);

  // Apply filters
  const filteredRows = fullRows.filter((r) => {
    // 1. Dynamic Filters
    const val1 = getPropValue(r, filter1Col);
    const match1 = !filter1Val || String(val1).toLowerCase() === filter1Val.toLowerCase();

    const val2 = getPropValue(r, filter2Col);
    const match2 = !filter2Val || String(val2).toLowerCase() === filter2Val.toLowerCase();

    const val3 = getPropValue(r, filter3Col);
    const match3 = !filter3Val || String(val3).toLowerCase() === filter3Val.toLowerCase();

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

    return match1 && match2 && match3 && matchesSearch;
  });

  const handleRowClick = (co) => {
    if (openRowId === co.mascom_id) {
      setOpenRowId(null);
      setSearchQuery('');
    } else {
      setOpenRowId(co.mascom_id);
      setSearchQuery(co.company_name);
    }
  };

  // Sorting & Infinite Scroll Slice
  const sortedRows = [...filteredRows].sort((a, b) => {
    let valA = getPropValue(a, sortField);
    let valB = getPropValue(b, sortField);
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const paginatedRows = sortedRows.slice(0, visibleCount);

  const renderSortableHeader = (field, label) => {
    const isSearchActive = searchModeColumn === field;
    const isSorted = sortField === field;
    return (
      <th 
        className={`clickable-header ${isSearchActive ? 'active-search-header' : ''}`}
        onClick={() => handleHeaderClick(field)}
        title="Click for generic search"
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchModeColumn(null);
    setFilter1Col('industry_type');
    setFilter2Col('state');
    setFilter3Col('data_source');
    setFilter1Val('');
    setFilter2Val('');
    setFilter3Val('');
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

  const getPluralLabel = (label) => {
    if (label === 'Industry') return 'Industries';
    if (label === 'Company') return 'Companies';
    if (label === 'Category') return 'Categories';
    return `${label}s`;
  };

  return (
    <div className="company-search-page">
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

      {/* Reordered Toolbar: Selects First, then Search */}
      <div className="cs-toolbar-row">
        {/* Dropdown 1 */}
        <div className="cs-filters">
          <div className="dynamic-filter-wrapper">
            <select className="dynamic-col-select" value={filter1Col} onChange={(e) => { setFilter1Col(e.target.value); setFilter1Val(''); }}>
              {Object.entries(COLUMN_LABEL_MAP).map(([field, label]) => (
                <option key={field} value={field}>{label}</option>
              ))}
            </select>
            <select value={filter1Val} onChange={(e) => setFilter1Val(e.target.value)}>
              <option value="">All {getPluralLabel(COLUMN_LABEL_MAP[filter1Col])}</option>
              {filter1Options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Dropdown 2 */}
          <div className="dynamic-filter-wrapper">
            <select className="dynamic-col-select" value={filter2Col} onChange={(e) => { setFilter2Col(e.target.value); setFilter2Val(''); }}>
              {Object.entries(COLUMN_LABEL_MAP).map(([field, label]) => (
                <option key={field} value={field}>{label}</option>
              ))}
            </select>
            <select value={filter2Val} onChange={(e) => setFilter2Val(e.target.value)}>
              <option value="">All {getPluralLabel(COLUMN_LABEL_MAP[filter2Col])}</option>
              {filter2Options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Dropdown 3 */}
          <div className="dynamic-filter-wrapper">
            <select className="dynamic-col-select" value={filter3Col} onChange={(e) => { setFilter3Col(e.target.value); setFilter3Val(''); }}>
              {Object.entries(COLUMN_LABEL_MAP).map(([field, label]) => (
                <option key={field} value={field}>{label}</option>
              ))}
            </select>
            <select value={filter3Val} onChange={(e) => setFilter3Val(e.target.value)}>
              <option value="">All {getPluralLabel(COLUMN_LABEL_MAP[filter3Col])}</option>
              {filter3Options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* Single General Search input supporting column search toggling */}
        <div className="cs-search-box">
          <Search size={13} className="cs-search-icon" />
          <input
            id="search-input"
            type="text"
            className={`cs-search-input ${searchModeColumn ? 'active-col-search' : ''}`}
            placeholder={searchModeColumn ? `Search by ${COLUMN_LABEL_MAP[searchModeColumn]}...` : "General Search..."}
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

        {/* Reusable Styled Green and Red buttons */}
        <button className="btn btn-success" type="button" onClick={() => { if (filteredRows.length > 0) { setOpenRowId(filteredRows[0].co.mascom_id); setSearchQuery(filteredRows[0].co.company_name); } }}>
          Expand row
        </button>
        <button className="btn btn-danger" type="button" onClick={() => { setOpenRowId(null); setSearchQuery(''); }}>
          Collapse all
        </button>

        <div className="cs-toolbar-actions">
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
              className="company-table-container"
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
                    <th style={{ width: '30px' }}></th>
                    {renderSortableHeader('mascom_id', 'Code')}
                    {renderSortableHeader('company_name', 'Company Name')}
                    {renderSortableHeader('industry_type', 'Industry')}
                    {renderSortableHeader('city', 'City')}
                    {renderSortableHeader('state', 'State')}
                    {renderSortableHeader('data_source', 'Source')}
                    {renderSortableHeader('erp_using', 'ERP Used')}
                    {renderSortableHeader('key_person', 'Key Person')}
                    {renderSortableHeader('stage', 'Stage')}
                    {renderSortableHeader('mascom_remarks', 'Remarks')}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((r, idx) => {
                    const isExpanded = openRowId === r.co.mascom_id;

                    return (
                      <React.Fragment key={r.co.mascom_id}>
                        <tr 
                          className={`master-row ${isExpanded ? 'open-row' : ''} ${idx % 2 === 1 ? 'even-row' : 'odd-row'} clickable-row`}
                          onClick={() => handleRowClick(r.co)}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <span className="twisty-icon">▶</span>
                          </td>
                          <td className="company-id">{r.co.mascom_id}</td>
                          <td className="company-name">{r.co.company_name}</td>
                          <td>{r.co.industry_type}</td>
                          <td>{r.co.city}</td>
                          <td>{r.co.state}</td>
                          <td>{r.co.data_source}</td>
                          <td>{r.co.erp_using || '—'}</td>
                          <td>{r.key.contact_name || '—'}</td>
                          <td>
                            <span className={`stage ${STAGE_CLASS[r.stage]}`}>{r.stage}</span>
                          </td>
                          <td className="company-remarks" title={r.co.mascom_remarks}>
                            {r.co.mascom_remarks || '—'}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="detail">
                            <td colSpan="11" className="detail-cell">
                              <div className="detail-box">
                                {/* Company Info */}
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
                                      <span className="k">Industry</span>
                                      <span className="v">{r.co.industry_type}</span>
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
                                      <span className="k">Demo Date</span>
                                      <span className="v">{r.firstDemo ? `${fmtDate(r.firstDemo.demo_date)} · ${r.firstDemo.demo_time || ''}` : '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Quoted Price</span>
                                      <span className="v money">{r.lastQuote ? money(r.lastQuote.price_quoted) : '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">AMC Quote</span>
                                      <span className="v money">{r.lastQuote ? money(r.lastQuote.amc_quoted) : '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Invoice Sent</span>
                                      <span className="v">{r.invoice ? fmtDate(r.invoice.tracom_date) : '—'}</span>
                                    </div>
                                    <div className="fact">
                                      <span className="k">Touchpoints</span>
                                      <span className="v">{r.acts.length}</span>
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
                                    <span className="t">Contacts</span>
                                    <span className="src">MASCON · {r.contacts.length} record(s)</span>
                                  </div>
                                  <table className="sub">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '70px' }}>Code</th>
                                        <th style={{ width: '180px' }}>Name</th>
                                        <th style={{ width: '150px' }}>Designation</th>
                                        <th style={{ width: '110px' }}>Mobile</th>
                                        <th style={{ width: '230px' }}>E-mail</th>
                                        <th>Remarks</th>
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
                                            <td className="mono">{ct.email || '—'}</td>
                                            <td className="muted">{ct.mascon_remarks || '—'}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="6" className="dim" style={{ textAlign: 'center', padding: '12px' }}>
                                            No contact persons recorded.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Activity Rail Timeline */}
                                <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Activity History</span>
                                    <span className="src">TRACOM · {r.acts.length} logs · latest first</span>
                                  </div>
                                  <div className="rail">
                                    {[...r.acts].reverse().map((act) => {
                                      const ctPerson = r.contacts.find((x) => x.mascon_id === act.mascon_id) || {};
                                      const isDue = act.followup_date && new Date(act.followup_date) >= new Date();
                                      return (
                                        <div key={act.tracom_id} className={`evt k-${act.mode.toLowerCase()}`}>
                                          <div className="gutter">
                                            <span className="node"></span>
                                            <span className="date">{fmtDate(act.tracom_date)}</span>
                                            <span className="time">{act.tracom_id}</span>
                                          </div>
                                          <div className="body">
                                            <div className="head">
                                              <span className="kind">{act.mode}</span>
                                              <span className="who">
                                                with <b>{ctPerson.contact_name || '—'}</b> · by {act.user_name}
                                              </span>
                                            </div>
                                            <div className="note">{act.remarks}</div>
                                            {(act.demo_date || act.price_quoted != null || act.amc_quoted != null) && (
                                              <div className="meta">
                                                {act.demo_date && <span><i>demo</i> {fmtDate(act.demo_date)} {act.demo_time || ''} {act.demo_mode ? `· ${act.demo_mode}` : ''}</span>}
                                                {act.price_quoted != null && <span><i>price</i> {money(act.price_quoted)}</span>}
                                                {act.amc_quoted != null && <span><i>amc</i> {money(act.amc_quoted)}</span>}
                                              </div>
                                            )}
                                          </div>
                                          <div className={`fu ${isDue ? 'due' : ''}`}>
                                            <span className="lbl">Follow-up</span>
                                            {act.followup_date ? (
                                              <span className="val">{fmtDate(act.followup_date)} · {act.followup_time || ''}</span>
                                            ) : (
                                              <span className="val">—</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {!r.acts.length && (
                                      <div className="empty">No interactions registered yet.</div>
                                    )}
                                  </div>
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
                      <td colSpan="11">
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
    </div>
  );
};

export default CompanySearch;
