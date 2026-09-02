import { useState, useEffect } from 'react';
import { X, CheckCircle2, Trash2, FileCheck } from 'lucide-react';
import { CHECKLIST_ITEMS, CHECKLIST_STAGES } from '../../utils/checklistData';
import TruncatedText from '../TruncatedText/TruncatedText';
import './Modals.css';

export default function ChecklistModal({ isOpen, onClose, company, onSaveChecklist }) {
  const [openStage, setOpenStage] = useState(CHECKLIST_STAGES[0]);
  const [recordedItems, setRecordedItems] = useState({});
  const [addingIndex, setAddingIndex] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRecordedBy, setNewRecordedBy] = useState('Suman');
  const [newNextFollowup, setNewNextFollowup] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [newEvidence, setNewEvidence] = useState('');

  useEffect(() => {
    if (company) {
      let initialData = {};
      if (company.checklistData && typeof company.checklistData === 'object') {
        initialData = company.checklistData;
      } else if (company.checklist_data) {
        try {
          initialData = typeof company.checklist_data === 'string' ? JSON.parse(company.checklist_data) : company.checklist_data;
        } catch (e) {
          initialData = {};
        }
      }
      setRecordedItems(initialData || {});
    }
  }, [company]);

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
    const updated = {
      ...recordedItems,
      [idx]: [
        ...(recordedItems[idx] || []),
        {
          date: newDate || new Date().toISOString().split('T')[0],
          recordedBy: newRecordedBy || 'Suman',
          nextFollowup: newNextFollowup,
          remark: newRemark.trim(),
          evidence: newEvidence.trim(),
          user: newRecordedBy || 'Suman'
        }
      ]
    };
    setRecordedItems(updated);
    if (onSaveChecklist) {
      onSaveChecklist(company.mascom_id, updated);
    }
    setNewRemark('');
    setNewEvidence('');
    setNewNextFollowup('');
    setAddingIndex(null);
  };

  const handleRemoveLog = (idx, logIdx) => {
    const updated = {
      ...recordedItems,
      [idx]: (recordedItems[idx] || []).filter((_, i) => i !== logIdx)
    };
    setRecordedItems(updated);
    if (onSaveChecklist) {
      onSaveChecklist(company.mascom_id, updated);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Checklist</h3>
            <span className="modal-header-sub">{company.company_name}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Strip */}
          <div className="chk-summary-strip">
            <span className="chk-sum-label">RECORDED</span>
            <span className="chk-sum-val"><strong>{totalCompleted} of {CHECKLIST_ITEMS.length}</strong></span>
            <span className="chk-sum-sep">|</span>
            <span className="chk-sum-warn">{totalMandatoryOpen} mandatory item(s) still open</span>
          </div>

          {/* Stages Accordion List */}
          <div className="chk-stages">
            {CHECKLIST_STAGES.map((st) => {
              const { total, completed, mandatoryOpen } = stageProgress(st);
              const isExpanded = openStage === st;
              const stageItems = CHECKLIST_ITEMS.map((item, idx) => ({ ...item, idx })).filter(item => item.st === st);

              return (
                <div key={st} className="chk-stage-group">
                  <div 
                    className={`chk-stage-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => handleToggleStage(st)}
                  >
                    <div className="st-left">
                      <span className="st-name">{st}</span>
                    </div>
                    <div className="st-right">
                      <span className="st-count">{completed} / {total}</span>
                      {mandatoryOpen > 0 && (
                        <span className="chk-mand-open-badge">{mandatoryOpen} mandatory open</span>
                      )}
                      <span className="st-toggle-symbol">{isExpanded ? '–' : '+'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="chk-stage-content">
                      {stageItems.map((item) => {
                        const globalIdx = item.idx;
                        const logs = recordedItems[globalIdx] || [];
                        const itemDone = isDone(globalIdx);
                        const isAdding = addingIndex === globalIdx;

                        return (
                          <div key={globalIdx} className={`chk-item-row ${itemDone ? 'completed' : ''}`}>
                            <div className="chk-item-main">
                              <div className="item-title">
                                <span className={`chk-status-dot ${itemDone ? 'done' : ''}`}></span>
                                <span className="item-action-text">{item.a}</span>
                                {item.m && <span className="badge-mand">Mandatory</span>}
                                {item.e && (
                                  <span className={`badge-evidence ${logs.some(l => l.evidence) ? 'has-ev' : ''}`}>
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
                                  className="act-btn-outline"
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
                                    <span className="log-text"><TruncatedText text={log.remark} limit={50} /></span>
                                    {log.nextFollowup && <span className="log-ev">Next: {log.nextFollowup}</span>}
                                    {log.evidence && <span className="log-ev">Ref: <TruncatedText text={log.evidence} limit={25} /></span>}
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
                                      maxLength={100}
                                    />
                                  </label>
                                  <label>
                                    NEXT FOLLOW-UP
                                    <input 
                                      type="date" 
                                      placeholder="dd/mm/yyyy"
                                      value={newNextFollowup}
                                      onChange={(e) => setNewNextFollowup(e.target.value)}
                                      min={new Date().toISOString().split('T')[0]}
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
                                      maxLength={500}
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
                                        maxLength={255}
                                      />
                                    </label>
                                  </div>
                                )}

                                <div className="add-form-btns">
                                  <button type="button" className="act-btn-cancel" onClick={() => setAddingIndex(null)}>Cancel</button>
                                  <button type="button" className="act-btn-submit" onClick={() => handleAddLog(globalIdx)}>Save</button>
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

        {/* Footer */}
        <div className="modal-footer">
          <span className="modal-foot-info">Click a stage to open it, then click an activity to record it.</span>
          <button type="button" className="act-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
