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
  group_id?: string | null;  // グループ連携用（マイグレーション 20260303000000 で追加）
  created_at?: string;
}
