/**
 * 開発・デモ用テストデータ
 * VITE_USE_MOCK_DATA=true のときなどに利用
 */

import type { Shift, ShiftPeriod } from '@/types/shift';
import type { GroupMember } from '@/types/group';

export const MOCK_GROUP_ID = 'mock-group-1';

/** テスト用シフト期間 */
export const mockPeriods: ShiftPeriod[] = [
  {
    id: 'mock-period-1',
    group_id: MOCK_GROUP_ID,
    name: '3月前半',
    start_date: '2025-03-01',
    end_date: '2025-03-15',
    deadline_at: '2025-02-25T23:59:00.000Z',
    created_at: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'mock-period-2',
    group_id: MOCK_GROUP_ID,
    name: '3月後半',
    start_date: '2025-03-16',
    end_date: '2025-03-31',
    deadline_at: '2025-03-10T23:59:00.000Z',
    created_at: '2025-03-01T00:00:00.000Z',
  },
];

/** テスト用シフト（確定・提出済み・下書き混在） */
export const mockShifts: Shift[] = [
  { id: 'mock-shift-1', date: '2025-03-03', start: '10:00', end: '18:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-1', type: 'work', status: 'confirmed' },
  { id: 'mock-shift-2', date: '2025-03-04', start: '10:00', end: '18:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-1', type: 'work', status: 'confirmed' },
  { id: 'mock-shift-3', date: '2025-03-05', start: '10:00', end: '15:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-1', type: 'work', status: 'confirmed' },
  { id: 'mock-shift-4', date: '2025-03-08', start: '00:00', end: '00:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-1', type: 'day_off', status: 'confirmed' },
  { id: 'mock-shift-5', date: '2025-03-10', start: '09:00', end: '17:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-1', type: 'work', status: 'confirmed' },
  { id: 'mock-shift-6', date: '2025-03-18', start: '10:00', end: '18:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-2', type: 'work', status: 'draft' },
  { id: 'mock-shift-7', date: '2025-03-19', start: '10:00', end: '18:00', groupId: MOCK_GROUP_ID, periodId: 'mock-period-2', type: 'work', status: 'draft' },
];

/** テスト用グループメンバー */
export const mockMembers: GroupMember[] = [
  { userId: 'mock-user-1', displayName: '山田 太郎', isAdmin: true },
  { userId: 'mock-user-2', displayName: '佐藤 花子', isAdmin: false },
  { userId: 'mock-user-3', displayName: '鈴木 一郎', isAdmin: false },
];

export const MOCK_USER_ID = 'mock-user-1';
