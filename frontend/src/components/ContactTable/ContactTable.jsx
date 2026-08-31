import React, { useState } from 'react';
import './ContactTable.css';

const COLUMN_LABEL_MAP = {
  mascon_id: 'ID',
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

const DEFAULT_ORDER = [
  'mascon_id',
  'company_name',
  'contact_name',
  'designation',
  'mobile',
  'email',
  'key_person',
  'user_name',
  'stage',
  'mascon_remarks'
];

const ContactTable = ({ contacts, onEdit, activeId, onRowDoubleClick, onLoadMore, sortField, sortAsc, onSort }) => {
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('contact_table_column_order');
    return saved ? JSON.parse(saved) : DEFAULT_ORDER;
  });

  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('contact_table_column_widths');
    return saved ? JSON.parse(saved) : {};
  });

  if (!contacts || contacts.length === 0) {
    return (
      <div className="table-empty-state">
        <p>No contacts found. Add a new contact above or adjust your search.</p>
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
      localStorage.setItem('contact_table_column_order', JSON.stringify(next));
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
        localStorage.setItem('contact_table_column_widths', JSON.stringify(next));
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
    <div className="contact-table-container" onScroll={handleScroll}>
      <table className="contact-table">
        <thead>
          <tr>
            {columnOrder.map((colKey) => renderHeader(colKey, COLUMN_LABEL_MAP[colKey]))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.mascon_id}
              className={`${activeId === contact.mascon_id ? 'active-row' : ''} clickable-row`}
              onClick={() => onEdit(contact)}
              onDoubleClick={() => {
                if (onRowDoubleClick) {
                  onRowDoubleClick(contact);
                } else {
                  onEdit(contact);
                }
              }}
            >
              {columnOrder.map((colKey) => {
                if (colKey === 'mascon_id') {
                  return <td key={colKey} className="contact-id">{contact.mascon_id}</td>;
                }
                if (colKey === 'company_name') {
                  return <td key={colKey} className="company-name">{contact.company_name || contact.mascom_id}</td>;
                }
                if (colKey === 'contact_name') {
                  return <td key={colKey} className="contact-name">{contact.contact_name}</td>;
                }
                if (colKey === 'email') {
                  return (
                    <td key={colKey} className="contact-email" title={contact.email}>
                      {contact.email || '—'}
                    </td>
                  );
                }
                if (colKey === 'mascon_remarks') {
                  return (
                    <td key={colKey} className="contact-remarks" title={contact.mascon_remarks}>
                      {contact.mascon_remarks || '—'}
                    </td>
                  );
                }
                return <td key={colKey}>{contact[colKey] || '—'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactTable;
