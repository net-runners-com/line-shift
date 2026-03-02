/**
 * シフト登録フォーム
 */

import { useState, useEffect } from 'react';
import type { ShiftFormData } from '@/types/shift';
import { formatDateForInput } from '@/utils/date';

interface ShiftFormProps {
  initialDate?: Date;
  onSubmit: (data: ShiftFormData) => void | Promise<void>;
}

const defaultValues: ShiftFormData = {
  date: formatDateForInput(new Date()),
  start: '09:00',
  end: '18:00',
  memo: '',
};

export function ShiftForm({ initialDate, onSubmit }: ShiftFormProps) {
  const [form, setForm] = useState<ShiftFormData>(defaultValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setForm((f) => ({ ...f, date: formatDateForInput(initialDate) }));
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) {
      alert('日付を選択してください。');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        date: form.date,
        start: form.start,
        end: form.end,
        memo: form.memo?.trim() || undefined,
      });
      setForm({ ...defaultValues, date: form.date });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">シフトを登録</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="inputDate">日付</label>
          <input
            id="inputDate"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </div>
        <div className="row-2">
          <div className="form-group">
            <label htmlFor="inputStart">開始時刻</label>
            <input
              id="inputStart"
              type="time"
              value={form.start}
              onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputEnd">終了時刻</label>
            <input
              id="inputEnd"
              type="time"
              value={form.end}
              onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="inputMemo">メモ（任意）</label>
          <input
            id="inputMemo"
            type="text"
            value={form.memo ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="例：早番"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '登録中...' : '登録する'}
        </button>
      </form>
    </div>
  );
}
