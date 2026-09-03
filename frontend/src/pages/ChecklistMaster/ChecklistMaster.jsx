import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Trash2, Edit2, Save, X } from '../../components/Icon';
import { masterService } from '../../services/masterService';
import { CHECKLIST_STAGES, CHECKLIST_ITEMS } from '../../utils/checklistData';
import TruncatedText from '../../components/TruncatedText/TruncatedText';
import Notification from '../../components/Notification/Notification';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import Swal from 'sweetalert2';

export default function ChecklistMaster({ isStandalone = false }) {
  const [stages, setStages] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [editingItemId, setEditingItemId] = useState(null);

  // Form State
  const [actionName, setActionName] = useState('');
  const [responsibility, setResponsibility] = useState('Sales Person');
  const [isMandatory, setIsMandatory] = useState(false);
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const fetchChecklist = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await masterService.getChecklist();
      if (res && Array.isArray(res.stages) && res.stages.length > 0) {
        setStages(res.stages);
        if (!selectedStage && res.stages.length > 0) {
          setSelectedStage(res.stages[0].stage_name);
        }
      } else {
        const fallbackStages = CHECKLIST_STAGES.map((st, i) => ({ stage_id: null, stage_name: st, sort_order: i + 1 }));
        setStages(fallbackStages);
        if (!selectedStage) setSelectedStage(CHECKLIST_STAGES[0]);
      }

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setItems(res.items);
      } else {
        const fallbackItems = CHECKLIST_ITEMS.map((item, i) => ({
          item_id: null,
          stage_name: item.st,
          action_name: item.a,
          responsibility: item.r,
          is_mandatory: item.m ? 1 : 0,
          evidence_label: item.e || '',
          sort_order: i + 1
        }));
        setItems(fallbackItems);
      }
    } catch (err) {
      console.error('Failed to load checklist master:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStage]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const resetForm = () => {
    setEditingItemId(null);
    setActionName('');
    setResponsibility('Sales Person');
    setIsMandatory(false);
    setEvidenceLabel('');
    setSortOrder(items.length + 1);
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.item_id || item.action_name);
    setSelectedStage(item.stage_name);
    setActionName(item.action_name);
    setResponsibility(item.responsibility || 'Sales Person');
    setIsMandatory(!!item.is_mandatory);
    setEvidenceLabel(item.evidence_label || '');
    setSortOrder(item.sort_order || 0);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!selectedStage || !actionName.trim()) {
      showNotification('Please select a stage and enter action name.', 'error');
      return;
    }

    const payload = {
      item_id: typeof editingItemId === 'number' ? editingItemId : null,
      stage_name: selectedStage,
      action_name: actionName.trim(),
      responsibility: responsibility.trim(),
      is_mandatory: isMandatory,
      evidence_label: evidenceLabel.trim(),
      sort_order: parseInt(sortOrder, 10) || 0
    };

    const res = await masterService.saveChecklistItem(payload);
    if (res && res.success) {
      showNotification('Checklist item saved successfully!');
      resetForm();
      fetchChecklist();
    } else {
      showNotification(res.error || 'Failed to save checklist item', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!itemId) return;
    const confirm = await Swal.fire({
      title: 'Delete Item?',
      text: 'Are you sure you want to deactivate this checklist action item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete'
    });

    if (confirm.isConfirmed) {
      const res = await masterService.deleteChecklistItem(itemId);
      if (res && res.success) {
        showNotification('Item deleted successfully');
        fetchChecklist();
      } else {
        showNotification(res.error || 'Failed to delete item', 'error');
      }
    }
  };

  const currentStageItems = items.filter(i => i.stage_name === selectedStage);

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
            <h2><Layers className="page-header-icon" /> Customer Lifecycle Checklist Master</h2>
            <p className="page-subtitle">Configure stages, action items, responsibilities, mandatory requirements, and evidence tags.</p>
          </div>
        </header>
      )}

      {/* Main Content Layout */}
      <div className="submaster-layout">
        {/* Left Side: Item Form */}
        <div className="submaster-left-panel" style={{ width: '340px' }}>
          <div className="submaster-card">
            <h3 className="card-title">{editingItemId ? 'Edit Action Item' : 'Add New Action Item'}</h3>
            <form onSubmit={handleSaveItem} className="master-form space-y-2">
              <SelectField
                label="Stage"
                name="selectedStage"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                options={stages.map(st => ({ value: st.stage_name, label: st.stage_name }))}
                required={true}
              />

              <FormField
                label="Action Item"
                name="actionName"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder="e.g. Cold Calling, Plant Visit..."
                required={true}
                maxLength={255}
              />

              <FormField
                label="Responsibility"
                name="responsibility"
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                placeholder="e.g. Sales Person, QA Team"
                required={true}
                maxLength={100}
              />

              <FormField
                label="Evidence Ref"
                name="evidenceLabel"
                value={evidenceLabel}
                onChange={(e) => setEvidenceLabel(e.target.value)}
                placeholder="e.g. Call Log, Quotation Copy"
                maxLength={255}
              />

              <div className="form-field">
                <label>Mandatory</label>
                <div className="field-control-container flex items-center">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={isMandatory}
                      onChange={(e) => setIsMandatory(e.target.checked)}
                    />
                    Is Mandatory Item
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
                {editingItemId && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                    <X size={14} /> Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-success btn-sm" style={{ flex: 1 }}>
                  <Save size={14} /> {editingItemId ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Items Table for Selected Stage */}
        <div className="submaster-right-panel" style={{ flex: 1 }}>
          <div className="submaster-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                {selectedStage} ({currentStageItems.length} items)
              </h3>
            </div>
            <div className="table-responsive">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th>ACTION ITEM</th>
                    <th>RESPONSIBILITY</th>
                    <th style={{ width: '90px' }}>TYPE</th>
                    <th>EVIDENCE</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStageItems.map((item, idx) => (
                    <tr key={item.item_id || idx}>
                      <td><TruncatedText text={item.action_name} limit={35} /></td>
                      <td>{item.responsibility}</td>
                      <td>
                        {item.is_mandatory ? (
                          <span className="badge badge-danger">Mandatory</span>
                        ) : (
                          <span className="badge badge-secondary">Optional</span>
                        )}
                      </td>
                      <td>{item.evidence_label ? <span className="badge badge-info">{item.evidence_label}</span> : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          style={{ padding: '2px 6px', marginRight: '4px' }}
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 size={12} />
                        </button>
                        {item.item_id && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '2px 6px' }}
                            onClick={() => handleDeleteItem(item.item_id)}
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
