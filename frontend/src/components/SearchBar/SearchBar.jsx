import React, { useState, useEffect } from 'react';

const SearchBar = ({ onSearch, value }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');

  // Debounce search parameter
  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm, onSearch]);

  return (
    <div className="search-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: 0 }}>
      <input
        type="text"
        placeholder="Search by ID, Company Name, City, State..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          backgroundColor: 'var(--panel2)',
          border: '1px solid var(--border)',
          color: 'var(--text-h)',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          width: '100%',
          flex: 1,
          minWidth: 0,
          outline: 'none'
        }}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="btn btn-ghost"
          style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
};

export default SearchBar;
