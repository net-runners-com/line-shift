/**
 * シフトの CSV / JSON 出力とダウンロード
 */

import type { Shift } from '@/types/shift';

const BOM = '\uFEFF';

/** シフト一覧を CSV 文字列に（BOM 付き UTF-8） */
export function shiftsToCSV(shifts: Shift[]): string {
  const header = '日付,開始,終了,メモ';
  const rows = shifts.map((s) => {
    const memo = s.memo?.replace(/"/g, '""') ?? '';
    return `${s.date},${s.start},${s.end},"${memo}"`;
  });
  return BOM + [header, ...rows].join('\r\n');
}

/** シフト一覧を JSON 文字列に */
export function shiftsToJSON(shifts: Shift[]): string {
  return JSON.stringify(shifts, null, 2);
}

/** Blob をダウンロードさせる */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** シフトを CSV でダウンロード */
export function downloadShiftsAsCSV(shifts: Shift[], baseName = 'shifts'): void {
  const csv = shiftsToCSV(shifts);
  const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' });
  downloadBlob(blob, `${baseName}_${formatDateForFile(new Date())}.csv`);
}

/** シフトを JSON でダウンロード */
export function downloadShiftsAsJSON(shifts: Shift[], baseName = 'shifts'): void {
  const json = shiftsToJSON(shifts);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${baseName}_${formatDateForFile(new Date())}.json`);
}

function formatDateForFile(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
