import { useState, useCallback } from 'react';

/**
 * useToast Hook
 * Manages toast notifications
 */
export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showSuccess = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message) => {
    showToast(message, 'error');
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
  };
};

export default useToast;
