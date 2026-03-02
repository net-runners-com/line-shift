# ボットコマンド（/コマンド形式）

ここにファイルを追加すると、LINE で `/名前` と送るだけで実行できます。

## コマンド一覧（現在）

| コマンド | 説明 |
|----------|------|
| `/test` | 動作確認 |
| `/help` `/ヘルプ` `/シフト` `/h` | コマンド一覧と LIFF リンク |
| `/regist` | シフト管理アプリ（https://line-shift.vercel.app/）を開くボタン付きメッセージを返す |
| `/一覧` `/list` `/ls` | 今月のシフト一覧（`/一覧 来月` で来月） |
| `/登録` `/register` `/add` | シフト登録（例: `/登録 3/15 09:00-18:00 早番`） |
| `/削除` `/delete` `/del` | シフト削除（例: `/削除 3/15`） |
| `/iamadmin` `/管理者` | 自分をグループの管理者に（管理者がまだいないときのみ） |
| `/addadmin` `/管理者追加` `<ユーザーID>` | 管理者が別メンバーを管理者に追加 |
| `/member` `/members` `/メンバー` | グループメンバー一覧（グループトークで実行。メンバーID取得→各プロフィール取得） |

## 新規コマンドの追加手順

1. **`commands/` に新しいファイルを作る**（例: `mycommand.ts`）

```ts
import type { Command } from "./types.ts";

export const myCommand: Command = {
  names: ["mycommand", "mc"],  // /mycommand または /mc で呼べる
  description: "説明文（/help に表示）",
  async exec(ctx) {
    // ctx.userId, ctx.args, ctx.supabase などが使える
    return ["返したいメッセージ"];
  },
};
```

2. **`commands/index.ts` に登録**

- 先頭で import: `import { myCommand } from "./mycommand.ts";`
- `commands` 配列に追加: `myCommand,`

3. デプロイ後、LINE で `/mycommand` と送ると実行されます。

## 返り値

- `exec` の返り値は **string[]**（複数メッセージで返したい場合は配列に複数要素を入れる）。
