/**
 * Reusable utility to filter datasets based on active filters and search query.
 */
export const filterDataset = (dataset, activeFilters, searchQuery, searchModeColumn, getPropValue, getHayContent) => {
  if (!dataset) return [];

  return dataset.filter((row) => {
    // 1. Apply active filter conditions (from FilterModal)
    if (Array.isArray(activeFilters)) {
      for (const filter of activeFilters) {
        if (filter.f && filter.v && filter.v.length > 0) {
          const val = getPropValue(row, filter.f) || '—';
          // Ensure comparison check uses .includes since filter.v is an array of selected option strings
          if (!filter.v.includes(String(val))) {
            return false;
          }
        }
      }
    } else if (activeFilters) {
      // Legacy object filters fallback
      for (const field of Object.keys(activeFilters)) {
        const checkedVals = activeFilters[field];
        if (checkedVals !== undefined && Array.isArray(checkedVals)) {
          const val = getPropValue(row, field) || '—';
          if (!checkedVals.includes(String(val))) {
            return false;
          }
        }
      }
    }

    // 2. Apply search box query (General search or specific column search)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (searchModeColumn) {
        const val = getPropValue(row, searchModeColumn);
        return String(val).toLowerCase().includes(q);
      } else {
        const hay = getHayContent ? getHayContent(row) : '';
        return String(hay).toLowerCase().includes(q);
      }
    }

    return true;
  });
};
