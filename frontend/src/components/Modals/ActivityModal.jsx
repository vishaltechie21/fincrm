import { useState } from 'react';
import { X, Plus, Calendar, User, MessageSquare } from 'lucide-react';
import './ActivityModal.css';

export default function ActivityModal({ isOpen, onClose, company, onAddRemark }) {
  const [newRemark, setNewRemark] = useState('');
  const [mode, setMode] = useState('Call');

  if (!isOpen || !company) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;
    onAddRemark && onAddRemark(company.mascom_id, newRemark.trim(), mode);
    setNewRemark('');
  };

  const remarksList = company.remarksList || company.acts || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Activity Info</h3>
            <span className="modal-header-sub">MASCOM · {company.mascom_id} — {company.company_name}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Add Remark Form */}
          <form className="activity-form" onSubmit={handleAdd}>
            <div className="activity-form-row">
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value)}
                className="activity-mode-select"
              >
                <option value="Call">Call</option>
                <option value="Demo">Demo</option>
                <option value="Visit">Visit</option>
                <option value="Email">Email</option>
                <option value="Quotation">Quotation</option>
                <option value="Note">Note</option>
              </select>
              <input 
                type="text" 
                placeholder="Write a new activity remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                className="activity-input"
              />
              <button type="submit" className="activity-add-btn">
                <Plus size={15} /> Add Remark
              </button>
            </div>
          </form>

          {/* Remarks History Table */}
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode / Type</th>
                  <th>Remarks</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {remarksList.length > 0 ? (
                  remarksList.map((item, idx) => (
                    <tr key={idx}>
                      <td className="mono"><Calendar size={12} /> {item.date || '—'}</td>
                      <td><span className={`mode-badge ${item.mode?.toLowerCase()}`}>{item.mode || 'Remark'}</span></td>
                      <td className="rem-cell"><MessageSquare size={12} /> {item.remarks || item.text}</td>
                      <td className="muted"><User size={12} /> {item.user_name || item.user || 'Suman'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="no-data">
                      {company.mascom_remarks ? (
                        <div className="initial-remark">
                          <strong>Initial Remark:</strong> {company.mascom_remarks}
                        </div>
                      ) : 'No recorded activity remarks for this company yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-foot-info">{remarksList.length} activity record(s)</span>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
