/**
 * 確定シフト一覧（status=confirmed）
 */

import type { Shift } from '@/types/shift';
import { formatDateJa, parseDateStr } from '@/utils/date';

interface ConfirmedListProps {
  shifts: Shift[];
  loading?: boolean;
}

export function ConfirmedList({ shifts, loading }: ConfirmedListProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-title">確定シフト</div>
        <div className="empty-state">読み込み中...</div>
      </div>
    );
  }

  const confirmed = shifts.filter((s) => s.status === 'confirmed').sort((a, b) => a.date.localeCompare(b.date));

  if (confirmed.length === 0) {
    return (
      <div className="card">
        <div className="card-title">確定シフト</div>
        <div className="empty-state">
          確定されたシフトはまだありません。提出したシフトは管理者が確定するとここに表示されます。
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">確定シフト</div>
      <ul className="shift-list">
        {confirmed.map((s) => {
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
