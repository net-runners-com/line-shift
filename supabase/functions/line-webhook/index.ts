// LINE Messaging API Webhook（/コマンド形式・コマンドは commands/ でファイル分割）
// 環境変数（どちらか一方で可）:
//   LINE_MESSAGING_API_CHANNEL_SECRET / LINE_MESSAGING_API_CHANNEL_TOKEN（記事方式）
//   LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findCommand, commands } from "./commands/index.ts";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

/** グループ管理者かどうか（グローバル管理者 or group_admins に存在） */
async function isGroupAdmin(
  supabase: ReturnType<typeof createClient> | null,
  groupId: string | null,
  userId: string | undefined,
  globalAdminIds: string[]
): Promise<boolean> {
  if (!groupId || !userId) return false;
  if (globalAdminIds.some((id) => id.trim() === userId)) return true;
  if (!supabase) return false;
  const { data } = await supabase
    .from("group_admins")
    .select("line_user_id")
    .eq("group_id", groupId)
    .eq("line_user_id", userId)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

/** 署名検証用（LINE 公式: HMAC-SHA256）https://developers.line.biz/ja/reference/messaging-api/ */
async function createHMAC(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function replyToLine(
  replyToken: string,
  messages: (
    | { type: "text"; text: string }
    | { type: "template"; altText: string; template: Record<string, unknown> }
  )[],
  accessToken: string
) {
  const res = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[line-webhook] LINE reply error:", res.status, t);
  } else {
    console.log("[line-webhook] Reply sent OK");
  }
}

interface LineEvent {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
  source?: { userId?: string; groupId?: string; roomId?: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const secret =
    Deno.env.get("LINE_MESSAGING_API_CHANNEL_SECRET") ??
    Deno.env.get("LINE_CHANNEL_SECRET");
  const accessToken =
    Deno.env.get("LINE_MESSAGING_API_CHANNEL_TOKEN") ??
    Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  const liffUrl = Deno.env.get("LIFF_URL") ?? "https://liff.line.me";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  const globalAdminIds = (Deno.env.get("LINE_GLOBAL_ADMIN_USER_IDS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!secret || !accessToken || !liffUrl) {
    console.error(
      "Missing: (LINE_MESSAGING_API_CHANNEL_SECRET or LINE_CHANNEL_SECRET), " +
        "(LINE_MESSAGING_API_CHANNEL_TOKEN or LINE_CHANNEL_ACCESS_TOKEN), LIFF_URL"
    );
    return new Response(JSON.stringify({ error: "Server config error" }), { status: 500 });
  }

  const rawBody = await req.text();
  const headerSignature = req.headers.get("x-line-signature");
  const bodySignature = await createHMAC(secret, rawBody);
  if (!headerSignature || headerSignature !== bodySignature) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { events?: LineEvent[] };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const events = body.events ?? [];
  if (events.length > 0) {
    console.log("[line-webhook] events count:", events.length, "first type:", events[0]?.type);
  }

  const supabase = supabaseUrl && supabaseAnon
    ? createClient(supabaseUrl, supabaseAnon)
    : null;

  const helpCmd = commands.find((c) => c.names.includes("help") || c.names.includes("ヘルプ"));
  const welcomeLines = [
    "シフト管理アプリへようこそ。",
    "コマンドは / から始めてください。例: /test  /help",
  ];

  try {
  for (const ev of events) {
    const replyToken = ev.replyToken;
    if (!replyToken) continue;

    const userId = ev.source?.userId;
    const groupId = ev.source?.groupId ?? ev.source?.roomId ?? null;

    if (ev.type === "join" || ev.type === "follow") {
      const msgs = welcomeLines.map((t) => ({ type: "text" as const, text: t }));
      if (helpCmd) {
        const helpReplies = await helpCmd.exec({
          userId,
          groupId: groupId ?? null,
          args: [],
          rawText: "",
          supabase,
          liffUrl,
        });
        msgs.push(...helpReplies.map((text) => ({ type: "text" as const, text })));
      }
      await replyToLine(replyToken, msgs, accessToken);
      continue;
    }

    if (ev.type === "message" && ev.message?.type === "text") {
      let text = (ev.message.text ?? "").trim();
      if (!text) continue;
      // 全角スラッシュ ／ を半角 / に統一
      if (text.startsWith("／")) text = "/" + text.slice(1);
      if (!text.startsWith("/")) {
        continue;
      }

      console.log("[line-webhook] Command text:", text);

      const rest = text.slice(1).trim();
      const firstSpace = rest.indexOf(" ");
      const name = firstSpace === -1 ? rest : rest.slice(0, firstSpace);
      const args = firstSpace === -1 ? [] : rest.slice(firstSpace + 1).split(/\s+/).filter(Boolean);

      console.log("[line-webhook] Parsed command:", name, "args:", args.length);

      // /regist … シフト管理アプリを開くボタン付きテンプレートを返す
      const registAppUrl = Deno.env.get("LIFF_APP_URL") ?? "https://line-shift.vercel.app/";
      if (name.toLowerCase() === "regist") {
        await replyToLine(
          replyToken,
          [
            {
              type: "template",
              altText: "シフト管理アプリを開く",
              template: {
                type: "buttons",
                text: "シフト管理アプリでカレンダーを操作できます。下のボタンから開いてください。",
                actions: [
                  {
                    type: "uri",
                    label: "シフト管理を開く",
                    uri: registAppUrl.replace(/\/?$/, ""),
                  },
                ],
              },
            },
          ],
          accessToken
        );
        continue;
      }

      const cmd = findCommand(name);
      if (!cmd) {
        await replyToLine(
          replyToken,
          [{ type: "text", text: `不明なコマンド: /${name}\n/help で一覧を表示します。` }],
          accessToken
        );
        continue;
      }

      const isAdmin = await isGroupAdmin(supabase, groupId ?? null, userId, globalAdminIds);
      const ctx = {
        userId,
        groupId: groupId ?? null,
        args,
        rawText: text,
        supabase,
        liffUrl,
        isAdmin,
        lineAccessToken: accessToken,
      };

      try {
        const replies = await cmd.exec(ctx);
        const messages = (replies || []).map((text) => ({ type: "text" as const, text }));
        if (messages.length) await replyToLine(replyToken, messages, accessToken);
      } catch (e) {
        console.error("Command error:", e);
        await replyToLine(replyToken, [{ type: "text", text: "エラーが発生しました。" }], accessToken);
      }
    }
  }
  } catch (e) {
    console.error("[line-webhook] Unhandled error:", e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
