/**
 * グループメンバー一覧取得（Edge Function 経由で LINE API を呼ぶ）
 */

import { env } from '@/config/env';
import type { GroupMember } from '@/types/group';

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const url = `${env.supabaseUrl}/functions/v1/get-group-members`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.supabaseAnonKey}`,
    },
    body: JSON.stringify({ groupId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('getGroupMembers error:', res.status, err);
    return [];
  }
  const data = (await res.json()) as { members?: GroupMember[] };
  return data.members ?? [];
}
