/**
 * useServerTable — Server-side data hook with infinite scroll
 *
 * Usage:
 *   const { rows, total, isLoading, hasMore, loadMore, sort, setSort, setSearch, reload } =
 *     useServerTable({ fetchFn, defaultSort: 'id', limit: 50 });
 *
 * fetchFn signature:
 *   async ({ page, limit, sort, sortDir, search, filters }) => ({ data: [], total: 0 })
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_LIMIT = 50;
const DEBOUNCE_MS = 300;

export const useServerTable = ({
  fetchFn,
  defaultSort = '',
  defaultSortDir = 'asc',
  limit = DEFAULT_LIMIT,
  initialFilters = {},
}) => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [sort, setSort] = useState(defaultSort);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [search, setSearchRaw] = useState('');
  const [filters, setFilters] = useState(initialFilters);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  // AbortController ref for cancelling stale requests
  const abortRef = useRef(null);

  // Set search with debounce
  const setSearch = useCallback((val) => {
    setSearchRaw(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, DEBOUNCE_MS);
  }, []);

  // Handle sort toggle
  const handleSort = useCallback((field) => {
    setSort(prev => {
      if (prev === field) {
        // Second click on same field → reset to default
        setSortDir('asc');
        return defaultSort;
      }
      setSortDir('asc');
      return field;
    });
  }, [defaultSort]);

  // Reset and fetch page 1 when params change
  const fetchPage1 = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setPage(1);

    try {
      const result = await fetchFn({
        page: 1,
        limit,
        sort,
        sortDir,
        search: debouncedSearch,
        filters,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const incoming = result?.data ?? result ?? [];
      const incomingTotal = result?.total ?? incoming.length;
      setRows(incoming);
      setTotal(incomingTotal);
      setHasMore(incoming.length >= limit && incoming.length < incomingTotal);
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      console.error('[useServerTable] fetchPage1 error:', err);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [fetchFn, limit, sort, sortDir, debouncedSearch, filters]);

  // Append next page (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const result = await fetchFn({
        page: nextPage,
        limit,
        sort,
        sortDir,
        search: debouncedSearch,
        filters,
      });
      const incoming = result?.data ?? result ?? [];
      const incomingTotal = result?.total ?? (rows.length + incoming.length);
      setRows(prev => [...prev, ...incoming]);
      setTotal(incomingTotal);
      setPage(nextPage);
      setHasMore(incoming.length >= limit && (rows.length + incoming.length) < incomingTotal);
    } catch (err) {
      console.error('[useServerTable] loadMore error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, isLoading, page, fetchFn, limit, sort, sortDir, debouncedSearch, filters, rows.length]);

  // Re-fetch from page 1 whenever sort/filter/search changes
  useEffect(() => {
    fetchPage1();
  }, [fetchPage1]);

  // Manual reload trigger
  const reload = useCallback(() => {
    fetchPage1();
  }, [fetchPage1]);

  return {
    rows,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    sort,
    sortDir,
    setSort: handleSort,
    search,
    setSearch,
    filters,
    setFilters,
    reload,
  };
};
