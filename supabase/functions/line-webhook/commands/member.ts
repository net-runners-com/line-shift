/**
 * /member … グループメンバー一覧を取得（グループトークのみ）
 * LINE API: メンバーID一覧（ページネーション）→ 各プロフィール取得
 */

import type { Command } from "./types.ts";

const LINE_GROUP_BASE = "https://api.line.me/v2/bot/group";

/** グループメンバーの userId 一覧を取得（next でページネーション） */
async function getGroupMemberIds(groupId: string, token: string): Promise<string[]> {
  const userIds: string[] = [];
  let start: string | undefined;

  do {
    const url = start
      ? `${LINE_GROUP_BASE}/${groupId}/members/ids?start=${encodeURIComponent(start)}`
      : `${LINE_GROUP_BASE}/${groupId}/members/ids`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`LINE API: ${res.status} ${t}`);
    }
    const data = (await res.json()) as { memberIds?: string[]; next?: string };
    if (data.memberIds) userIds.push(...data.memberIds);
    start = data.next;
  } while (start);

  return userIds;
}

/** userId からプロフィール取得（displayName, pictureUrl） */
async function getGroupMemberProfile(
  groupId: string,
  userId: string,
  token: string
): Promise<{ userId: string; displayName: string }> {
  const res = await fetch(`${LINE_GROUP_BASE}/${groupId}/member/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { userId, displayName: userId };
  const data = (await res.json()) as { displayName?: string };
  return {
    userId,
    displayName: data.displayName ?? userId,
  };
}

/** 全メンバーのプロフィール取得 */
async function getAllMemberProfiles(
  groupId: string,
  token: string
): Promise<{ userId: string; displayName: string }[]> {
  const userIds = await getGroupMemberIds(groupId, token);
  const profiles = await Promise.all(
    userIds.map((id) => getGroupMemberProfile(groupId, id, token))
  );
  return profiles;
}

/** 長いテキストを LINE のメッセージ制限（約4500文字）以内に分割 */
function chunkMessages(lines: string[], maxChars = 4500): string[] {
  const messages: string[] = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > maxChars && current) {
      messages.push(current);
      current = line;
    } else {
      current = next;
    }
  }
  if (current) messages.push(current);
  return messages;
}

export const memberCommand: Command = {
  names: ["member", "members", "メンバー"],
  description: "/member … グループメンバー一覧（グループトークで実行）",
  async exec(ctx) {
    const { groupId, lineAccessToken } = ctx;

    if (!groupId) {
      return ["グループトークで実行してください。1対1ではメンバー一覧は取得できません。"];
    }

    if (!lineAccessToken) {
      return ["サーバー設定のため、メンバー取得に失敗しました。"];
    }

    try {
      const profiles = await getAllMemberProfiles(groupId, lineAccessToken);

      if (profiles.length === 0) {
        return ["メンバーが取得できませんでした。ボットがグループに参加しているか確認してください。"];
      }

      const header = `【メンバー一覧】${profiles.length}人`;
      const lines = profiles.map((p) => `・${p.displayName} (${p.userId})`);
      const messages = chunkMessages([header, "", ...lines]);

      return messages;
    } catch (e) {
      console.error("[member] Error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("403") || msg.includes("not available for your account")) {
        return [
          "グループメンバー一覧の取得には、LINE公式アカウントの「認証済み」または「プレミアム」アカウントが必要です。",
          "無料の開発者向けチャネルではこのAPIは利用できません。",
          "詳しくは LINE Developers の「グループトークと複数人トーク」または LINE公式アカウントのアカウント種別をご確認ください。",
          "※ LIFF の「メンバー」タブも同じAPIを使うため、同様に制限されます。",
        ];
      }
      return [`メンバーの取得に失敗しました: ${msg}`];
    }
  },
};
