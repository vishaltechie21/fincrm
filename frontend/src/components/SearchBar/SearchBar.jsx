import { useState, useEffect } from 'react';
import { Search } from '../Icon';

const SearchBar = ({ onSearch, value, placeholder = "Search..." }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');

  // Debounce search parameter
  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm, onSearch]);

  return (
    <div className="search-bar-wrapper" style={{ position: 'relative', width: '200px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          backgroundColor: 'var(--panel2)',
          border: '1px solid var(--border)',
          color: 'var(--text-h)',
          padding: '4px 28px 4px 8px',
          borderRadius: '5px',
          fontSize: '10px',
          width: '100%',
          outline: 'none',
          boxSizing: 'border-box',
          height: '24px'
        }}
      />
      <Search
        size={13}
        style={{
          position: 'absolute',
          right: '8px',
          color: 'var(--muted)',
          pointerEvents: 'none'
        }}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          style={{
            position: 'absolute',
            right: '24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            outline: 'none'
          }}
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
