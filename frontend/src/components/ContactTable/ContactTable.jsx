/**
 * ContactTable — column config wrapper around DataTable.
 * All table logic (resize, sort, drag, scroll) lives in DataTable.
 * This file only defines WHAT columns exist and HOW each cell renders.
 */
import React from 'react';
import DataTable from '../DataTable/DataTable';

const COLUMNS = [
  {
    key: 'mascon_id',
    label: 'ID',
    width: 90,
    cellClass: 'contact-id',
    render: (row) => row.mascon_id,
  },
  {
    key: 'company_name',
    label: 'Company',
    width: 180,
    cellClass: 'company-name',
    render: (row) => row.company_name || row.mascom_id || '—',
  },
  {
    key: 'contact_name',
    label: 'Contact Name',
    width: 160,
    cellClass: 'contact-name',
    render: (row) => row.contact_name || '—',
  },
  {
    key: 'designation',
    label: 'Designation',
    width: 140,
    render: (row) => row.designation || '—',
  },
  {
    key: 'mobile',
    label: 'Mobile',
    width: 110,
    render: (row) => row.mobile || '—',
  },
  {
    key: 'email',
    label: 'Email',
    width: 200,
    cellClass: 'contact-email',
    getTitle: (row) => row.email,
    render: (row) => row.email || '—',
  },
  {
    key: 'key_person',
    label: 'Key Person',
    width: 90,
    render: (row) => row.key_person || '—',
  },
  {
    key: 'user_name',
    label: 'Sales User',
    width: 110,
    render: (row) => row.user_name || '—',
  },
  {
    key: 'stage',
    label: 'Stage',
    width: 90,
    render: (row) => row.stage || '—',
  },
  {
    key: 'mascon_remarks',
    label: 'Remarks',
    width: 200,
    cellClass: 'contact-remarks',
    getTitle: (row) => row.mascon_remarks,
    render: (row) => row.mascon_remarks || '—',
  },
];

const ContactTable = ({
  contacts,
  onEdit,
  onDelete,
  activeId,
  onRowDoubleClick,
  onLoadMore,
  sortField,
  sortAsc,
  onSort,
}) => (
  <DataTable
    columns={COLUMNS}
    data={contacts}
    storageKey="contact_table"
    idField="mascon_id"
    activeId={activeId}
    sortField={sortField}
    sortAsc={sortAsc}
    onSort={onSort}
    onRowClick={onEdit}
    onRowDoubleClick={onRowDoubleClick}
    onLoadMore={onLoadMore}
    emptyMessage="No contacts found. Add a new contact above or adjust your search."
  />
);

export default ContactTable;
