import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarGrid({ value, onChange, min, max }) {
  const [viewDate, setViewDate] = useState(() => {
    const base = value ? new Date(value + 'T00:00:00') : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toISO = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-base">{MONTH_NAMES[month]} {year}</span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const iso = toISO(day);
          const isSelected = value === iso;
          const isDisabled = (min && iso < min) || (max && iso > max);
          const isToday = iso === new Date().toISOString().split('T')[0];

          return (
            <button
              key={iso}
              disabled={isDisabled}
              onClick={() => onChange(iso)}
              className={[
                'mx-auto w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isToday
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'hover:bg-muted text-foreground',
                isDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : '',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MobileDatePicker({ value, onChange, placeholder = 'Select date', label, min, max }) {
  const [open, setOpen] = useState(false);

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 outline-none focus:border-primary bg-background hover:border-primary/50 transition-colors"
      >
        <CalendarIcon size={14} className="text-muted-foreground flex-shrink-0" />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {displayValue || placeholder}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle>{label || placeholder}</SheetTitle>
          </SheetHeader>
          <CalendarGrid
            value={value}
            min={min}
            max={max}
            onChange={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}