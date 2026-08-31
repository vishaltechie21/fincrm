/**
 * CompanyTable — column config wrapper around DataTable.
 * All table logic (resize, sort, drag, scroll) lives in DataTable.
 * This file only defines WHAT columns exist and HOW each cell renders.
 */
import React from 'react';
import DataTable from '../DataTable/DataTable';

const COLUMNS = [
  {
    key: 'mascom_id',
    label: 'ID',
    width: 90,
    cellClass: 'company-id',
    render: (row) => row.mascom_id,
  },
  {
    key: 'company_name',
    label: 'Company Name',
    width: 220,
    cellClass: 'company-name',
    render: (row) => row.company_name || '—',
  },
  {
    key: 'industry_type',
    label: 'Industry',
    width: 130,
    render: (row) => row.industry_type || '—',
  },
  {
    key: 'city',
    label: 'City',
    width: 100,
    render: (row) => row.city || '—',
  },
  {
    key: 'state',
    label: 'State',
    width: 110,
    render: (row) => row.state || '—',
  },
  {
    key: 'data_source',
    label: 'Source',
    width: 110,
    render: (row) => row.data_source ? <span className="badge badge-source">{row.data_source}</span> : '—',
  },
  {
    key: 'erp_using',
    label: 'ERP Used',
    width: 100,
    render: (row) => row.erp_using || '—',
  },
  {
    key: 'user_name',
    label: 'Key Person',
    width: 120,
    render: (row) => row.user_name || '—',
  },
  {
    key: 'stage',
    label: 'Stage',
    width: 90,
    render: (row) => row.stage || '—',
  },
  {
    key: 'mascom_remarks',
    label: 'Remarks',
    width: 200,
    cellClass: 'company-remarks',
    getTitle: (row) => row.mascom_remarks,
    render: (row) => row.mascom_remarks || '—',
  },
];

const CompanyTable = ({
  companies,
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
    data={companies}
    storageKey="company_table"
    idField="mascom_id"
    activeId={activeId}
    sortField={sortField}
    sortAsc={sortAsc}
    onSort={onSort}
    onRowClick={onEdit}
    onRowDoubleClick={onRowDoubleClick}
    onLoadMore={onLoadMore}
    emptyMessage="No companies found. Add a new company above or adjust your search."
  />
);

export default CompanyTable;
