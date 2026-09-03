import { useState } from 'react';
import { X } from '../Icon';
import TruncatedText from '../TruncatedText/TruncatedText';
import './Modals.css';

export default function ActivityModal({ isOpen, onClose, company, onAddRemark, onUpdateRemark, onDeleteRemark }) {
  const [newRemark, setNewRemark] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  if (!isOpen || !company) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;
    if (editingIndex !== null) {
      onUpdateRemark && onUpdateRemark(company.mascom_id, editingIndex, newRemark.trim(), 'Call');
      setEditingIndex(null);
    } else {
      onAddRemark && onAddRemark(company.mascom_id, newRemark.trim(), 'Call');
    }
    setNewRemark('');
  };

  const handleStartEdit = (idx, item) => {
    setEditingIndex(idx);
    setNewRemark(item.remarks || item.text || '');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewRemark('');
  };

  const handleDelete = (idx) => {
    if (onDeleteRemark) {
      onDeleteRemark(company.mascom_id, idx);
    }
  };

  const remarksList = company.remarksList || company.acts || [];

  const formatDateDisplay = (rawDate) => {
    if (!rawDate) return new Date().toLocaleDateString('en-GB');
    const str = String(rawDate).slice(0, 10);
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content activity-modal" onClick={(e) => e.stopPropagation()}>
        {/* Compact Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Activity Info</h3>
            <span className="modal-header-sub">{company.company_name}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="act-modal-body">
          {/* Scrollable History Table */}
          <div className="act-table-wrap">
            <table className="act-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>DATE</th>
                  <th>REMARKS</th>
                  <th style={{ width: '110px' }}>BY USER</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {remarksList.length > 0 ? (
                  remarksList.map((item, idx) => {
                    const displayDate = formatDateDisplay(item.date || item.tracom_date);
                    const remarkText = item.remarks || item.text || '';
                    return (
                      <tr key={idx} className={editingIndex === idx ? 'active-edit-row' : ''}>
                        <td className="act-date-cell">{displayDate}</td>
                        <td className="act-rem-cell">
                          <TruncatedText text={remarkText} limit={40} />
                        </td>
                        <td className="act-user-cell">
                          <TruncatedText text={item.user_name || item.user || 'Suman'} limit={18} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="act-actions-group">
                            <button
                              type="button"
                              className="act-btn-outline"
                              onClick={() => handleStartEdit(idx, item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="act-btn-outline"
                              onClick={() => handleDelete(idx)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="act-no-data">
                      {company.mascom_remarks ? (
                        <div className="initial-remark">
                          <strong>Initial Remark:</strong> <TruncatedText text={company.mascom_remarks} limit={60} />
                        </div>
                      ) : 'No recorded activity remarks for this company yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Single-Line Add/Edit Form */}
          <form className="act-bottom-form" onSubmit={handleSubmit}>
            <div className="act-form-layout">
              <input
                type="text"
                placeholder={editingIndex !== null ? "Update remark..." : "Write a remark as Suman"}
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                className="act-input"
                maxLength={500}
              />
              {editingIndex !== null ? (
                <div className="act-edit-btn-row">
                  <button type="submit" className="act-btn-submit">
                    Update
                  </button>
                  <button type="button" className="act-btn-cancel" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="submit" className="act-btn-submit">
                  Add Remark
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Compact Footer */}
        <div className="act-modal-footer">
          <span className="act-foot-info">{remarksList.length} activity record(s)</span>
          <button type="button" className="act-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
