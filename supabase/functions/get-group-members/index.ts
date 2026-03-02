// グループメンバー一覧取得（LINE Messaging API）
// 環境変数: LINE_CHANNEL_ACCESS_TOKEN または LINE_MESSAGING_API_CHANNEL_TOKEN
// 任意: LINE_GLOBAL_ADMIN_USER_IDS（カンマ区切り）＝ 常に管理者扱いする LINE user ID
// POST body: { groupId: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LINE_GROUP_MEMBERS_IDS = "https://api.line.me/v2/bot/group";
const LINE_GROUP_MEMBER_PROFILE = "https://api.line.me/v2/bot/group";

async function fetchMemberIds(groupId: string, token: string): Promise<string[]> {
  const ids: string[] = [];
  let start: string | undefined;
  do {
    const url = start
      ? `${LINE_GROUP_MEMBERS_IDS}/${groupId}/members/ids?start=${encodeURIComponent(start)}`
      : `${LINE_GROUP_MEMBERS_IDS}/${groupId}/members/ids`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`LINE API error: ${res.status} ${t}`);
    }
    const data = (await res.json()) as { memberIds?: string[]; next?: string };
    if (data.memberIds) ids.push(...data.memberIds);
    start = data.next;
  } while (start);
  return ids;
}

async function fetchMemberProfile(
  groupId: string,
  userId: string,
  token: string
): Promise<{ userId: string; displayName: string; pictureUrl?: string }> {
  const res = await fetch(`${LINE_GROUP_MEMBER_PROFILE}/${groupId}/member/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { userId, displayName: userId };
  }
  const data = (await res.json()) as { displayName?: string; pictureUrl?: string };
  return {
    userId,
    displayName: data.displayName ?? userId,
    pictureUrl: data.pictureUrl,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const token =
    Deno.env.get("LINE_MESSAGING_API_CHANNEL_TOKEN") ??
    Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "LINE_MESSAGING_API_CHANNEL_TOKEN or LINE_CHANNEL_ACCESS_TOKEN not set" }), { status: 500 });
  }

  let body: { groupId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const groupId = body.groupId?.trim();
  if (!groupId) {
    return new Response(JSON.stringify({ error: "groupId required" }), { status: 400 });
  }

  try {
    const memberIds = await fetchMemberIds(groupId, token);
    const globalAdminIds = (Deno.env.get("LINE_GLOBAL_ADMIN_USER_IDS") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    let adminUserIds = new Set<string>(globalAdminIds);
    if (supabaseUrl && supabaseAnon) {
      const supabase = createClient(supabaseUrl, supabaseAnon);
      const { data: rows } = await supabase
        .from("group_admins")
        .select("line_user_id")
        .eq("group_id", groupId);
      if (Array.isArray(rows)) for (const r of rows) adminUserIds.add(r.line_user_id);
    }

    const members: { userId: string; displayName: string; pictureUrl?: string; isAdmin: boolean }[] = [];
    for (const id of memberIds) {
      const profile = await fetchMemberProfile(groupId, id, token);
      members.push({
        ...profile,
        isAdmin: adminUserIds.has(profile.userId),
      });
    }
    return new Response(
      JSON.stringify({ members }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to get members" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
