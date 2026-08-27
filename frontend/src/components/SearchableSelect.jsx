import { useState, useEffect, useRef } from 'react';
import './SearchableSelect.css';

const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  style,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue) => {
    if (disabled) return;
    
    // Simulate target event format for forms
    onChange({
      target: {
        name,
        value: optionValue
      }
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  // Filter options based on search term (case-insensitive)
  const filteredOptions = options.filter((option) => {
    const optLabel = typeof option === 'object' && option !== null ? option.label : option;
    return String(optLabel).toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div 
      className={`form-field searchable-select-field ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`} 
      style={style}
      ref={containerRef}
    >
      <label htmlFor={name}>
        {label} {required && <span className="req">*</span>}
      </label>
      
      <div className="field-control-container">
        <div className="searchable-select-wrapper">
          <input
            type="text"
            id={name}
            name={name}
            value={isOpen ? searchTerm : (value || '')}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            placeholder={value ? '' : `-- Select ${label} --`}
            disabled={disabled}
            autoComplete="off"
            className="searchable-select-input"
          />
          <span className="dropdown-arrow-icon">▼</span>
          
          {isOpen && !disabled && (
            <div className="dropdown-options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, index) => {
                  const isObj = typeof opt === 'object' && opt !== null;
                  const optValue = isObj ? opt.value : opt;
                  const optLabel = isObj ? opt.label : opt;
                  const isSelected = optValue === value;
                  
                  return (
                    <div
                      key={`${optValue}-${index}`}
                      className={`dropdown-option-item ${isSelected ? 'selected' : ''}`}
                      onMouseDown={() => handleOptionClick(optValue)}
                    >
                      {optLabel}
                    </div>
                  );
                })
              ) : (
                <div className="dropdown-option-item no-results">
                  No matching options
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchableSelect;
