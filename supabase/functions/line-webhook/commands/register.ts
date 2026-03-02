import type { Command } from "./types.ts";
import { parseDateStr, parseTimeRange } from "./utils.ts";

export const registerCommand: Command = {
  names: ["登録", "register", "add"],
  description: "/登録 日付 開始-終了 [メモ] 例: /登録 3/15 09:00-18:00 早番",
  async exec(ctx) {
    if (!ctx.userId) return ["ユーザー情報が取得できません。"];
    if (!ctx.supabase) return ["シフト機能は設定未完了です。"];
    if (ctx.args.length < 2) return ["例: /登録 3/15 09:00-18:00 早番"];
    const dateStr = parseDateStr(ctx.args[0]);
    const timeRange = parseTimeRange(ctx.args[1]);
    const memo = ctx.args.slice(2).join(" ").trim() || null;
    if (!dateStr || !timeRange) return ["日付または時刻の形式が不正です。例: /登録 3/15 09:00-18:00"];
    const { error } = await ctx.supabase.rpc("add_shift", {
      p_line_user_id: ctx.userId,
      p_date: dateStr,
      p_start: timeRange.start,
      p_end: timeRange.end,
      p_memo: memo,
      p_group_id: ctx.groupId,
    });
    if (error) return ["登録に失敗しました。"];
    return [`登録しました。\n${dateStr} ${timeRange.start}～${timeRange.end}${memo ? ` ${memo}` : ""}`];
  },
};
