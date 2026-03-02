/**
 * シフトデータの永続化（Supabase）
 * 登録・削除はトランザクション付き RPC で実行
 */

import { supabase } from '@/lib/supabase';
import type { Shift } from '@/types/shift';
import type { ShiftRow } from '@/types/supabase';

const TABLE = 'shifts';

function rowToShift(row: ShiftRow): Shift {
  return {
    id: row.id,
    date: row.date,
    start: row.start,
    end: row.end,
    memo: row.memo ?? undefined,
    groupId: row.group_id ?? undefined,
    periodId: row.period_id ?? undefined,
    type: (row.type === 'day_off' ? 'day_off' : 'work') as Shift['type'],
    status: (row.status === 'submitted' || row.status === 'confirmed' ? row.status : 'draft') as Shift['status'],
  };
}

/** 一覧取得（groupId 指定時はそのグループ用のみ、未指定は個人用のみ。periodId/status で絞り込み可） */
export async function getShifts(
  lineUserId: string,
  groupId?: string | null,
  options?: { periodId?: string | null; status?: 'draft' | 'submitted' | 'confirmed' }
): Promise<Shift[]> {
  let q = supabase
    .from(TABLE)
    .select('*')
    .eq('line_user_id', lineUserId)
    .order('date', { ascending: true });

  if (groupId != null && groupId !== '') {
    q = q.eq('group_id', groupId);
  } else {
    q = q.is('group_id', null);
  }
  if (options?.periodId != null && options.periodId !== '') {
    q = q.eq('period_id', options.periodId);
  }
  if (options?.status != null) {
    q = q.eq('status', options.status);
  }

  const { data, error } = await q;

  if (error) {
    console.error('getShifts error:', error);
    return [];
  }
  return ((data ?? []) as ShiftRow[]).map(rowToShift);
}

/** 1件登録（RPC 内でトランザクション） */
export async function addShift(
  lineUserId: string,
  shift: Omit<Shift, 'id'>,
  groupId?: string | null,
  periodId?: string | null,
  type?: 'work' | 'day_off'
): Promise<Shift | null> {
  const sType = type ?? shift.type ?? 'work';
  const start = sType === 'day_off' ? '00:00' : shift.start;
  const end = sType === 'day_off' ? '00:00' : shift.end;

  const { data, error } = await supabase.rpc('add_shift', {
    p_line_user_id: lineUserId,
    p_date: shift.date,
    p_start: start,
    p_end: end,
    p_memo: shift.memo ?? null,
    p_group_id: groupId ?? null,
    p_period_id: periodId ?? null,
    p_type: sType,
  });

  if (error) {
    console.error('addShift error:', error);
    return null;
  }
  return data ? rowToShift(data as ShiftRow) : null;
}

/** 1件削除（RPC 内でトランザクション） */
export async function deleteShift(lineUserId: string, id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_shift', {
    p_line_user_id: lineUserId,
    p_id: id,
  });

  if (error) {
    console.error('deleteShift error:', error);
    return false;
  }
  return data === true;
}

/** 複数件を一括登録（1トランザクションで全部成功 or 全部ロールバック） */
export async function addShiftsBulk(
  lineUserId: string,
  items: Omit<Shift, 'id'>[],
  groupId?: string | null,
  periodId?: string | null,
  defaultType: 'work' | 'day_off' = 'work'
): Promise<Shift[]> {
  const pItems = items.map((s) => {
    const t = s.type ?? defaultType;
    return {
      date: s.date,
      start: t === 'day_off' ? '00:00' : s.start,
      end: t === 'day_off' ? '00:00' : s.end,
      memo: s.memo ?? null,
      type: t,
    };
  });

  const { data, error } = await supabase.rpc('add_shifts_bulk', {
    p_line_user_id: lineUserId,
    p_items: pItems,
    p_group_id: groupId ?? null,
    p_period_id: periodId ?? null,
    p_type: defaultType,
  });

  if (error) {
    console.error('addShiftsBulk error:', error);
    return [];
  }
  return ((data ?? []) as ShiftRow[]).map(rowToShift);
}

/** 期間内の自分の draft を全削除 */
export async function deleteDraftShiftsInPeriod(
  lineUserId: string,
  periodId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('delete_draft_shifts_in_period', {
    p_line_user_id: lineUserId,
    p_period_id: periodId,
  });
  if (error) {
    console.error('deleteDraftShiftsInPeriod error:', error);
    return 0;
  }
  return typeof data === 'number' ? data : 0;
}

/** 期間を提出（draft → submitted） */
export async function submitPeriod(lineUserId: string, periodId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('submit_period', {
    p_line_user_id: lineUserId,
    p_period_id: periodId,
  });
  if (error) {
    console.error('submitPeriod error:', error);
    return false;
  }
  return data === true;
}

/** 期間を提出済みか */
export async function hasSubmittedPeriod(
  lineUserId: string,
  periodId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_submitted_period', {
    p_line_user_id: lineUserId,
    p_period_id: periodId,
  });
  if (error) {
    console.error('hasSubmittedPeriod error:', error);
    return false;
  }
  return data === true;
}
