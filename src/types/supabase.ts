/**
 * Supabase の shifts テーブル行の型
 */
export interface ShiftRow {
  id: string;
  line_user_id: string;
  date: string;
  start: string;
  end: string;
  memo: string | null;
  group_id?: string | null;
  period_id?: string | null;
  type?: string | null;
  status?: string | null;
  created_at?: string;
}
