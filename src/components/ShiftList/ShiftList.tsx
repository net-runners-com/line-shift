/**
 * シフト一覧
 */

import { useState } from 'react';
import type { Shift } from '@/types/shift';
import { formatDateJa, parseDateStr } from '@/utils/date';
import { downloadShiftsAsCSV, downloadShiftsAsJSON } from '@/utils/export';
import { exportShiftsToGoogleSheet } from '@/services/googleSheetExport';
import { env } from '@/config/env';

interface ShiftListProps {
  shifts: Shift[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function ShiftList({ shifts, onDelete, loading }: ShiftListProps) {
  const [sheetExporting, setSheetExporting] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const handleExportCSV = () => {
    downloadShiftsAsCSV(shifts);
  };

  const handleExportJSON = () => {
    downloadShiftsAsJSON(shifts);
  };

  const handleExportSheet = async () => {
    if (!env.googleClientId) {
      setSheetError('Google Client ID が設定されていません。.env に VITE_GOOGLE_CLIENT_ID を設定してください。');
      return;
    }
    setSheetError(null);
    setSheetExporting(true);
    try {
      const url = await exportShiftsToGoogleSheet(shifts);
      window.open(url, '_blank');
    } catch (e) {
      setSheetError(e instanceof Error ? e.message : 'スプレッドシートの出力に失敗しました');
    } finally {
      setSheetExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-title">登録したシフト</div>
        <div className="empty-state">読み込み中...</div>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="card">
        <div className="card-title">登録したシフト</div>
        <div className="empty-state">
          まだシフトがありません。カレンダーで日付を選んで登録しましょう。
        </div>
        <ExportSection shifts={[]} onExportCSV={handleExportCSV} onExportJSON={handleExportJSON} onExportSheet={handleExportSheet} sheetExporting={sheetExporting} sheetError={sheetError} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">登録したシフト</div>
      <ul className="shift-list">
        {shifts.map((s) => {
          const d = parseDateStr(s.date);
          return (
            <li key={s.id} className="shift-item">
              <div>
                <span className="date">{formatDateJa(d)}</span>
                <div className="time">
                  {s.start} ～ {s.end}
                  {s.memo ? ` · ${s.memo}` : ''}
                </div>
              </div>
              <button type="button" onClick={() => onDelete(s.id)} aria-label="削除">
                削除
              </button>
            </li>
          );
        })}
      </ul>
      <ExportSection shifts={shifts} onExportCSV={handleExportCSV} onExportJSON={handleExportJSON} onExportSheet={handleExportSheet} sheetExporting={sheetExporting} sheetError={sheetError} />
    </div>
  );
}

function ExportSection({
  shifts,
  onExportCSV,
  onExportJSON,
  onExportSheet,
  sheetExporting,
  sheetError,
}: {
  shifts: Shift[];
  onExportCSV: () => void;
  onExportJSON: () => void;
  onExportSheet: () => void;
  sheetExporting: boolean;
  sheetError: string | null;
}) {
  const hasShifts = shifts.length > 0;
  return (
    <div className="export-section">
      <div className="card-title">出力</div>
      <div className="export-buttons">
        <button type="button" className="btn btn-outline" onClick={onExportCSV} disabled={!hasShifts} title="CSV でダウンロード">
          CSV
        </button>
        <button type="button" className="btn btn-outline" onClick={onExportJSON} disabled={!hasShifts} title="JSON でダウンロード">
          JSON
        </button>
        <button type="button" className="btn btn-primary" onClick={onExportSheet} disabled={!hasShifts || sheetExporting} title="Google スプレッドシートに出力（Google 認証が必要）">
          {sheetExporting ? '出力中...' : 'スプレッドシート'}
        </button>
      </div>
      {sheetError && <p className="export-error">{sheetError}</p>}
    </div>
  );
}
