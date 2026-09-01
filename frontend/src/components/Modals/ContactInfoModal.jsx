import React from 'react';
import { X, UserCheck, Key, Edit, Trash2, Plus } from 'lucide-react';
import './ContactInfoModal.css';

export default function ContactInfoModal({
  isOpen,
  onClose,
  company,
  contacts = [],
  onAddContact,
  onEditContact,
  onDeleteContact
}) {
  if (!isOpen || !company) return null;

  const companyContacts = contacts.filter(c => c.mascom_id === company.mascom_id);
  const activeCount = companyContacts.length; // All active contacts

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content contact-info-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Contact Info <span className="modal-company-sub">{company.company_name}</span></h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="contact-table-wrap">
            <table className="contact-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>KEY</th>
                  <th>NAME</th>
                  <th>DESIGNATION</th>
                  <th>MOBILE</th>
                  <th style={{ width: '70px' }}>ACTIVE</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {companyContacts.length > 0 ? (
                  companyContacts.map((cont) => {
                    const isKey = cont.key_person === 'Y' || cont.key_person === 'Yes';
                    return (
                      <tr key={cont.mascon_id || cont.contact_name}>
                        <td style={{ textAlign: 'center' }}>
                          {isKey ? (
                            <span className="key-icon-badge" title="Key Person">
                              <Key size={12} />
                            </span>
                          ) : (
                            <span className="normal-user-icon" title="Contact Person">
                              <UserCheck size={12} />
                            </span>
                          )}
                        </td>
                        <td className="cname-cell">{cont.contact_name}</td>
                        <td className="desig-cell">{cont.designation || '—'}</td>
                        <td className="mono mobile-cell">{cont.mobile || '—'}</td>
                        <td>
                          <span className="active-pill-yes">Yes</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="contact-row-actions">
                            <button
                              type="button"
                              className="abtn mini-edit-btn"
                              onClick={() => onEditContact && onEditContact(cont)}
                              title="Edit Contact"
                            >
                              <Edit size={11} /> Edit
                            </button>
                            {onDeleteContact && (
                              <button
                                type="button"
                                className="abtn mini-delete-btn"
                                onClick={() => onDeleteContact(cont)}
                                title="Delete Contact"
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No contacts recorded for {company.company_name} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="contact-modal-add-row">
            <button
              type="button"
              className="btn btn-success contact-add-btn"
              onClick={() => onAddContact && onAddContact(company)}
            >
              <Plus size={13} /> Add Contact
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="modal-foot-info">
            {companyContacts.length} contact(s) · {activeCount} active
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
