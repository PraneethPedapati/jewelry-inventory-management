import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './button';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  min,
  max
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const days = [];

    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    const dateString = today.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (min) {
      const minDate = new Date(min);
      if (date < minDate) return true;
    }
    if (max) {
      const maxDate = new Date(max);
      if (date > maxDate) return true;
    }
    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between border-brand-border text-brand-primary hover:bg-brand-ultra-light"
      >
        <span className={selectedDate ? 'text-brand-primary' : 'text-brand-medium'}>
          {selectedDate ? formatDisplayValue() : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-brand-primary" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-brand-bg border border-brand-border rounded-lg shadow-lg z-50 w-64">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-brand-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-brand-ultra-light text-brand-primary"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <h3 className="text-xs font-medium text-brand-primary">{monthName}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="p-1 hover:bg-brand-ultra-light text-brand-primary"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-0.5 p-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-6 text-xs font-medium text-brand-primary"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 p-1.5">
            {days.map(({ date, isCurrentMonth }, index) => {
              const disabled = isDateDisabled(date);
              const today = isToday(date);
              const selected = isSelected(date);

              return (
                <button
                  key={index}
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`
                    flex items-center justify-center h-6 text-xs rounded transition-colors
                    ${disabled
                      ? 'text-brand-light cursor-not-allowed'
                      : isCurrentMonth
                        ? 'text-brand-primary hover:bg-brand-ultra-light'
                        : 'text-brand-medium hover:bg-brand-ultra-light'
                    }
                    ${selected
                      ? 'bg-brand-primary text-white hover:bg-brand-shade'
                      : today
                        ? 'border border-brand-primary text-brand-primary'
                        : ''
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-2 border-t border-brand-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-brand-primary hover:bg-brand-ultra-light"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-xs text-brand-primary hover:bg-brand-ultra-light"
            >
              Today
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker; 
