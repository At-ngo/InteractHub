import React from 'react';

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

const ConfirmModal: React.FC<Props> = ({ open, title, message, onCancel, onConfirm, confirmLabel = 'Xác nhận' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-11/12 max-w-lg">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {message && <p className="mb-4 text-sm text-linkedin-muted">{message}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-1 border rounded">Hủy</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white rounded">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
