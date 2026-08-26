import './ContactTable.css';

const ContactTable = ({ contacts, onEdit, activeId, onRowDoubleClick, onLoadMore }) => {
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

  return (
    <div className="contact-table-container" onScroll={handleScroll}>
      <table className="contact-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Contact Name</th>
            <th>Designation</th>
            <th>Mobile</th>
            <th>Email</th>
            <th className="key-header">Key</th>
            <th>Sales User</th>
            <th>Remarks</th>
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
              <td className="key-cell">
                <span className={`badge ${contact.key_person === 'Y' ? 'badge-key-yes' : 'badge-key-no'}`}>
                  {contact.key_person}
                </span>
              </td>
              <td>{contact.user_name}</td>
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
