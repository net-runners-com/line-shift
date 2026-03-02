/**
 * シフト期間の選択（グループ用）
 */

import type { ShiftPeriod } from '@/types/shift';
import { formatDateShort, parseDateStr } from '@/utils/date';

interface PeriodSelectorProps {
  periods: ShiftPeriod[];
  selectedId: string | null;
  onSelect: (period: ShiftPeriod | null) => void;
  onCreatePeriod?: () => void;
  disabled?: boolean;
}

export function PeriodSelector({
  periods,
  selectedId,
  onSelect,
  onCreatePeriod,
  disabled,
}: PeriodSelectorProps) {
  if (periods.length === 0) {
    return (
      <div className="card period-selector">
        <div className="card-title">シフト期間を選択</div>
        <p className="period-empty">期間がありません。</p>
        {onCreatePeriod && (
          <button type="button" className="btn btn-primary" onClick={onCreatePeriod} disabled={disabled}>
            期間を作成
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card period-selector">
      <div className="card-title">提出したいシフト期間を選択</div>
      <div className="period-cards">
        {periods.map((p) => {
          const startD = parseDateStr(p.start_date);
          const endD = parseDateStr(p.end_date);
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`period-card ${isSelected ? 'period-card--selected' : ''}`}
              onClick={() => onSelect(isSelected ? null : p)}
              disabled={disabled}
            >
              <span className="period-card-label">{p.name}</span>
              <span className="period-card-dates">
                {formatDateShort(startD)} ～ {formatDateShort(endD)}
              </span>
              {p.deadline_at && (
                <span className="period-card-deadline">
                  締切 {new Date(p.deadline_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span className="period-card-action">{isSelected ? '選択中' : '選択する'}</span>
            </button>
          );
        })}
      </div>
      {onCreatePeriod && (
        <button type="button" className="btn btn-outline period-create-btn" onClick={onCreatePeriod} disabled={disabled}>
          期間を新規作成
        </button>
      )}
    </div>
  );
}
