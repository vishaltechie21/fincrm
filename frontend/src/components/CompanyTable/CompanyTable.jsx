import './CompanyTable.css';

const CompanyTable = ({ companies, onEdit, activeId, onRowDoubleClick, onLoadMore, sortField, sortAsc, onSort }) => {
  if (!companies || companies.length === 0) {
    return (
      <div className="table-empty-state">
        <p>No companies found. Add a new company above or adjust your search.</p>
      </div>
    );
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled near the bottom (within 15px)
    if (scrollHeight - scrollTop - clientHeight < 15) {
      if (onLoadMore) {
        onLoadMore();
      }
    }
  };

  const renderHeader = (field, label) => {
    if (!onSort) return <th>{label}</th>;
    const isSorted = sortField === field;
    return (
      <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {label}
          <span style={{ fontSize: '8px', color: isSorted ? '#c9973c' : 'var(--muted)' }}>
            {isSorted ? (sortAsc ? '▲' : '▼') : '⇅'}
          </span>
        </span>
      </th>
    );
  };

  return (
    <div className="company-table-container" onScroll={handleScroll}>
      <table className="company-table">
        <thead>
          <tr>
            {renderHeader('mascom_id', 'ID')}
            {renderHeader('company_name', 'Company Name')}
            {renderHeader('industry_type', 'Industry')}
            {renderHeader('city', 'City')}
            {renderHeader('state', 'State')}
            {renderHeader('data_source', 'Source')}
            {renderHeader('erp_using', 'ERP Used')}
            {renderHeader('user_name', 'Key Person')}
            {renderHeader('stage', 'Stage')}
            {renderHeader('mascom_remarks', 'Remarks')}
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
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
              <td className="company-id">{company.mascom_id}</td>
              <td className="company-name">{company.company_name}</td>
              <td>{company.industry_type}</td>
              <td>{company.city}</td>
              <td>{company.state}</td>
              <td>
                <span className="badge badge-source">{company.data_source}</span>
              </td>
              <td>{company.erp_using || '—'}</td>
              <td>{company.user_name || '—'}</td>
              <td>{company.stage || '—'}</td>
              <td className="company-remarks" title={company.mascom_remarks}>
                {company.mascom_remarks || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
