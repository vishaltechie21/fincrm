import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { masterService } from '../../services/masterService';
import { SALES_STEPS } from '../../utils/dashboardData';
import TruncatedText from '../../components/TruncatedText/TruncatedText';
import Notification from '../../components/Notification/Notification';
import FormField from '../../components/FormField';
import Swal from 'sweetalert2';

export default function DashboardStepMaster({ isStandalone = false }) {
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [stepNumber, setStepNumber] = useState('');
  const [stepKey, setStepKey] = useState('');
  const [stepName, setStepName] = useState('');
  const [responsibility, setResponsibility] = useState('Sales Person');
  const [note, setNote] = useState('');
  const [requiresDoc, setRequiresDoc] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const fetchSteps = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await masterService.getDashboardSteps();
      if (Array.isArray(data) && data.length > 0) {
        setSteps(data);
      } else {
        // Fallback default mapping from sales_steps
        const fallback = SALES_STEPS.map((s, i) => ({
          step_id: null,
          step_key: s.k,
          step_number: s.n,
          step_name: s.lab,
          responsibility: s.resp,
          note: s.note || '',
          requires_doc: s.doc ? 1 : 0,
          sort_order: i + 1
        }));
        setSteps(fallback);
      }
    } catch (err) {
      console.error('Failed to load steps:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const resetForm = () => {
    setEditingId(null);
    setStepNumber('');
    setStepKey('');
    setStepName('');
    setResponsibility('Sales Person');
    setNote('');
    setRequiresDoc(false);
    setSortOrder(steps.length + 1);
  };

  const handleEdit = (step) => {
    setEditingId(step.step_id || step.step_key);
    setStepNumber(step.step_number || '');
    setStepKey(step.step_key || '');
    setStepName(step.step_name || '');
    setResponsibility(step.responsibility || 'Sales Person');
    setNote(step.note || '');
    setRequiresDoc(!!step.requires_doc);
    setSortOrder(step.sort_order || 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!stepName.trim() || !stepNumber.trim() || !stepKey.trim()) {
      showNotification('Please fill in step number, key, and step name.', 'error');
      return;
    }

    const payload = {
      step_id: typeof editingId === 'number' ? editingId : null,
      step_key: stepKey.trim(),
      step_number: stepNumber.trim(),
      step_name: stepName.trim(),
      responsibility: responsibility.trim(),
      note: note.trim(),
      requires_doc: requiresDoc,
      sort_order: parseInt(sortOrder, 10) || 0
    };

    const res = await masterService.saveDashboardStep(payload);
    if (res && res.success) {
      showNotification('Dashboard step saved successfully!');
      resetForm();
      fetchSteps();
    } else {
      showNotification(res.error || 'Failed to save dashboard step', 'error');
    }
  };

  const handleDelete = async (stepId) => {
    if (!stepId) return;
    const confirm = await Swal.fire({
      title: 'Delete Step?',
      text: 'Are you sure you want to deactivate this step?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete'
    });

    if (confirm.isConfirmed) {
      const res = await masterService.deleteDashboardStep(stepId);
      if (res && res.success) {
        showNotification('Step deleted successfully');
        fetchSteps();
      } else {
        showNotification(res.error || 'Failed to delete step', 'error');
      }
    }
  };

  return (
    <div className={isStandalone ? "page-container page-submaster" : "submaster-embedded-wrapper"}>
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: '', type: 'success' })}
        />
      )}

      {/* Top Header */}
      {isStandalone && (
        <header className="page-header search-header-panel">
          <div className="header-title-group">
            <h2><Sliders className="page-header-icon" /> Dashboard Steps Master</h2>
            <p className="page-subtitle">Configure sales closing cycle steps, responsibility, notes, and required documents.</p>
          </div>
        </header>
      )}

      {/* Main Content Layout */}
      <div className="submaster-layout">
        {/* Left Side: Step Form */}
        <div className="submaster-left-panel" style={{ width: '340px' }}>
          <div className="submaster-card">
            <h3 className="card-title">{editingId ? 'Edit Dashboard Step' : 'Add New Dashboard Step'}</h3>
            <form onSubmit={handleSave} className="master-form space-y-2">
              <FormField
                label="Step Number (#)"
                name="stepNumber"
                value={stepNumber}
                onChange={(e) => setStepNumber(e.target.value)}
                placeholder="e.g. 1, 2, 4b"
                required={true}
                maxLength={10}
              />

              <FormField
                label="Step Key (Unique)"
                name="stepKey"
                value={stepKey}
                onChange={(e) => setStepKey(e.target.value)}
                placeholder="e.g. s1, s2, sg"
                required={true}
                maxLength={20}
              />

              <FormField
                label="Step Name"
                name="stepName"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                placeholder="Enter step title..."
                required={true}
                maxLength={255}
              />

              <FormField
                label="Responsibility"
                name="responsibility"
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                placeholder="e.g. Sales Person, Demonstration Team"
                required={true}
                maxLength={100}
              />

              <FormField
                label="Note / Tag"
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. 24–48 hrs, if required"
                maxLength={255}
              />

              <div className="form-field">
                <label>Requires Doc</label>
                <div className="field-control-container flex items-center">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={requiresDoc}
                      onChange={(e) => setRequiresDoc(e.target.checked)}
                    />
                    Requires Signed Document
                  </label>
                </div>
              </div>

              <FormField
                label="Sort Order"
                name="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />

              <div className="form-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {editingId && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                    <X size={14} /> Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-success btn-sm" style={{ flex: 1 }}>
                  <Save size={14} /> {editingId ? 'Update Step' : 'Add Step'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Steps Table */}
        <div className="submaster-right-panel" style={{ flex: 1 }}>
          <div className="submaster-card">
            <h3 className="card-title">Configured Closing Steps ({steps.length})</h3>
            <div className="table-responsive">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '60px' }}>KEY</th>
                    <th>STEP NAME</th>
                    <th>RESPONSIBILITY</th>
                    <th>NOTE / TAG</th>
                    <th style={{ width: '80px' }}>DOC</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s, idx) => (
                    <tr key={s.step_id || s.step_key || idx}>
                      <td><strong>{s.step_number}</strong></td>
                      <td><code>{s.step_key}</code></td>
                      <td><TruncatedText text={s.step_name} limit={35} /></td>
                      <td>{s.responsibility}</td>
                      <td>{s.note ? <span className="badge badge-info">{s.note}</span> : '—'}</td>
                      <td>{s.requires_doc ? <span className="badge badge-success">Yes</span> : 'No'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          style={{ padding: '2px 6px', marginRight: '4px' }}
                          onClick={() => handleEdit(s)}
                        >
                          <Edit2 size={12} />
                        </button>
                        {s.step_id && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '2px 6px' }}
                            onClick={() => handleDelete(s.step_id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
