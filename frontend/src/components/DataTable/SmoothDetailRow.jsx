import React, { useState, useEffect } from 'react';

/**
 * SmoothDetailRow — Renders expandable row content with smooth height and opacity
 * opening and closing transitions.
 */
const SmoothDetailRow = ({ isExpanded, colSpan, children, className = '' }) => {
  const [shouldRender, setShouldRender] = useState(isExpanded);
  const [isOpen, setIsOpen] = useState(isExpanded);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!shouldRender) return null;

  return (
    <tr className={`detail ${isOpen ? 'open' : 'closing'} ${className}`}>
      <td colSpan={colSpan} className="detail-cell">
        <div className={`detail-wrapper ${isOpen ? 'open' : ''}`}>
          <div className="detail-inner">
            {children}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default SmoothDetailRow;
