import React from 'react';

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  type = 'text',
  error,
  style,
  maxLength
}) => {
  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`} style={style}>
      <label htmlFor={name}>
        {label} {required && <span className="req">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        className={`${readOnly ? 'readonly' : ''} ${disabled ? 'disabled-input' : ''}`}
        maxLength={maxLength}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormField;
