import React from 'react';
import './CompanyTable.css';

const CompanyTable = ({ companies, onEdit, onDelete, activeId, onRowDoubleClick }) => {
  if (!companies || companies.length === 0) {
    return (
      <div className="table-empty-state">
        <p>No companies found. Add a new company above or adjust your search.</p>
      </div>
    );
  }

  return (
    <div className="company-table-container">
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
            <th>User</th>
            <th>Remarks</th>
            <th style={{ width: '120px' }}>Actions</th>
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
              <td>{company.user_name}</td>
              <td className="company-remarks" title={company.mascom_remarks}>
                {company.mascom_remarks || '—'}
              </td>
              <td className="actions-cell">
                <div className="actions-wrapper">
                  <button
                    type="button"
                    className="small-btn edit-btn"
                    onClick={() => onEdit(company)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="small-btn delete-btn"
                    onClick={() => onDelete(company.mascom_id)}
                  >
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTable;
