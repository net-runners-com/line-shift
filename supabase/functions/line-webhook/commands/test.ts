// 例: /test で動作確認。新規コマンドはこのファイルをコピーして追加
import type { Command } from "./types.ts";

export const testCommand: Command = {
  names: ["test"],
  description: "動作確認",
  async exec() {
    return ["テスト OK！ボットは正常に動いています。"];
  },
};
