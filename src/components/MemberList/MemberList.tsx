/**
 * グループメンバー一覧（メンバータブ用）
 */

import type { GroupMember } from '@/types/group';

interface MemberListProps {
  members: GroupMember[];
  loading: boolean;
  currentUserId?: string;
}

export function MemberList({ members, loading, currentUserId }: MemberListProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-title">メンバー</div>
        <div className="empty-state">読み込み中...</div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="card">
        <div className="card-title">メンバー</div>
        <div className="empty-state">メンバーを取得できませんでした。</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">メンバー（{members.length}人）</div>
      <ul className="member-list">
        {members.map((m) => (
          <li key={m.userId} className="member-item">
            {m.pictureUrl && (
              <img src={m.pictureUrl} alt="" className="member-avatar" width={40} height={40} />
            )}
            <div className="member-info">
              <span className="member-name">
                {m.displayName}
                {m.isAdmin && <span className="member-badge">管理者</span>}
                {m.userId === currentUserId && ' （自分）'}
              </span>
              <span className="member-id">{m.userId}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
