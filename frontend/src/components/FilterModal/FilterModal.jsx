import { useState, useEffect, useMemo } from 'react';
import { SEARCH_COLUMNS } from '../../utils/searchColumns';
import './FilterModal.css';

// Custom Popover Multi-Select Dropdown Component
const ValueMultiSelect = ({ field, selectedValues = [], options = [], onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.val-multiselect-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="val-multiselect-trigger disabled">
        <span className="trigger-label">— All —</span>
        <span className="trigger-arrow">▼</span>
      </div>
    );
  }

  const handleToggle = (val) => {
    let next;
    if (selectedValues.includes(val)) {
      next = selectedValues.filter((v) => v !== val);
    } else {
      next = [...selectedValues, val];
    }
    onChange(next);
  };

  const handleSelectAll = (checked) => {
    onChange(checked ? [...options] : []);
  };

  // Label text to show on trigger button
  let triggerLabel = '— All —';
  if (selectedValues.length > 0) {
    if (selectedValues.length === options.length) {
      triggerLabel = 'All Selected';
    } else if (selectedValues.length <= 2) {
      triggerLabel = selectedValues.join(', ');
    } else {
      triggerLabel = `${selectedValues.length} Selected`;
    }
  }

  return (
    <div className="val-multiselect-container">
      <div 
        className={`val-multiselect-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="trigger-label">{triggerLabel}</span>
        <span className="trigger-arrow">▼</span>
      </div>
      {isOpen && (
        <div className="val-multiselect-dropdown">
          <div className="multiselect-option select-all-option">
            <label className="checkbox-container col-item">
              <input 
                type="checkbox"
                checked={options.length > 0 && selectedValues.length === options.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="label-text">Select All</span>
            </label>
          </div>
          <div className="multiselect-options-list">
            {options.map((val) => {
              const isChecked = selectedValues.includes(val);
              return (
                <div key={val} className="multiselect-option">
                  <label className="checkbox-container col-item">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(val)}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">{val}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterModal = ({
  isOpen,
  onClose,
  columns = {}, // { key: label } or SEARCH_COLUMNS
  dataset = [], // raw rows
  getPropValue, // (row, fieldKey) => string
  visibleColumns = [], // array of visible field keys
  onVisibleColumnsChange,
  activeFilters = [], // array of [{ f: field, v: [val1, val2] }]
  onFiltersChange
}) => {
  const [draftFilters, setDraftFilters] = useState([]);
  const [draftVisibleColumns, setDraftVisibleColumns] = useState([]);

  // Extract unique values for each column from the loaded dataset
  const uniqueValuesMap = useMemo(() => {
    const map = {};
    SEARCH_COLUMNS.forEach((col) => {
      const vals = dataset.map((row) => {
        const val = getPropValue ? getPropValue(row, col.k) : col.get(row);
        return val === null || val === undefined ? '' : String(val).trim();
      });
      // Normalize empty/falsy to '—' and get unique sorted list
      map[col.k] = Array.from(new Set(vals))
        .map(v => v || '—')
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    });
    return map;
  }, [dataset, getPropValue]);

  // Sync draft states when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialFilters = Array.isArray(activeFilters)
        ? activeFilters.map((f) => {
            let valArray = [];
            if (f.v) {
              valArray = Array.isArray(f.v) ? f.v : [f.v];
            }
            return { f: f.f, v: valArray };
          })
        : [];
      setDraftFilters(
        initialFilters.length > 0 ? initialFilters : [{ f: '', v: [] }]
      );
      setDraftVisibleColumns([...visibleColumns]);
    }
  }, [isOpen, activeFilters, visibleColumns]);

  if (!isOpen) return null;

  // Condition Handlers
  const handleFieldChange = (index, field) => {
    setDraftFilters((prev) => {
      const next = prev.map((f, idx) => {
        if (idx === index) {
          return { f: field, v: [] }; // reset value array on field change
        }
        return f;
      });
      return next;
    });
  };

  const handleValueChange = (index, valueArray) => {
    setDraftFilters((prev) => {
      const next = prev.map((f, idx) => {
        if (idx === index) {
          return { ...f, v: valueArray };
        }
        return f;
      });
      return next;
    });
  };

  const handleDeleteCondition = (index) => {
    setDraftFilters((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleAddCondition = () => {
    setDraftFilters((prev) => [...prev, { f: '', v: [] }]);
  };

  const handleClearAllConditions = () => {
    setDraftFilters([{ f: '', v: [] }]);
  };

  // Visible Column Toggle
  const handleColumnToggle = (fieldKey, checked) => {
    setDraftVisibleColumns((prev) => {
      if (checked) {
        if (!prev.includes(fieldKey)) {
          return [...prev, fieldKey];
        }
        return prev;
      } else {
        if (prev.length <= 1) return prev; // Keep at least one column visible
        return prev.filter((c) => c !== fieldKey);
      }
    });
  };

  const handleApply = () => {
    // Save filters (only valid completed ones with non-empty selected values)
    const validFilters = draftFilters.filter((f) => f.f && Array.isArray(f.v) && f.v.length > 0);
    onFiltersChange(validFilters);
    onVisibleColumnsChange(draftVisibleColumns);
    onClose();
  };

  const activeCondsCount = draftFilters.filter((f) => f.f && Array.isArray(f.v) && f.v.length > 0).length;

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal-box">
        {/* Header */}
        <div className="filter-modal-header">
          <h3>Filter Condition</h3>
          <button type="button" className="close-x-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="filter-modal-body">
          {/* Filter Conditions Section */}
          <div className="filter-section">
            <div className="sech">Filter Conditions</div>
            <div className="fgrid fg-head">
              <div></div>
              <div className="lab">Field Name</div>
              <div className="lab">Contents</div>
              <div></div>
            </div>
            
            <div className="conditions-list-container">
              {draftFilters.map((cond, i) => {
                const values = cond.f ? uniqueValuesMap[cond.f] || [] : [];
                return (
                  <div key={i} className="fgrid fg-row">
                    <div className="cond-index">{i + 1}</div>
                    <div>
                      <select 
                        value={cond.f} 
                        onChange={(e) => handleFieldChange(i, e.target.value)}
                        className="modal-select"
                      >
                        <option value="">Select Field</option>
                        {SEARCH_COLUMNS.map((c) => (
                          <option key={c.k} value={c.k}>
                            {c.lab} ({c.table})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <ValueMultiSelect
                        field={cond.f}
                        selectedValues={cond.v}
                        options={values}
                        onChange={(nextVals) => handleValueChange(i, nextVals)}
                        disabled={!cond.f}
                      />
                    </div>
                    <div>
                      {draftFilters.length > 1 && (
                        <button 
                          type="button" 
                          className="del-cond-btn" 
                          onClick={() => handleDeleteCondition(i)}
                          title="Delete condition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="conditions-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddCondition}>
                + Add Condition
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleClearAllConditions}>
                Clear All Condition
              </button>
            </div>
          </div>

          {/* Selection Field Section */}
          <div className="filter-section selection-section">
            <div className="sech">Selection Field</div>
            <div className="col-info-text">
              columns shown in grid — {draftVisibleColumns.length} of {SEARCH_COLUMNS.length}, drawn from MASCOM, MASCON and TRACOM against the one company record
            </div>
            
            <div className="cols-grid">
              {['MASCOM', 'MASCON', 'TRACOM'].map((tblName) => {
                const groupCols = SEARCH_COLUMNS.filter(c => c.table === tblName)
                  .sort((a, b) => a.lab.localeCompare(b.lab));

                return (
                  <div key={tblName} className="col-group-column">
                    <div className="col-group-title">{tblName}</div>
                    {groupCols.map((col) => {
                      const isChecked = draftVisibleColumns.includes(col.k);
                      return (
                        <label key={col.k} className="checkbox-container col-item">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => handleColumnToggle(col.k, e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          <span className="label-text">{col.lab}</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="filter-modal-footer">
          <div className="footer-left-info">
            {activeCondsCount} condition{activeCondsCount === 1 ? '' : 's'} · {draftVisibleColumns.length} columns
          </div>
          <div className="footer-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
