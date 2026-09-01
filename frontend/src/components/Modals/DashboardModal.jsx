import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { SALES_STEPS } from '../../utils/dashboardData';
import './DashboardModal.css';

export default function DashboardModal({ isOpen, onClose, company, onSaveDashboard }) {
  const [stepsData, setStepsData] = useState({});
  const [editingStep, setEditingStep] = useState(null);
  const [formDate, setFormDate] = useState('');
  const [formNextFollowupDate, setFormNextFollowupDate] = useState('');
  const [formStatus, setFormStatus] = useState('Pending');
  const [formRemarks, setFormRemarks] = useState('');
  const [formDoc, setFormDoc] = useState('');

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

  const doneCount = SALES_STEPS.filter(s => getStepVal(s.k).status === 'Done').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Sales Closing Cycle Dashboard</h3>
            <span className="modal-header-sub">{company.company_name} · {doneCount} of {SALES_STEPS.length} Steps Completed</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Progress Banner */}
          <div className="pipeline-banner">
            <div className="pipeline-banner-item">
              <span className="p-lbl">Completed Steps</span>
              <span className="p-val green">{doneCount} / 15</span>
            </div>
            <div className="pipeline-banner-item">
              <span className="p-lbl">Next Action</span>
              <span className="p-val gold">
                {SALES_STEPS.find(s => getStepVal(s.k).status !== 'Done')?.lab || 'Cycle Finished'}
              </span>
            </div>
          </div>

          {/* Steps Table */}
          <div className="steps-table-wrap">
            <div className="steps-head">
              <div className="step-col-num">#</div>
              <div className="step-col-name">STEP NAME</div>
              <div className="step-col-date">DATE</div>
              <div className="step-col-resp">RESPONSIBILITY</div>
              <div className="step-col-status">STATUS</div>
            </div>

            {SALES_STEPS.map((step, idx) => {
              const val = getStepVal(step.k);
              const isDone = val.status === 'Done';
              const isEdit = editingStep === step.k;
              const statusClass = isDone ? 'done' : val.status === 'In Progress' ? 'in-progress' : 'pending';
              const stepNumStr = step.n !== '—' ? step.n : `${idx}b`;

              return (
                <div key={step.k} className="step-row-wrap">
                  <div 
                    className={`step-row ${statusClass} ${isEdit ? 'active-edit' : ''}`}
                    onClick={() => handleRowClick(step.k)}
                  >
                    <div className="step-col-num">{stepNumStr}</div>
                    <div className="step-col-name">
                      <div className="step-title-line">
                        <span>{step.lab}</span>
                        {step.note && <span className="step-note">({step.note})</span>}
                        {step.doc && <span className="step-doc-tag"><FileText size={10} /> signed doc</span>}
                      </div>
                    </div>
                    <div className="step-col-date mono">{val.date || '—'}</div>
                    <div className="step-col-resp">{step.resp}</div>
                    <div className="step-col-status">
                      <span className={`status-pill ${statusClass}`}>
                        {isDone ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {val.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Inline Step Form */}
                  {isEdit && (
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
                            />
                          </label>
                        )}
                      </div>
                      <div className="dash-form-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingStep(null)}>Cancel</button>
                        <button type="button" className="btn btn-success btn-sm" onClick={() => handleSaveStep(step.k)}>Save Step</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-foot-info">Click any step to update its progress or upload signed documents</span>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
