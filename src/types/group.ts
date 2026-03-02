/** グループメンバー1件 */
export interface GroupMember {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  /** グループ管理者かどうか */
  isAdmin?: boolean;
}
