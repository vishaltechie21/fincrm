import React, { useState } from 'react';
import './CompanyTable.css';

const COLUMN_LABEL_MAP = {
  details:"Details",
  mascom_id: 'ID',
  company_name: 'Company Name',
  industry_type: 'Industry',
  city: 'City',
  state: 'State',
  data_source: 'Source',
  erp_using: 'ERP Used',
  user_name: 'Key Person',
  stage: 'Stage',
  mascom_remarks: 'Remarks'
};

const DEFAULT_ORDER = [
  'details',
  'mascom_id',
  'company_name',
  'industry_type',
  'city',
  'state',
  'data_source',
  'erp_using',
  'user_name',
  'stage',
  'mascom_remarks'
];

const CompanyTable = ({ companies, onEdit, activeId, onRowDoubleClick, onLoadMore, sortField, sortAsc, onSort }) => {
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('company_table_column_order');
    return saved ? JSON.parse(saved) : DEFAULT_ORDER;
  });

  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('company_table_column_widths');
    return saved ? JSON.parse(saved) : {};
  });

  if (!companies || companies.length === 0) {
    return (
      <div className="table-empty-state">
        <p>No companies found. Add a new company above or adjust your search.</p>
      </div>
    );
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 15) {
      if (onLoadMore) {
        onLoadMore();
      }
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

    setColumnOrder((prev) => {
      const next = [...prev];
      const draggedIdx = next.indexOf(draggedColKey);
      const targetIdx = next.indexOf(targetColKey);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, draggedColKey);
      }
      localStorage.setItem('company_table_column_order', JSON.stringify(next));
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
        localStorage.setItem('company_table_column_widths', JSON.stringify(next));
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

  const renderHeader = (field, label) => {
    if (!onSort) return <th style={{ width: columnWidths[field] ? `${columnWidths[field]}px` : undefined }}>{label}</th>;
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => onSort(field)} 
        style={{ 
          cursor: 'pointer', 
          userSelect: 'none',
          position: 'relative',
          width: columnWidths[field] ? `${columnWidths[field]}px` : undefined
        }} 
        className="sortable-header"
        draggable={true}
        onDragStart={(e) => handleDragStart(e, field)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, field)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {label}
          <span style={{ fontSize: '8px', color: isSorted ? '#c9973c' : 'var(--muted)' }}>
            {isSorted ? '▲' : '⇅'}
          </span>
        </span>
        <div 
          className="column-resizer" 
          onMouseDown={(e) => handleResizeStart(e, field)} 
          onClick={(e) => e.stopPropagation()} 
        />
      </th>
    );
  };

  return (
    <div className="company-table-container" onScroll={handleScroll}>
      <table className="company-table">
        <thead>
          <tr>
            {columnOrder.map((colKey) => renderHeader(colKey, COLUMN_LABEL_MAP[colKey]))}
          </tr>
        </thead>
        <tbody>
          {companies.map((  company) => (
            <tr
              key={company.mascom_id}
              className={`${activeId === company.mascom_id ? 'active-row' : ''} clickable-row`}
              onClick={() => onEdit(company)}
              onDoubleClick={() => {
                if (onRowDoubleClick) {
                  onRowDoubleClick(company);
                } else {
                  onEdit(company);
                }
              }}
            >
              {columnOrder.map((colKey) => {
                if (colKey === 'mascom_id') {
                  return <td key={colKey} className="company-id">{company.mascom_id}</td>;
                }
                if (colKey === 'company_name') {
                  return <td key={colKey} className="company-name">{company.company_name}</td>;
                }
                if (colKey === 'data_source') {
                  return (
                    <td key={colKey}>
                      <span className="badge badge-source">{company.data_source}</span>
                    </td>
                  );
                }
                if (colKey === 'mascom_remarks') {
                  return (
                    <td key={colKey} className="company-remarks" title={company.mascom_remarks}>
                      {company.mascom_remarks || '—'}
                    </td>
                  );
                }
                return <td key={colKey}>{company[colKey] || '—'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
