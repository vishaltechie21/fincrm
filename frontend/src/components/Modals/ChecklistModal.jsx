import { useState } from 'react';
import { X, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Plus, Trash2, FileCheck } from 'lucide-react';
import { CHECKLIST_ITEMS, CHECKLIST_STAGES } from '../../utils/checklistData';
import './ChecklistModal.css';

export default function ChecklistModal({ isOpen, onClose, company }) {
  const [openStage, setOpenStage] = useState(CHECKLIST_STAGES[0]);
  const [recordedItems, setRecordedItems] = useState({});
  const [addingIndex, setAddingIndex] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRecordedBy, setNewRecordedBy] = useState('Suman');
  const [newNextFollowup, setNewNextFollowup] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [newEvidence, setNewEvidence] = useState('');

  if (!isOpen || !company) return null;

  const isDone = (idx) => {
    const recs = recordedItems[idx] || [];
    return recs.length > 0;
  };

  const stageProgress = (st) => {
    const stageItems = CHECKLIST_ITEMS.map((item, idx) => ({ ...item, idx })).filter(item => item.st === st);
    const completed = stageItems.filter(item => isDone(item.idx)).length;
    const mandatoryOpen = stageItems.filter(item => item.m && !isDone(item.idx)).length;
    return { total: stageItems.length, completed, mandatoryOpen };
  };

  const totalCompleted = CHECKLIST_ITEMS.filter((_, idx) => isDone(idx)).length;
  const totalMandatoryOpen = CHECKLIST_ITEMS.filter((item, idx) => item.m && !isDone(idx)).length;

  const handleToggleStage = (st) => {
    setOpenStage(openStage === st ? null : st);
    setAddingIndex(null);
  };

  const handleOpenAddForm = (globalIdx) => {
    if (addingIndex === globalIdx) {
      setAddingIndex(null);
    } else {
      setAddingIndex(globalIdx);
      setNewDate(new Date().toISOString().split('T')[0]);
      setNewRecordedBy('Suman');
      setNewNextFollowup('');
      setNewRemark('');
      setNewEvidence('');
    }
  };

  const handleAddLog = (idx) => {
    if (!newRemark.trim()) return;
    setRecordedItems(prev => ({
      ...prev,
      [idx]: [
        ...(prev[idx] || []),
        {
          date: newDate || new Date().toISOString().split('T')[0],
          recordedBy: newRecordedBy || 'Suman',
          nextFollowup: newNextFollowup,
          remark: newRemark.trim(),
          evidence: newEvidence.trim(),
          user: newRecordedBy || 'Suman'
        }
      ]
    }));
    setNewRemark('');
    setNewEvidence('');
    setNewNextFollowup('');
    setAddingIndex(null);
  };

  const handleRemoveLog = (idx, logIdx) => {
    setRecordedItems(prev => ({
      ...prev,
      [idx]: (prev[idx] || []).filter((_, i) => i !== logIdx)
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Customer Lifecycle Checklist</h3>
            <span className="modal-header-sub">{company.company_name} · ({totalCompleted}/{CHECKLIST_ITEMS.length}) Items Recorded</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Banner */}
          <div className="chk-banner">
            <div className="chk-banner-box">
              <span className="chk-b-lbl">Progress</span>
              <span className="chk-b-val">{totalCompleted} of {CHECKLIST_ITEMS.length} Recorded</span>
            </div>
            {totalMandatoryOpen > 0 && (
              <div className="chk-banner-box warn">
                <AlertCircle size={15} />
                <span>{totalMandatoryOpen} Mandatory Item(s) Still Open</span>
              </div>
            )}
          </div>

          {/* Stages List */}
          <div className="chk-stages">
            {CHECKLIST_STAGES.map((st) => {
              const prog = stageProgress(st);
              const isOpenStage = openStage === st;

              return (
                <div key={st} className="chk-stage-group">
                  <div 
                    className={`chk-stage-header ${isOpenStage ? 'expanded' : ''}`}
                    onClick={() => handleToggleStage(st)}
                  >
                    <div className="st-left">
                      {isOpenStage ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="st-name">{st}</span>
                    </div>
                    <div className="st-right">
                      <span className="st-count">{prog.completed} / {prog.total}</span>
                      {prog.mandatoryOpen > 0 && (
                        <span className="st-mand-badge">{prog.mandatoryOpen} mandatory open</span>
                      )}
                    </div>
                  </div>

                  {isOpenStage && (
                    <div className="chk-stage-content">
                      {CHECKLIST_ITEMS.map((item, globalIdx) => {
                        if (item.st !== st) return null;
                        const logs = recordedItems[globalIdx] || [];
                        const itemDone = logs.length > 0;
                        const isAdding = addingIndex === globalIdx;

                        return (
                          <div key={globalIdx} className={`chk-item-row ${itemDone ? 'completed' : ''}`}>
                            <div className="chk-item-main">
                              <div className="item-title">
                                <span className={`chk-status-dot ${itemDone ? 'done' : ''}`} />
                                <span className="item-action-text">{item.a}</span>
                                {item.m && <span className="badge-mand">Mandatory</span>}
                                {item.e && (
                                  <span className={`badge-evidence ${itemDone ? 'has-ev' : ''}`}>
                                    <FileCheck size={10} /> {item.e}
                                  </span>
                                )}
                              </div>

                              <div className="item-meta">
                                <span className="item-resp">{item.r}</span>
                                {itemDone ? (
                                  <span className="item-recorded-tag">
                                    <CheckCircle2 size={11} /> {logs.length} recorded
                                  </span>
                                ) : (
                                  <span className="item-pending-tag">0 recorded</span>
                                )}
                                <button 
                                  type="button" 
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleOpenAddForm(globalIdx)}
                                >
                                  Add
                                </button>
                              </div>
                            </div>

                            {/* Existing Logs List */}
                            {logs.length > 0 && (
                              <div className="chk-logs-list">
                                {logs.map((log, lIdx) => (
                                  <div key={lIdx} className="chk-log-entry">
                                    <span className="mono">{log.date}</span>
                                    <span className="log-text">{log.remark}</span>
                                    {log.nextFollowup && <span className="log-ev">Next: {log.nextFollowup}</span>}
                                    {log.evidence && <span className="log-ev">Ref: {log.evidence}</span>}
                                    <span className="muted">by {log.user || log.recordedBy}</span>
                                    <button 
                                      type="button" 
                                      className="log-del-btn"
                                      onClick={() => handleRemoveLog(globalIdx, lIdx)}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inline Add Log Form */}
                            {isAdding && (
                              <div className="chk-add-form">
                                <div className="add-form-row-top">
                                  <label>
                                    DATE
                                    <input 
                                      type="date" 
                                      value={newDate}
                                      onChange={(e) => setNewDate(e.target.value)}
                                    />
                                  </label>
                                  <label>
                                    RECORDED BY
                                    <input 
                                      type="text" 
                                      value={newRecordedBy}
                                      onChange={(e) => setNewRecordedBy(e.target.value)}
                                    />
                                  </label>
                                  <label>
                                    NEXT FOLLOW-UP
                                    <input 
                                      type="date" 
                                      placeholder="dd/mm/yyyy"
                                      value={newNextFollowup}
                                      onChange={(e) => setNewNextFollowup(e.target.value)}
                                    />
                                  </label>
                                </div>

                                <div className="add-form-row-remarks">
                                  <label>
                                    REMARKS
                                    <textarea 
                                      rows={2}
                                      placeholder="Enter remark or observation..." 
                                      value={newRemark}
                                      onChange={(e) => setNewRemark(e.target.value)}
                                    />
                                  </label>
                                </div>

                                {item.e && (
                                  <div className="add-form-row-evidence">
                                    <label>
                                      EVIDENCE REFERENCE
                                      <input 
                                        type="text" 
                                        placeholder={`Evidence / ${item.e} reference...`} 
                                        value={newEvidence}
                                        onChange={(e) => setNewEvidence(e.target.value)}
                                      />
                                    </label>
                                  </div>
                                )}

                                <div className="add-form-btns">
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingIndex(null)}>Cancel</button>
                                  <button type="button" className="btn btn-success btn-sm" onClick={() => handleAddLog(globalIdx)}>Save</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <span className="modal-foot-info">Click any stage to expand, then click Log to record activity entries</span>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
