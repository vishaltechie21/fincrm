import './ContactTable.css';

const ContactTable = ({ contacts, onEdit, activeId, onRowDoubleClick, onLoadMore, sortField, sortAsc, onSort }) => {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="table-empty-state">
        <p>No contacts found. Add a new contact above or adjust your search.</p>
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
    <div className="contact-table-container" onScroll={handleScroll}>
      <table className="contact-table">
        <thead>
          <tr>
            {renderHeader('mascon_id', 'ID')}
            {renderHeader('company_name', 'Company')}
            {renderHeader('contact_name', 'Contact Name')}
            {renderHeader('designation', 'Designation')}
            {renderHeader('mobile', 'Mobile')}
            {renderHeader('email', 'Email')}
            {renderHeader('key_person', 'Key Person')}
            {renderHeader('user_name', 'Sales User')}
            {renderHeader('stage', 'Stage')}
            {renderHeader('mascon_remarks', 'Remarks')}
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
              <td className="contact-id">{contact.mascon_id}</td>
              <td className="company-name">{contact.company_name || contact.mascom_id}</td>
              <td className="contact-name">{contact.contact_name}</td>
              <td>{contact.designation || '—'}</td>
              <td>{contact.mobile || '—'}</td>
              <td className="contact-email" title={contact.email}>{contact.email || '—'}</td>
              <td>{contact.key_person || '—'}</td>
              <td>{contact.user_name || '—'}</td>
              <td>{contact.stage || '—'}</td>
              <td className="contact-remarks" title={contact.mascon_remarks}>
                {contact.mascon_remarks || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactTable;
