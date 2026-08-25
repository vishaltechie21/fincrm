import React, { useEffect } from 'react';

const Notification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'var(--green)',
    error: 'var(--red)',
    warning: 'var(--yellow)',
    info: 'var(--accent)'
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: bgColors[type] || 'var(--green)',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontWeight: '600',
        fontSize: '13px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '0 4px',
          outline: 'none'
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Notification;
