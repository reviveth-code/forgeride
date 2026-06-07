import { useRef } from 'react';
import { Check } from 'lucide-react';

/**
 * Mobile bottom-sheet replacement for <select>.
 * Props:
 *   open: bool
 *   onClose: fn
 *   title: string
 *   options: [{ value, label }]
 *   value: string
 *   onChange: fn(value)
 */
export default function BottomSheetPicker({ open, onClose, title, options, value, onChange }) {
  const overlayRef = useRef();
  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto pb-safe">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-5 py-3">{title}</p>
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); onClose(); }}
              className={`w-full flex items-center justify-between px-5 py-4 border-t border-gray-50 text-sm font-medium transition-colors
                ${value === opt.value ? 'text-forge-orange bg-forge-orange/5' : 'text-gray-800'}`}
            >
              {opt.label}
              {value === opt.value && <Check className="w-4 h-4 text-forge-orange" />}
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}