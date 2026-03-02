/** シフト1件の型 */
export interface Shift {
  id: string;
  date: string;   // YYYY-MM-DD
  start: string;  // HH:mm
  end: string;    // HH:mm
  memo?: string;
  groupId?: string;  // LINE グループID（グループトークから開いた場合）
}

/** シフト登録フォームの型 */
export interface ShiftFormData {
  date: string;
  start: string;
  end: string;
  memo?: string;
}
