import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch Hook
 * Fetches data on mount with loading/error states
 * Prevents duplicate requests and memory leaks
 */
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const fetch = useCallback(async () => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    isMountedRef.current = true;
    fetch();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetch, ...dependencies]);

  const refetch = useCallback(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    setData,
    loading,
    error,
    refetch,
  };
};

export default useFetch;
