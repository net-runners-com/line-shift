/**
 * シフト期間の取得・作成・確定
 */

import { supabase } from '@/lib/supabase';
import type { ShiftPeriod } from '@/types/shift';

type ShiftPeriodRow = {
  id: string;
  group_id: string;
  name: string;
  start_date: string;
  end_date: string;
  deadline_at: string | null;
  created_at?: string;
};

function rowToPeriod(row: ShiftPeriodRow): ShiftPeriod {
  return {
    id: row.id,
    group_id: row.group_id,
    name: row.name,
    start_date: row.start_date,
    end_date: row.end_date,
    deadline_at: row.deadline_at,
    created_at: row.created_at,
  };
}

export async function getShiftPeriods(groupId: string): Promise<ShiftPeriod[]> {
  const { data, error } = await supabase.rpc('get_shift_periods', {
    p_group_id: groupId,
  });
  if (error) {
    console.error('getShiftPeriods error:', error);
    return [];
  }
  return ((data ?? []) as ShiftPeriodRow[]).map(rowToPeriod);
}

export async function createShiftPeriod(
  groupId: string,
  name: string,
  startDate: string,
  endDate: string,
  deadlineAt?: string | null
): Promise<ShiftPeriod | null> {
  const { data, error } = await supabase.rpc('create_shift_period', {
    p_group_id: groupId,
    p_name: name,
    p_start_date: startDate,
    p_end_date: endDate,
    p_deadline_at: deadlineAt ?? null,
  });
  if (error) {
    console.error('createShiftPeriod error:', error);
    return null;
  }
  return data ? rowToPeriod(data as ShiftPeriodRow) : null;
}

/** 管理者が期間内の提出済みシフトを一括確定 */
export async function confirmPeriodShifts(
  periodId: string,
  adminLineUserId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('confirm_period_shifts', {
    p_period_id: periodId,
    p_admin_line_user_id: adminLineUserId,
  });
  if (error) {
    console.error('confirmPeriodShifts error:', error);
    return 0;
  }
  return typeof data === 'number' ? data : 0;
}
