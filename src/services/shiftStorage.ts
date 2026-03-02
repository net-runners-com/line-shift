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
  };
}

/** 一覧取得（groupId 指定時はそのグループ用のみ、未指定は個人用のみ） */
export async function getShifts(
  lineUserId: string,
  groupId?: string | null
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
  groupId?: string | null
): Promise<Shift | null> {
  const { data, error } = await supabase.rpc('add_shift', {
    p_line_user_id: lineUserId,
    p_date: shift.date,
    p_start: shift.start,
    p_end: shift.end,
    p_memo: shift.memo ?? null,
    p_group_id: groupId ?? null,
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
  groupId?: string | null
): Promise<Shift[]> {
  const pItems = items.map((s) => ({
    date: s.date,
    start: s.start,
    end: s.end,
    memo: s.memo ?? null,
  }));

  const { data, error } = await supabase.rpc('add_shifts_bulk', {
    p_line_user_id: lineUserId,
    p_items: pItems,
    p_group_id: groupId ?? null,
  });

  if (error) {
    console.error('addShiftsBulk error:', error);
    return [];
  }
  return ((data ?? []) as ShiftRow[]).map(rowToShift);
}
