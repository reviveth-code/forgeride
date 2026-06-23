import { useRef, useEffect } from 'react';
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
  const overlayRef = useRef(null);
  const sheetRef = useRef(null);
  const cancelRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Focus management + escape key + focus trap
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const timer = setTimeout(() => {
      cancelRef.current?.focus();
    }, 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Basic focus trap within the sheet
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        ref={sheetRef}
        className="bg-card rounded-t-3xl w-full max-w-md mx-auto pb-safe"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-5 py-3" id="bsp-title">{title}</p>
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }} role="listbox" aria-labelledby="bsp-title">
          {options.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); onClose(); }}
              className={`w-full flex items-center justify-between px-5 py-4 border-t border-border text-sm font-medium transition-colors
                ${value === opt.value ? 'text-forge-orange bg-forge-orange/5' : 'text-foreground'}`}
            >
              {opt.label}
              {value === opt.value && <Check className="w-4 h-4 text-forge-orange" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-border" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button ref={cancelRef} onClick={onClose} className="w-full py-3.5 rounded-2xl border-2 border-border text-muted-foreground font-bold text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}