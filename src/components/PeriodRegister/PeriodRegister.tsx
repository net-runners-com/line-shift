/**
 * 期間内のシフト提出UI（一括入力・全削除・提出）
 */

import { useState, useCallback } from 'react';
import type { Shift, ShiftPeriod } from '@/types/shift';
import { formatDateJa, formatDateShort, parseDateStr, dateRange } from '@/utils/date';
import { addShiftsBulk, deleteDraftShiftsInPeriod, submitPeriod, getShifts } from '@/services/shiftStorage';

const PATTERNS: { label: string; start: string; end: string }[] = [
  { label: '10:00～18:00', start: '10:00', end: '18:00' },
  { label: '10:00～15:00', start: '10:00', end: '15:00' },
  { label: '09:00～17:00', start: '09:00', end: '17:00' },
];

interface PeriodRegisterProps {
  period: ShiftPeriod;
  userName: string;
  lineUserId: string;
  groupId: string;
  draftShifts: Shift[];
  submitted: boolean;
  onRefresh: () => void;
  onDeleteShift: (id: string) => void;
}

export function PeriodRegister({
  period,
  userName,
  lineUserId,
  groupId,
  draftShifts,
  submitted,
  onRefresh,
  onDeleteShift,
}: PeriodRegisterProps) {
  const [batchPattern, setBatchPattern] = useState(PATTERNS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const workDays = draftShifts.filter((s) => s.type !== 'day_off').length;

  const handleBatchAdd = useCallback(async () => {
    const dates = Array.from(dateRange(period.start_date, period.end_date));
    if (dates.length === 0) return;
    const items = dates.map((d) => ({
      date: d,
      start: batchPattern.start,
      end: batchPattern.end,
      type: 'work' as const,
    }));
    setSubmitting(true);
    try {
      await addShiftsBulk(lineUserId, items, groupId, period.id, 'work');
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  }, [period, batchPattern, lineUserId, groupId, onRefresh]);

  const handleCopyFromPrevious = useCallback(async () => {
    const prevShifts = await getShifts(lineUserId, groupId, { status: 'confirmed' });
    const periodStart = parseDateStr(period.start_date);
    const periodEnd = parseDateStr(period.end_date);
    const items = prevShifts
      .filter((s) => s.type === 'work')
      .map((s) => {
        const d = parseDateStr(s.date);
        const sameMonth = d.getMonth() === periodStart.getMonth() && d.getFullYear() === periodStart.getFullYear();
        if (!sameMonth) return null;
        const day = d.getDate();
        const newDate = new Date(periodStart);
        newDate.setDate(day);
        if (newDate > periodEnd) return null;
        return {
          date: newDate.toISOString().slice(0, 10),
          start: s.start,
          end: s.end,
          type: 'work' as const,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
    if (items.length === 0) {
      alert('コピーできる確定シフトがありません。');
      return;
    }
    setSubmitting(true);
    try {
      await addShiftsBulk(lineUserId, items, groupId, period.id, 'work');
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  }, [period, lineUserId, groupId, onRefresh]);

  const handleDeleteAll = useCallback(async () => {
    if (!confirm('この期間の登録をすべて削除しますか？')) return;
    setDeleting(true);
    try {
      await deleteDraftShiftsInPeriod(lineUserId, period.id);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  }, [period.id, lineUserId, onRefresh]);

  const handleSubmit = useCallback(async () => {
    if (draftShifts.length === 0) {
      alert('シフトを登録してから提出してください。');
      return;
    }
    if (!confirm('シフトを提出しますか？提出後は編集できません。')) return;
    setSubmitting(true);
    try {
      const ok = await submitPeriod(lineUserId, period.id);
      if (ok) onRefresh();
      else alert('提出に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  }, [lineUserId, period.id, draftShifts.length, onRefresh]);

  if (submitted) {
    return (
      <div className="card period-register">
        <div className="card-title">{userName}さん専用提出ページ</div>
        <p className="period-submitted-msg">この期間は提出済みです。</p>
        <p className="period-dates">
          {formatDateShort(parseDateStr(period.start_date))} ～ {formatDateShort(parseDateStr(period.end_date))}
        </p>
      </div>
    );
  }

  return (
    <div className="card period-register">
      <div className="card-title">{userName}さん専用提出ページ</div>
      <p className="period-dates">
        {period.start_date} ～ {period.end_date}
      </p>

      <div className="period-actions">
        <div className="form-group">
          <label>一括入力（パターン）</label>
          <select
            value={PATTERNS.findIndex((p) => p.label === batchPattern.label)}
            onChange={(e) => setBatchPattern(PATTERNS[Number(e.target.value)] ?? PATTERNS[0])}
          >
            {PATTERNS.map((p, i) => (
              <option key={p.label} value={i}>{p.label}</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleBatchAdd} disabled={submitting}>
          一括入力
        </button>
        <button type="button" className="btn btn-outline" onClick={handleCopyFromPrevious} disabled={submitting}>
          提出履歴から自動入力
        </button>
        <button type="button" className="btn btn-danger" onClick={handleDeleteAll} disabled={deleting || draftShifts.length === 0}>
          全削除
        </button>
      </div>

      <div className="period-summary">出勤日数: {workDays}日</div>

      <ul className="shift-list period-shift-list">
        {draftShifts
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((s) => {
            const d = parseDateStr(s.date);
            return (
              <li key={s.id} className="shift-item">
                <div>
                  <span className="date">{formatDateJa(d)}</span>
                  <div className="time">
                    {s.type === 'day_off' ? '休み' : `${s.start} ～ ${s.end}`}
                    {s.memo ? ` · ${s.memo}` : ''}
                  </div>
                </div>
                <button type="button" onClick={() => onDeleteShift(s.id)} aria-label="削除">
                  削除
                </button>
              </li>
            );
          })}
      </ul>

      <button type="button" className="btn btn-primary period-submit-btn" onClick={handleSubmit} disabled={submitting || draftShifts.length === 0}>
        シフトを提出
      </button>
    </div>
  );
}
