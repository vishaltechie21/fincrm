import React from 'react';

const TextareaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  style,
  rows = 3,
  maxLength,
  disabled = false
}) => {
  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`} style={style}>
      <label htmlFor={name}>
        {label} {required && <span className="req">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default TextareaField;
