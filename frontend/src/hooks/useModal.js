import { useState, useCallback } from 'react';

/**
 * useModal Hook
 * Manages modal state
 */
export const useModal = () => {
  const [modal, setModal] = useState(null);

  const openModal = useCallback((modalData) => {
    setModal(modalData);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const isOpen = modal !== null;

  return {
    modal,
    isOpen,
    openModal,
    closeModal,
  };
};

export default useModal;
