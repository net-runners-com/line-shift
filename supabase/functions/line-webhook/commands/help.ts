import type { Command } from "./types.ts";

/** ヘルプ用の行一覧は index から渡す（循環参照回避） */
export function createHelpCommand(getHelpLines: () => string[]): Command {
  return {
    names: ["help", "ヘルプ", "シフト", "h"],
    description: "コマンド一覧とLIFFリンク",
    async exec(ctx) {
      const lines = ["【シフト管理ボット】", "", ...getHelpLines(), "", `LIFFでカレンダー操作: ${ctx.liffUrl}`];
      return [lines.join("\n")];
    },
  };
}
