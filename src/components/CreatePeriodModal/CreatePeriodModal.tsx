/**
 * 期間作成モーダル
 */

import { useState } from 'react';
import type { ShiftPeriod } from '@/types/shift';
import { formatDateForInput } from '@/utils/date';

interface CreatePeriodModalProps {
  groupId: string;
  onCreate: (p: ShiftPeriod) => void;
  onClose: () => void;
  createPeriod: (
    groupId: string,
    name: string,
    startDate: string,
    endDate: string,
    deadlineAt?: string | null
  ) => Promise<ShiftPeriod | null>;
}

export function CreatePeriodModal({
  groupId,
  onCreate,
  onClose,
  createPeriod,
}: CreatePeriodModalProps) {
  const now = new Date();
  const endNext = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(formatDateForInput(now));
  const [endDate, setEndDate] = useState(formatDateForInput(endNext));
  const [deadlineStr, setDeadlineStr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('期間名を入力してください。');
      return;
    }
    if (startDate > endDate) {
      alert('開始日は終了日より前にしてください。');
      return;
    }
    setSaving(true);
    try {
      const deadline = deadlineStr ? new Date(deadlineStr).toISOString() : null;
      const p = await createPeriod(groupId, name.trim(), startDate, endDate, deadline);
      if (p) {
        onCreate(p);
        onClose();
      } else {
        alert('期間の作成に失敗しました。');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-title">シフト期間を作成</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>期間名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 2月前半"
              required
            />
          </div>
          <div className="form-group">
            <label>開始日</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>終了日</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>締切（任意）</label>
            <input
              type="datetime-local"
              value={deadlineStr}
              onChange={(e) => setDeadlineStr(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
