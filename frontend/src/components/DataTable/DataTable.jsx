/**
 * DataTable — Universal ERP Table Component
 *
 * Props:
 *  columns         {Array}    Required. Column definitions: { key, label, width, sortable, sticky, render }
 *  data            {Array}    Rows to display
 *  loading         {boolean}  Shows skeleton rows
 *  storageKey      {string}   localStorage prefix for column order/widths
 *  sortField       {string}   Currently sorted field key
 *  sortAsc         {boolean}
 *  onSort          {fn}       (fieldKey) => void
 *  onRowClick      {fn}       (row) => void
 *  onRowDoubleClick {fn}      (row) => void
 *  activeId        {string}   Currently active row identifier value
 *  idField         {string}   Which row property is the unique ID (default: first column key)
 *  onLoadMore      {fn}       Called when scrolled near bottom (infinite scroll)
 *  renderExpandedRow {fn}     (row) => ReactNode — renders accordion panel below row
 *  emptyMessage    {string}   Custom empty state text
 *  checkable       {boolean}  Show checkbox column
 *  selectedIds     {Set}      Externally controlled selection state
 *  onSelectionChange {fn}     (Set) => void
 */

import React, { useState, useRef, useCallback } from 'react';

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow = ({ columnCount }) => (
  <tr>
    {Array.from({ length: columnCount }).map((_, i) => (
      <td key={i} className="px-2 py-2">
        <div className="h-3 rounded animate-pulse bg-slate-200" style={{ width: `${40 + (i * 17 % 40)}%` }} />
      </td>
    ))}
  </tr>
);

