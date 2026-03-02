import type { Command } from "./types.ts";
import { getMonthRange } from "./utils.ts";

export const listCommand: Command = {
  names: ["一覧", "list", "ls"],
  description: "/一覧 [今月|来月] … シフト一覧",
  async exec(ctx) {
    if (!ctx.userId) return ["ユーザー情報が取得できません。"];
    if (!ctx.supabase) return ["シフト機能は設定未完了です。"];
    const which = ctx.args[0] === "来月" ? "来月" : "今月";
    const { start, end } = getMonthRange(which);
    let q = ctx.supabase
      .from("shifts")
      .select("id, date, start, end, memo")
      .eq("line_user_id", ctx.userId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });
    if (ctx.groupId) q = q.eq("group_id", ctx.groupId);
    else q = q.is("group_id", null);
    const { data: rows, error } = await q;
    if (error) return ["一覧の取得に失敗しました。"];
    const list = (rows ?? []) as { date: string; start: string; end: string; memo?: string }[];
    if (list.length === 0) return [`${which}のシフトはありません。`];
    const lines = list.map((r) => `${r.date} ${r.start}～${r.end}${r.memo ? ` ${r.memo}` : ""}`);
    return [`${which}のシフト（${list.length}件）\n` + lines.join("\n")];
  },
};
