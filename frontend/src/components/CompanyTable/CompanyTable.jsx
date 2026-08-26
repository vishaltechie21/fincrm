import './CompanyTable.css';

const CompanyTable = ({ companies, onEdit, activeId, onRowDoubleClick, onLoadMore }) => {
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

  return (
    <div className="company-table-container" onScroll={handleScroll}>
      <table className="company-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company Name</th>
            <th>Industry</th>
            <th>City</th>
            <th>State</th>
            <th>Source</th>
            <th>ERP Used</th>
            <th>Key Person</th>
            <th>Stage</th>
            <th>Remarks</th>
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
