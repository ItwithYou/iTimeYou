import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Mobile-friendly select using a bottom sheet.
 * Props:
 *   value       – current selected value
 *   onChange     – callback(value)
 *   options      – [{ value, label, icon? }] or ['string', ...]
 *   placeholder  – button placeholder
 *   label        – sheet title
 *   className    – extra button classes
 */
export default function MobileSelect({ value, onChange, options = [], placeholder = 'Select', label, className = '' }) {
  const [open, setOpen] = useState(false);

  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selected = normalizedOptions.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full border border-border rounded-xl px-3 py-2.5 text-sm text-left flex items-center justify-between gap-2 outline-none focus:border-primary bg-card active:bg-muted/50 transition-colors min-h-[44px] ${className}`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon && <span>{selected.icon}</span>}
              {selected.label}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-3">
            <SheetTitle>{label || placeholder}</SheetTitle>
          </SheetHeader>
          <div role="listbox" aria-label={label || placeholder} className="space-y-1 max-h-[50vh] overflow-y-auto overscroll-contain">
            {normalizedOptions.map(opt => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors min-h-[48px] ${
                    isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground active:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {opt.icon && <span className="text-base">{opt.icon}</span>}
                    {opt.label}
                  </span>
                  {isActive && <Check size={18} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}