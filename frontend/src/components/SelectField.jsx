import React from 'react';

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  style,
  disabled = false
}) => {
  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`} style={style}>
      <label htmlFor={name}>
        {label} {required && <span className="req">*</span>}
      </label>
      <select id={name} name={name} value={value} onChange={onChange} disabled={disabled}>
        <option value="">-- Select {label} --</option>
        {options.map((opt) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const optValue = isObj ? opt.value : opt;
          const optLabel = isObj ? opt.label : opt;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default SelectField;
