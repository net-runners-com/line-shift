// コマンド用の共通ユーティリティ

export function parseDateStr(s: string): string | null {
  const t = s.trim();
  const y = new Date().getFullYear();
  const iso = /^\d{4}-\d{2}-\d{2}$/.exec(t);
  if (iso) return t;
  const md = /^(\d{1,2})\/(\d{1,2})$/.exec(t);
  if (md) {
    const m = Number(md[1]);
    const d = Number(md[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return null;
}

export function parseTimeRange(s: string): { start: string; end: string } | null {
  const m = /^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(s.trim());
  if (!m) return null;
  const start = m[1].length === 4 ? "0" + m[1] : m[1];
  const end = m[2].length === 4 ? "0" + m[2] : m[2];
  return { start, end };
}

export function getMonthRange(which: "今月" | "来月"): { start: string; end: string } {
  const d = new Date();
  if (which === "来月") d.setMonth(d.getMonth() + 1);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last = new Date(y, m + 1, 0);
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
  return { start, end };
}
