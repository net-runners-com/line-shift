/**
 * 月表示カレンダー
 */

import { useState, useMemo } from 'react';
import type { Shift } from '@/types/shift';
import { parseDateStr, formatDateJa, formatDateForInput, isSameDay } from '@/utils/date';

interface CalendarProps {
  shifts: Shift[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onGoToRegister: (date: Date) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function Calendar({
  shifts,
  selectedDate,
  onSelectDate,
  onGoToRegister,
}: CalendarProps) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { title, days } = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

    const cells: { day: number; date: Date; isCurrentMonth: boolean; isToday: boolean; hasShift: boolean }[] = [];

    for (let i = 0; i < totalCells; i++) {
      if (i < startPad) {
        const d = new Date(viewYear, viewMonth, 1 - (startPad - i));
        cells.push({
          day: d.getDate(),
          date: d,
          isCurrentMonth: false,
          isToday: isSameDay(d, now),
          hasShift: false,
        });
      } else {
        const day = i - startPad + 1;
        if (day > daysInMonth) {
          const d = new Date(viewYear, viewMonth + 1, day - daysInMonth);
          cells.push({
            day: d.getDate(),
            date: d,
            isCurrentMonth: false,
            isToday: isSameDay(d, now),
            hasShift: false,
          });
        } else {
          const d = new Date(viewYear, viewMonth, day);
          const hasShift = shifts.some((s) => {
            const sd = parseDateStr(s.date);
            return isSameDay(sd, d);
          });
          cells.push({
            day,
            date: d,
            isCurrentMonth: true,
            isToday: isSameDay(d, now),
            hasShift,
          });
        }
      }
    }

    return {
      title: `${viewYear}年${viewMonth + 1}月`,
      days: cells,
    };
  }, [viewYear, viewMonth, shifts, now]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (cell: (typeof days)[0]) => {
    if (!cell.isCurrentMonth) return;
    onSelectDate(cell.date);
  };

  return (
    <>
      <div className="card">
        <div className="card-title">日付を選択</div>
        <div className="calendar-nav">
          <button type="button" onClick={goPrev} aria-label="前月">
            &laquo;
          </button>
          <span>{title}</span>
          <button type="button" onClick={goNext} aria-label="翌月">
            &raquo;
          </button>
        </div>
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <span key={w} className="calendar-weekday">
              {w}
            </span>
          ))}
          {days.map((cell, i) => (
            <button
              key={i}
              type="button"
              className={`calendar-day ${cell.isCurrentMonth ? '' : 'other-month'} ${cell.isToday ? 'today' : ''} ${selectedDate && isSameDay(cell.date, selectedDate) ? 'selected' : ''} ${cell.hasShift ? 'has-shift' : ''}`}
              disabled={!cell.isCurrentMonth}
              onClick={() => handleDayClick(cell)}
              data-date={formatDateForInput(cell.date)}
            >
              {cell.day}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="card">
          <div className="card-title">{formatDateJa(selectedDate)}</div>
          <button type="button" className="btn btn-primary" onClick={() => onGoToRegister(selectedDate)}>
            この日でシフトを登録
          </button>
        </div>
      )}
    </>
  );
}
