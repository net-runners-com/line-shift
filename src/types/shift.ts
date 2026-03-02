/** シフト1件の型 */
export interface Shift {
  id: string;
  date: string;   // YYYY-MM-DD
  start: string;  // HH:mm
  end: string;    // HH:mm
  memo?: string;
  groupId?: string;  // LINE グループID（グループトークから開いた場合）
  periodId?: string;  // 提出期間ID
  type?: 'work' | 'day_off';  // 出勤 or 休み
  status?: 'draft' | 'submitted' | 'confirmed';
}

/** シフト登録フォームの型 */
export interface ShiftFormData {
  date: string;
  start: string;
  end: string;
  memo?: string;
  type?: 'work' | 'day_off';
}

/** シフト期間 */
export interface ShiftPeriod {
  id: string;
  group_id: string;
  name: string;
  start_date: string;
  end_date: string;
  deadline_at: string | null;
  created_at?: string;
}
