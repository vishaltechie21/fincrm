import React from 'react';
import './TruncatedText.css';

export default function TruncatedText({ text, limit = 40, className = '', style = {} }) {
  if (!text) return <span className={`truncated-text-empty ${className}`} style={style}>—</span>;

  const strText = String(text);
  const isTruncated = strText.length > limit;
  const displayText = isTruncated ? `${strText.slice(0, limit).trim()}...` : strText;

  return (
    <span
      className={`truncated-text-wrapper ${isTruncated ? 'has-tooltip' : ''} ${className}`}
      title={isTruncated ? strText : undefined}
      style={style}
    >
      {displayText}
    </span>
  );
}
