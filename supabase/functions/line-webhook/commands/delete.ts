import type { Command } from "./types.ts";
import { parseDateStr } from "./utils.ts";

export const deleteCommand: Command = {
  names: ["削除", "delete", "del"],
  description: "/削除 日付 例: /削除 3/15",
  async exec(ctx) {
    if (!ctx.userId) return ["ユーザー情報が取得できません。"];
    if (!ctx.supabase) return ["シフト機能は設定未完了です。"];
    if (ctx.args.length < 1) return ["例: /削除 3/15"];
    const dateStr = parseDateStr(ctx.args[0]);
    if (!dateStr) return ["日付の形式が不正です。例: /削除 3/15"];
    let q = ctx.supabase
      .from("shifts")
      .select("id")
      .eq("line_user_id", ctx.userId)
      .eq("date", dateStr);
    if (ctx.groupId) q = q.eq("group_id", ctx.groupId);
    else q = q.is("group_id", null);
    const { data: rows, error } = await q;
    if (error || !rows?.length) return [`${dateStr} のシフトはありません。`];
    let deleted = 0;
    for (const row of rows as { id: string }[]) {
      const { error: delErr } = await ctx.supabase!.rpc("delete_shift", {
        p_line_user_id: ctx.userId,
        p_id: row.id,
      });
      if (!delErr) deleted++;
    }
    return [`${dateStr} のシフトを ${deleted} 件削除しました。`];
  },
};