// ─── DataTable ────────────────────────────────────────────────────────────────
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  storageKey = 'datatable',
  sortField,
  sortAsc = true,
  onSort,
  onRowClick,
  onRowDoubleClick,
  activeId,
  idField,
  onLoadMore,
  renderExpandedRow,
  emptyMessage = 'No records found.',
  checkable = false,
  selectedIds,
  onSelectionChange,
}) => {
  // Derive the ID field from first column if not provided
  const resolvedIdField = idField || (columns[0]?.key ?? 'id');

  // ── Column Order ──────────────────────────────────────────────────────────────
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_col_order`);
    const base = columns.map(c => c.key);
    if (!saved) return base;
    const parsed = JSON.parse(saved);
    return parsed.filter(k => base.includes(k));
  });

  // ── Column Widths ─────────────────────────────────────────────────────────────
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_col_widths`);
    return saved ? JSON.parse(saved) : {};
  });

  // ── Expanded Rows ─────────────────────────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState(new Set());

  // ── Internal Selection (uncontrolled fallback) ────────────────────────────────
  const [internalSelectedIds, setInternalSelectedIds] = useState(new Set());
  const effectiveSelectedIds = selectedIds ?? internalSelectedIds;
  const handleSelectionChange = onSelectionChange ?? setInternalSelectedIds;

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────────
  const dragKey = useRef(null);

  const handleDragStart = (e, key) => {
    dragKey.current = key;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    const from = dragKey.current;
    if (!from || from === targetKey) return;
    setColumnOrder(prev => {
      const next = [...prev];
      const fi = next.indexOf(from);
      const ti = next.indexOf(targetKey);
      if (fi === -1 || ti === -1) return prev;
      next.splice(fi, 1);
      next.splice(ti, 0, from);
      localStorage.setItem(`${storageKey}_col_order`, JSON.stringify(next));
      return next;
    });
  };

  // ── Column Resize ─────────────────────────────────────────────────────────────
  const resizeStart = useRef(null);

  const handleResizeMouseDown = (e, key, currentWidth) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStart.current = { x: e.clientX, key, startWidth: currentWidth || 120 };

    const onMouseMove = (me) => {
      if (!resizeStart.current) return;
      const delta = me.clientX - resizeStart.current.x;
      const newWidth = Math.max(50, resizeStart.current.startWidth + delta);
      setColumnWidths(prev => {
        const next = { ...prev, [resizeStart.current.key]: newWidth };
        localStorage.setItem(`${storageKey}_col_widths`, JSON.stringify(next));
        return next;
      });
    };
    const onMouseUp = () => {
      resizeStart.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Infinite Scroll ───────────────────────────────────────────────────────────
  const handleScroll = useCallback((e) => {
    if (!onLoadMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      onLoadMore();
    }
  }, [onLoadMore]);

  // ── Toggle Expand ─────────────────────────────────────────────────────────────
  const toggleExpand = (rowId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) { next.delete(rowId); } else { next.add(rowId); }
      return next;
    });
  };

  // ── Select All ────────────────────────────────────────────────────────────────
  const allIds = data.map(r => r[resolvedIdField]);
  const allSelected = allIds.length > 0 && allIds.every(id => effectiveSelectedIds.has(id));
  const someSelected = allIds.some(id => effectiveSelectedIds.has(id));

  const handleSelectAll = () => {
    if (allSelected) {
      handleSelectionChange(new Set());
    } else {
      handleSelectionChange(new Set(allIds));
    }
  };

  const handleSelectRow = (e, rowId) => {
    e.stopPropagation();
    handleSelectionChange(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) { next.delete(rowId); } else { next.add(rowId); }
      return next;
    });
  };

  // ── Ordered column definitions ────────────────────────────────────────────────
  const orderedColumns = columnOrder
    .map(key => columns.find(c => c.key === key))
    .filter(Boolean);

  const totalCols = orderedColumns.length + (checkable ? 1 : 0) + (renderExpandedRow ? 1 : 0);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="data-table-container" onScroll={handleScroll}>
      <table className="data-table">
        {/* HEADER */}
        <thead>
          <tr>
            {/* Checkbox column */}
            {checkable && (
              <th style={{ width: 32, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            {/* Expand toggle column */}
            {renderExpandedRow && (
              <th style={{ width: 32, textAlign: 'center' }}>Detail</th>
            )}
            {/* Data columns */}
            {orderedColumns.map(col => {
              const width = columnWidths[col.key] || col.width;
              const isSorted = sortField === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: width || undefined, minWidth: col.minWidth || 60 }}
                  className="sortable-header clickable-header"
                  draggable
                  onDragStart={e => handleDragStart(e, col.key)}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.key)}
                  onClick={() => col.sortable !== false && onSort && onSort(col.key)}
                  title={col.sortable !== false ? `Sort by ${col.label}` : col.label}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable !== false && isSorted && (
                      <span style={{ color: '#c9973c', fontSize: 9 }}>{sortAsc ? '▲' : '▼'}</span>
                    )}
                  </span>
                  {/* Resize handle */}
                  <span
                    className="column-resizer"
                    onMouseDown={e => handleResizeMouseDown(e, col.key, width || col.width || 120)}
                    onClick={e => e.stopPropagation()}
                  />
                </th>
              );
            })}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} columnCount={totalCols} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontStyle: 'italic', fontSize: 11 }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowId = row[resolvedIdField];
              const isActive = activeId !== undefined && String(rowId) === String(activeId);
              const isExpanded = expandedIds.has(rowId);
              const isEven = idx % 2 === 1;

              return (
                <React.Fragment key={rowId}>
                  {/* Data row */}
                  <tr
                    className={[
                      'master-row',
                      isExpanded ? 'open-row' : '',
                      isEven ? 'even-row' : 'odd-row',
                      'clickable-row',
                      isActive ? 'active-row' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => onRowClick && onRowClick(row)}
                    onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                    style={{ cursor: onRowClick ? 'pointer' : undefined }}
                  >
                    {/* Checkbox cell */}
                    {checkable && (
                      <td style={{ textAlign: 'center' }} onClick={e => handleSelectRow(e, rowId)}>
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={effectiveSelectedIds.has(rowId)}
                            onChange={() => {}}
                          />
                          <span className="checkmark" />
                        </label>
                      </td>
                    )}
                    {/* Expand toggle cell */}
                    {renderExpandedRow && (
                      <td
                        style={{ textAlign: 'center' }}
                        onClick={e => { e.stopPropagation(); toggleExpand(rowId); }}
                      >
                        <span className="twisty-icon" style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          {isExpanded ? '−' : '＋'}
                        </span>
                      </td>
                    )}
                    {/* Data cells */}
                    {orderedColumns.map(col => (
                      <td
                        key={col.key}
                        className={[col.cellClass || '', col.sortable !== false ? 'hit' : ''].filter(Boolean).join(' ')}
                        style={col.cellStyle}
                        title={col.getTitle ? col.getTitle(row) : undefined}
                        onClick={col.onCellClick ? e => col.onCellClick(e, row, col.key) : undefined}
                      >
                        {col.render ? col.render(row, isActive) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && renderExpandedRow && (
                    <tr className="detail">
                      <td colSpan={totalCols} className="detail-cell">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
