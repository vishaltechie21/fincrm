import React, { useState, useEffect } from 'react';
import { X } from '../Icon';
import { SALES_STEPS } from '../../utils/dashboardData';
import { masterService } from '../../services/masterService';
import './Modals.css';

export default function DashboardModal({ isOpen, onClose, company, onSaveDashboard }) {
  const [stepsList, setStepsList] = useState(SALES_STEPS);
  const [stepsData, setStepsData] = useState({});
  const [editingStep, setEditingStep] = useState(null);
  const [formDate, setFormDate] = useState('');
  const [formNextFollowupDate, setFormNextFollowupDate] = useState('');
  const [formStatus, setFormStatus] = useState('Pending');
  const [formRemarks, setFormRemarks] = useState('');
  const [formDoc, setFormDoc] = useState('');

  useEffect(() => {
    masterService.getDashboardSteps().then((dbSteps) => {
      if (Array.isArray(dbSteps) && dbSteps.length > 0) {
        const mapped = dbSteps.map(s => ({
          n: s.step_number,
          k: s.step_key,
          lab: s.step_name,
          resp: s.responsibility,
          note: s.note,
          doc: !!s.requires_doc
        }));
        setStepsList(mapped);
      }
    });
  }, []);

  useEffect(() => {
    if (company) {
      let initialData = {};
      if (company.dashboardData && typeof company.dashboardData === 'object') {
        initialData = company.dashboardData;
      } else if (company.dashboard_data) {
        try {
          initialData = typeof company.dashboard_data === 'string' ? JSON.parse(company.dashboard_data) : company.dashboard_data;
        } catch (e) {
          initialData = {};
        }
      }
      setStepsData(initialData || {});
    }
  }, [company]);

  if (!isOpen || !company) return null;

  const getStepVal = (k) => stepsData[k] || {};

  const handleRowClick = (k) => {
    if (editingStep === k) {
      setEditingStep(null);
      return;
    }
    const cur = getStepVal(k);
    setEditingStep(k);
    setFormDate(cur.date || new Date().toISOString().split('T')[0]);
    setFormNextFollowupDate(cur.nextFollowupDate || '');
    setFormStatus(cur.status || 'Pending');
    setFormRemarks(cur.remarks || '');
    setFormDoc(cur.doc || '');
  };

  const handleSaveStep = (k) => {
    const updated = {
      ...stepsData,
      [k]: {
        date: formDate,
        nextFollowupDate: formNextFollowupDate,
        status: formStatus,
        remarks: formRemarks,
        doc: formDoc
      }
    };
    setStepsData(updated);
    if (onSaveDashboard) {
      onSaveDashboard(company.mascom_id, updated);
    }
    setEditingStep(null);
  };

  const completedStepsCount = stepsList.filter(s => getStepVal(s.k).status === 'Done').length;
  const currentStepItem = stepsList.find(s => getStepVal(s.k).status !== 'Done') || stepsList[0];
  const docCount = stepsList.filter(s => getStepVal(s.k).doc).length;

  const formatDateDisplay = (rawDate) => {
    if (!rawDate) return '---';
    const str = String(rawDate).slice(0, 10);
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dashboard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Dashboard</h3>
            <span className="modal-header-sub">{company.company_name}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Strip */}
          <div className="dash-summary-strip">
            <span className="dash-sum-lbl">CURRENT STEP</span>
            <span className="dash-sum-val"><strong>{currentStepItem.n !== '—' ? currentStepItem.n : '1'} · {currentStepItem.lab}</strong></span>
            <span className="dash-sum-sep">|</span>
            <span className="dash-sum-resp">{currentStepItem.resp}</span>
          </div>

          {/* Steps Table */}
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '36px', textAlign: 'center' }}>#</th>
                  <th>STEP NAME</th>
                  <th style={{ width: '100px' }}>DATE</th>
                  <th style={{ width: '140px' }}>RESPONSIBILITY</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stepsList.map((step, idx) => {
                  const val = getStepVal(step.k);
                  const isCurrent = currentStepItem.k === step.k;
                  const isDone = val.status === 'Done';
                  const isEdit = editingStep === step.k;
                  const displayDate = formatDateDisplay(val.date);
                  const stepNum = step.n !== '—' ? step.n : '4b';

                  return (
                    <React.Fragment key={step.k}>
                      <tr 
                        className={`${isCurrent ? 'dash-row-current' : ''} ${isEdit ? 'active-edit-row' : ''}`}
                        onClick={() => handleRowClick(step.k)}
                      >
                        <td style={{ textAlign: 'center' }} className="dash-col-num">{stepNum}</td>
                        <td className="dash-col-name">
                          <span className="dash-step-title">{step.lab}</span>
                          {step.note && <span className="dash-tag-note">{step.note}</span>}
                          {step.doc && <span className="dash-tag-doc">signed doc</span>}
                        </td>
                        <td className={`dash-col-date ${isCurrent || isDone ? 'active-date' : 'muted-date'}`}>
                          {displayDate}
                        </td>
                        <td className="dash-col-resp">{step.resp}</td>
                        <td style={{ textAlign: 'right' }}>
                          {isCurrent ? (
                            <span className="dash-status-current">Current</span>
                          ) : isDone ? (
                            <span className="dash-status-done">Done</span>
                          ) : (
                            <span className="dash-status-pending">Pending</span>
                          )}
                        </td>
                      </tr>

                      {/* Inline Step Form right under the selected row */}
                      {isEdit && (
                        <tr className="dash-edit-tr">
                          <td colSpan={5}>
                            <div className="dash-step-edit-form">
                              <div className="dash-form-grid">
                                <label>
                                  Date:
                                  <input 
                                    type="date" 
                                    value={formDate} 
                                    onChange={(e) => setFormDate(e.target.value)} 
                                  />
                                </label>
                                <label>
                                  Next Follow Up Date:
                                  <input 
                                    type="date" 
                                    value={formNextFollowupDate} 
                                    onChange={(e) => setFormNextFollowupDate(e.target.value)} 
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                </label>
                                <label>
                                  Status:
                                  <select 
                                    value={formStatus} 
                                    onChange={(e) => setFormStatus(e.target.value)}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                    <option value="Not Applicable">Not Applicable</option>
                                  </select>
                                </label>
                                <label className="full-w">
                                  Remarks / Notes:
                                  <input 
                                    type="text" 
                                    placeholder="Add notes for this step..."
                                    value={formRemarks} 
                                    onChange={(e) => setFormRemarks(e.target.value)} 
                                    maxLength={300}
                                  />
                                </label>
                                {step.doc && (
                                  <label className="full-w">
                                    Signed Document Reference:
                                    <input 
                                      type="text" 
                                      placeholder="Enter document filename or link..."
                                      value={formDoc} 
                                      onChange={(e) => setFormDoc(e.target.value)} 
                                      maxLength={255}
                                    />
                                  </label>
                                )}
                              </div>
                              <div className="dash-form-actions">
                                <button type="button" className="act-btn-cancel" onClick={() => setEditingStep(null)}>Cancel</button>
                                <button type="button" className="act-btn-submit" onClick={() => handleSaveStep(step.k)}>Save Step</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="modal-foot-info">
            Step {currentStepItem.n !== '—' ? currentStepItem.n : '1'} of {stepsList.length} · {completedStepsCount} completed · {docCount} signed document(s) on file
          </span>
          <button type="button" className="act-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
