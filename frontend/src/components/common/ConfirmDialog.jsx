import Modal from './Modal';
import Button from './Button';

/**
 * ConfirmDialog Component
 * Reusable confirmation dialog
 */
const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}) => {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-white/60 mb-6">{message}</p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Processing…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
