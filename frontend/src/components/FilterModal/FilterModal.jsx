import { useState, useMemo } from 'react';
import './FilterModal.css';

const FilterModal = ({
  isOpen,
  onClose,
  columns = {}, // { field: label }
  dataset = [], // raw rows
  getPropValue, // (row, field) => string
  visibleColumns = [], // array of visible fields
  onVisibleColumnsChange,
  activeFilters = {}, // { field: [val1, val2] }
  onFiltersChange
}) => {
  const [activeTab, setActiveTab] = useState(Object.keys(columns)[0] || '');
  const [valSearch, setValSearch] = useState('');

  // Extract unique values for each column from the loaded dataset
  const uniqueValuesMap = useMemo(() => {
    const map = {};
    Object.keys(columns).forEach((field) => {
      const vals = dataset.map((row) => {
        const val = getPropValue(row, field);
        return val === null || val === undefined ? '' : String(val).trim();
      });
      // Filter out empty and get unique sorted list
      map[field] = Array.from(new Set(vals))
        .map(v => v || '—')
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    });
    return map;
  }, [columns, dataset, getPropValue]);

  if (!isOpen) return null;

  const columnKeys = Object.keys(columns);
  const currentUniqueValues = uniqueValuesMap[activeTab] || [];

  // Filter unique values by search input inside the modal
  const filteredUniqueValues = currentUniqueValues.filter((val) =>
    val.toLowerCase().includes(valSearch.toLowerCase())
  );

  // Helper to get checked values for a column, defaulting to all unique values if undefined
  const getFieldCheckedValues = (field) => {
    return activeFilters[field] !== undefined ? activeFilters[field] : (uniqueValuesMap[field] || []);
  };

  // Visibility toggle
  const handleVisibilityToggle = (field) => {
    const isVisible = visibleColumns.includes(field);
    let nextVisible;
    if (isVisible) {
      if (visibleColumns.length <= 1) return;
      nextVisible = visibleColumns.filter((col) => col !== field);
    } else {
      nextVisible = [...visibleColumns, field];
    }
    onVisibleColumnsChange(nextVisible);
  };

  // Checkbox checklist toggle for value filters
  const handleValueToggle = (field, value) => {
    const currentChecked = getFieldCheckedValues(field);
    let nextChecked;
    if (currentChecked.includes(value)) {
      nextChecked = currentChecked.filter((v) => v !== value);
    } else {
      nextChecked = [...currentChecked, value];
    }
    onFiltersChange({
      ...activeFilters,
      [field]: nextChecked
    });
  };

  const handleSelectAllValues = (field, checked) => {
    const allVals = uniqueValuesMap[field] || [];
    onFiltersChange({
      ...activeFilters,
      [field]: checked ? [...allVals] : []
    });
  };

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal-box">
        {/* Header */}
        <div className="filter-modal-header">
          <h3>Table Settings & Filters</h3>
          <button type="button" className="close-x-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Body Split */}
        <div className="filter-modal-body">
          {/* Left Column list (Visibility control) */}
          <div className="columns-sidebar">
            <div className="sidebar-title">Columns & Visibility</div>
            <div className="sidebar-list">
              {columnKeys.map((field) => {
                const label = columns[field];
                const isVisible = visibleColumns.includes(field);
                const isSelected = activeTab === field;
                const checkedCount = getFieldCheckedValues(field).length;
                const totalCount = (uniqueValuesMap[field] || []).length;
                const isFiltered = activeFilters[field] !== undefined && checkedCount < totalCount;

                return (
                  <div 
                    key={field} 
                    className={`sidebar-item ${isSelected ? 'active-tab' : ''}`}
                    onClick={() => {
                      setActiveTab(field);
                      setValSearch('');
                    }}
                  >
                    <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isVisible} 
                        onChange={() => handleVisibilityToggle(field)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <span className="column-tab-label">{label}</span>
                    {isFiltered && <span className="active-filter-badge">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Value checklist container */}
          <div className="values-panel">
            {activeTab ? (
              <>
                <div className="panel-header">
                  <h4>Filter Values: {columns[activeTab]}</h4>
                  <div className="search-filter-box">
                    <input 
                      type="text" 
                      placeholder="Search values..." 
                      value={valSearch}
                      onChange={(e) => setValSearch(e.target.value)}
                      className="modal-val-search"
                    />
                  </div>
                </div>

                <div className="select-all-row">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={getFieldCheckedValues(activeTab).length === currentUniqueValues.length && currentUniqueValues.length > 0} 
                      onChange={(e) => handleSelectAllValues(activeTab, e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text"><b>Select All</b></span>
                  </label>
                </div>

                <div className="values-checklist">
                  {filteredUniqueValues.length > 0 ? (
                    filteredUniqueValues.map((val) => {
                      const isChecked = getFieldCheckedValues(activeTab).includes(val);
                      return (
                        <label key={val} className="checkbox-container value-item">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleValueToggle(activeTab, val)}
                          />
                          <span className="checkmark"></span>
                          <span className="label-text">{val}</span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="no-values-placeholder">No matching values</div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-tab-placeholder">Select a column on the left to configure filters</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="filter-modal-footer">
          <div className="footer-left-info">
            Selected columns: {visibleColumns.length} of {columnKeys.length}
          </div>
          <div className="footer-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
