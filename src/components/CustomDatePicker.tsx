'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function CustomDatePicker({
  value,
  onChange,
  className = '',
  placeholder = 'Pilih Tanggal'
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial date
  const today = new Date();
  const initialDate = value ? new Date(value) : today;
  
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11
  
  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday = 0
  
  const calendarCells = [];
  
  // Padding from previous month
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false
    });
  }
  
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true
    });
  }
  
  // Padding for next month to complete the row
  const remainingCells = 42 - calendarCells.length; // 6 rows standard
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false
    });
  }

  const handleDateSelect = (year: number, month: number, day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${year}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  // Format display date
  const getDisplayDate = () => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const isSelectedDate = (year: number, month: number, day: number) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  };

  const isToday = (year: number, month: number, day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center h-[42px] px-3.5 bg-white border border-black/10 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black focus:shadow-[0_0_0_1px_#000000] cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <CalendarIcon className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />
        <span className={value ? 'text-black font-bold' : 'text-neutral-400 font-medium'}>
          {getDisplayDate() || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[48px] left-0 z-50 w-72 bg-white border border-black/10 rounded-xl p-4 shadow-xl animate-dropdown-reveal">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-black cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-black">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-black cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const selected = isSelectedDate(cell.year, cell.month, cell.day);
              const current = isToday(cell.year, cell.month, cell.day);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleDateSelect(cell.year, cell.month, cell.day)}
                  className={`
                    h-8 w-8 rounded-lg text-xs font-semibold font-mono flex items-center justify-center cursor-pointer transition-all duration-200
                    ${cell.isCurrentMonth ? 'text-black' : 'text-neutral-300'}
                    ${selected 
                      ? 'bg-black text-white font-bold' 
                      : 'hover:bg-neutral-100'}
                    ${current && !selected ? 'border border-black/40' : ''}
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
