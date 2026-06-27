import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
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
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 rounded-xl" align="start">
        {label && <div className="font-bold text-xs mb-2 px-2 pt-2 text-muted-foreground uppercase tracking-wider">{label}</div>}
        <div role="listbox" aria-label={label || placeholder} className="max-h-[50vh] overflow-y-auto overscroll-contain">
          {normalizedOptions.map(opt => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted active:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {opt.icon && <span className="text-base">{opt.icon}</span>}
                  {opt.label}
                </span>
                {isActive && <Check size={16} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}