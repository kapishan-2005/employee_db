import { useState, useMemo } from 'react';

/**
 * useSearch Hook
 * Manages search/filter functionality
 */
export const useSearch = (items, searchFields) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return items;

    const searchLower = search.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) =>
        String(item[field] || '').toLowerCase().includes(searchLower)
      )
    );
  }, [items, search, searchFields]);

  return {
    search,
    setSearch,
    filtered,
  };
};

export default useSearch;
