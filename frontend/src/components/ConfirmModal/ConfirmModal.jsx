import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title = "Confirm Action", message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <span className="confirm-warn-icon">⚠️</span>
          <h4>{title}</h4>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
