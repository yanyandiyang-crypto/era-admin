import React from 'react';

interface ResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  notes: string;
  setNotes: (notes: string) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  notes,
  setNotes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Resolve Incident</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-700">Please provide resolution notes.</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="What was done to resolve the incident?"
          />
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!notes.trim()}
            className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};
