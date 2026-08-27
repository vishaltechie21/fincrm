/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { User, FileSpreadsheet, Search, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Loading from '../../components/Loading/Loading';
import * as companyService from '../../services/companyService';
import * as contactService from '../../services/contactService';
import { MASCOM_SEED, MASCON_SEED, TRACOM_SEED } from '../../utils/activityData';
import './ContactSearch.css';

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

  // Dynamic filter slots config
  const [filter1Col, setFilter1Col] = useState('designation');
  const [filter2Col, setFilter2Col] = useState('key_person');
  const [filter3Col, setFilter3Col] = useState('user_name');

  const [filter1Val, setFilter1Val] = useState('');
  const [filter2Val, setFilter2Val] = useState('');
  const [filter3Val, setFilter3Val] = useState('');

  // Accordion open state (Only one row open at a time)
  const [openRowId, setOpenRowId] = useState(null);

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

  const handleRowClick = (ct) => {
    if (openRowId === ct.mascon_id) {
      setOpenRowId(null);
      setSearchQuery('');
    } else {
      setOpenRowId(ct.mascon_id);
      setSearchQuery(ct.contact_name);
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchModeColumn(null);
    setFilter1Col('designation');
    setFilter2Col('key_person');
    setFilter3Col('user_name');
    setFilter1Val('');
    setFilter2Val('');
    setFilter3Val('');
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

  const getPluralLabel = (label) => {
    if (label === 'Industry') return 'Industries';
    if (label === 'Company') return 'Companies';
    if (label === 'Category') return 'Categories';
    return `${label}s`;
  };

  return (
    <div className="contact-search-page">
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
        <button className="btn btn-success" type="button" onClick={() => { if (filteredRows.length > 0) { setOpenRowId(filteredRows[0].ct.mascon_id); setSearchQuery(filteredRows[0].ct.contact_name); } }}>
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
              className="contact-table-container"
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
                    <th style={{ width: '30px' }}></th>
                    {renderSortableHeader('mascon_id', 'Code')}
                    {renderSortableHeader('company_name', 'Company')}
                    {renderSortableHeader('contact_name', 'Contact Name')}
                    {renderSortableHeader('designation', 'Designation')}
                    {renderSortableHeader('mobile', 'Mobile')}
                    {renderSortableHeader('email', 'Email')}
                    {renderSortableHeader('key_person', 'Key Person')}
                    {renderSortableHeader('user_name', 'Sales User')}
                    {renderSortableHeader('stage', 'Stage')}
                    {renderSortableHeader('mascon_remarks', 'Remarks')}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((r, idx) => {
                    const isExpanded = openRowId === r.ct.mascon_id;

                    return (
                      <React.Fragment key={r.ct.mascon_id}>
                        <tr 
                          className={`master-row ${isExpanded ? 'open-row' : ''} ${idx % 2 === 1 ? 'even-row' : 'odd-row'} clickable-row`}
                          onClick={() => handleRowClick(r.ct)}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <span className="twisty-icon">▶</span>
                          </td>
                          <td className="contact-id">{r.ct.mascon_id}</td>
                          <td className="company-name">{r.company.company_name || r.ct.mascom_id}</td>
                          <td>
                            <b>{r.ct.contact_name}</b>
                            {r.ct.key_person && <span className="keyflag">KEY</span>}
                          </td>
                          <td>{r.ct.designation || '—'}</td>
                          <td>{r.ct.mobile || '—'}</td>
                          <td>{r.ct.email || '—'}</td>
                          <td>{r.ct.key_person || '—'}</td>
                          <td>{r.ct.user_name || '—'}</td>
                          <td>
                            <span className={`stage ${STAGE_CLASS[r.stage]}`}>{r.stage}</span>
                          </td>
                          <td className="contact-remarks" title={r.ct.mascon_remarks}>
                            {r.ct.mascon_remarks || '—'}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="detail">
                            <td colSpan="11" className="detail-cell">
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

                                {/* Activity History */}
                                <div className="sec">
                                  <div className="sec-h">
                                    <span className="t">Activity History</span>
                                    <span className="src">TRACOM · {r.acts.length} logs · latest first</span>
                                  </div>
                                  <div className="rail">
                                    {[...r.acts].reverse().map((act) => {
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
                                                by {act.user_name}
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

export default ContactSearch;
