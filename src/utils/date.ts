/** 日本語フォーマット（例: 2025年3月2日（日）） */
export function formatDateJa(d: Date): string {
  const w = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${w[d.getDay()]}）`;
}

/** input[type=date] 用の YYYY-MM-DD */
export function formatDateForInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 日付文字列から Date を生成（ローカル正午で正規化） */
export function parseDateStr(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}

/** 同一日かどうか */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 日付文字列 YYYY-MM-DD の範囲で日付を順に生成 */
export function* dateRange(startStr: string, endStr: string): Generator<string> {
  const start = parseDateStr(startStr);
  const end = parseDateStr(endStr);
  const cur = new Date(start.getTime());
  while (cur <= end) {
    yield formatDateForInput(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

/** 短いラベル（例: 2/1(土)） */
export function formatDateShort(d: Date): string {
  const w = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()}（${w[d.getDay()]}）`;
}
