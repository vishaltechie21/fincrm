import React from 'react';

const Loading = ({ type = 'spinner', message = 'Loading...' }) => {
  if (type === 'skeleton') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
        <div style={{ height: '30px', backgroundColor: 'var(--panel2)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ height: '120px', backgroundColor: 'var(--panel2)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {message && <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{message}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;
