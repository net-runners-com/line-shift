# LIFF シフト管理アプリ

React + TypeScript で構築した、LINE 上でシフトを管理する LIFF アプリです。シフトデータは **Supabase** で管理します。

## 技術スタック

- **React 18** + **TypeScript**
- **Vite**（ビルドツール）
- **@line/liff**（LIFF SDK）
- **Supabase**（データベース）

## 環境変数

`.env` をプロジェクトルートに作成し、以下を設定してください。

```env
VITE_LIFF_ID=1234567890-AbcdEfgh
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **VITE_LIFF_ID**: LINE Developers の LIFF アプリ ID
- **VITE_SUPABASE_URL** / **VITE_SUPABASE_ANON_KEY**: Supabase ダッシュボードの「プロジェクト設定 > API」で確認
- **VITE_GOOGLE_CLIENT_ID**（任意）: Google スプレッドシート出力を使う場合。Google Cloud Console で OAuth 2.0 クライアント ID（ウェブアプリ）を発行し、Google Sheets API を有効にしたうえで指定します。

`.env.example` をコピーして `.env` を作成できます。

```bash
cp .env.example .env
```

## Supabase のセットアップ

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. **SQL Editor** で次のマイグレーションを**順に**実行する
   - `supabase/migrations/20260302000000_create_shifts.sql` … `shifts` テーブル作成
   - `supabase/migrations/20260302100000_shifts_transaction_rpc.sql` … トランザクション用 RPC
   - `supabase/migrations/20260303000000_add_group_id.sql` … グループ連携用 `group_id` 追加
   - `supabase/migrations/20260303000001_rpc_group_id.sql` … RPC に `group_id` 対応を追加
   - `supabase/migrations/20260303100000_group_admins.sql` … グループ管理者テーブルと `/iamadmin`・`/addadmin` 用 RPC
3. プロジェクト設定の **API** から URL と anon key をコピーし、`.env` に設定

## 開発

```bash
npm install
npm run dev
```

## 出力機能（CSV / JSON / Google スプレッドシート）

「マイシフト」タブの一覧の下にある **出力** セクションで、次のことができます。

- **CSV** … シフト一覧を CSV でダウンロード（BOM 付き UTF-8）
- **JSON** … シフト一覧を JSON でダウンロード
- **スプレッドシート** … Google アカウントでサインイン後、新規 Google スプレッドシートを作成してシフトを書き出します

**Google スプレッドシート出力の設定手順**

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成（または既存を選択）
2. **API とサービス** → **ライブラリ** で「Google Sheets API」を検索し有効化
3. **API とサービス** → **認証情報** → **認証情報を作成** → **OAuth クライアント ID**
4. アプリケーションの種類で **ウェブアプリケーション** を選択
5. **承認済みの JavaScript 生成元** に LIFF アプリの URL を追加（例: `https://liff.line.me`、またはホストしているドメイン）
6. 発行された **クライアント ID** を `.env` の `VITE_GOOGLE_CLIENT_ID` に設定
7. ビルドし直して「スプレッドシート」ボタンを押すと、Google サインイン後に新規スプレッドシートが開きます

## ビルド

```bash
npm run build
```

`dist/` にビルド結果が出力されます。このディレクトリを HTTPS でホスティングしてください。

## ディレクトリ構成

```
src/
├── main.tsx
├── App.tsx
├── config/
│   └── env.ts
├── lib/
│   └── supabase.ts        # Supabase クライアント
├── types/
│   ├── shift.ts
│   └── supabase.ts        # DB 行の型
├── hooks/
│   └── useLiff.ts
├── services/
│   └── shiftStorage.ts     # シフトの取得・登録・削除（Supabase）
├── utils/
│   └── date.ts
└── components/
    ├── Header/
    ├── Tabs/
    ├── Calendar/
    ├── ShiftForm/
    ├── ShiftList/
    ├── LoginPrompt/
    └── Loading/

supabase/
├── functions/
│   └── line-webhook/         # LINE Bot Webhook（グループ招待・メッセージで LIFF リンクを返す）
└── migrations/
    ├── 20260302000000_create_shifts.sql
    ├── 20260302100000_shifts_transaction_rpc.sql
    ├── 20260303000000_add_group_id.sql
    └── 20260303000001_rpc_group_id.sql
```

## トランザクション

シフトの**登録・削除**は、Supabase の RPC（データベース関数）経由で実行し、PostgreSQL のトランザクション内で処理しています。

- **add_shift** … 1件登録。エラー時はロールバック
- **delete_shift** … 1件削除（`line_user_id` 一致時のみ）
- **add_shifts_bulk** … 複数件を一括登録。すべて成功するか、1件でも失敗すれば全体をロールバック

一覧取得（`getShifts`）は単一 SELECT のため、そのままテーブル参照です。

## LIFF 設定

1. [LINE Developers](https://developers.line.biz/ja/) で LINE ログインチャネルを作成
2. LIFF タブでアプリを追加し、エンドポイント URL を設定
3. 発行された LIFF ID を `.env` の `VITE_LIFF_ID` に設定

詳しくは [LIFF ドキュメント](https://developers.line.biz/ja/docs/liff/developing-liff-apps/) を参照してください。

---

## LINE Developers への登録手順（LIFF アプリの追加）

開発したアプリを LINE 上で動かすには、LINE Developers で「チャネル」と「LIFF アプリ」を登録する必要があります。

### 1. LINE Developers にログイン

1. [LINE Developers](https://developers.line.biz/ja/) を開く
2. LINE アカウントでログイン

### 2. プロバイダーを作成（初回のみ）

1. トップの **プロバイダー** 一覧で **作成** をクリック
2. **プロバイダー名**（例: マイアプリ）を入力して作成

### 3. チャネルを作成（LINE Login）

1. 作成したプロバイダーを選択
2. **チャネル** タブで **作成** をクリック
3. **LINE Login** を選んで **次へ**
4. 次のように入力して **作成**
   - **チャネル名**: 例）シフト管理
   - **チャネル説明**: 任意
   - **アプリ種別**: ウェブアプリ
   - **メールアドレス**: あなたのアドレス
   - 利用規約・プライバシーポリシー（必要に応じて URL を入力）
5. 作成後、**チャネル基本設定** で **チャネル ID** や **チャネルシークレット** が表示される（LIFF 登録では主に LIFF ID を使います）

### 4. LIFF アプリを追加

1. 同じチャネルの **LIFF** タブを開く
2. **追加** をクリック
3. 次の項目を設定する

| 項目 | 入力例・選択 |
|------|------------------|
| **LIFFアプリ名** | シフト管理 |
| **サイズ** | **Full**（画面いっぱい） |
| **エンドポイントURL** | アプリを公開する **HTTPS** の URL（後述） |
| **スコープ** | プロフィール（名前表示したい場合にチェック） |
| **オプション** | 必要に応じて（例: 外部ブラウザで自動ログインなど） |

4. **追加** をクリックすると **LIFF ID** が発行される（例: `1234567890-AbcdEfgh`）

### 5. エンドポイントURLについて

- **エンドポイントURL** は「この LIFF アプリのトップのアドレス」です
- ここに書いた URL と**完全一致**、またはその**下のパス**でしか LIFF は正しく動きません

例：

- エンドポイントURL に `https://myapp.example.com/shift/` を設定した場合  
  → アプリは `https://myapp.example.com/shift/` または `https://myapp.example.com/shift/foo` のように `/shift/` 以下で配信する
- ビルドした `dist/` を Netlify / Vercel / GitHub Pages などで HTTPS 公開し、その**ルートURL**（またはサブパス）をエンドポイントURL に設定する

開発中は **ngrok** などでローカルを HTTPS 公開し、その URL を一時的にエンドポイントURL に設定しても構いません。

### 6. .env に LIFF ID を設定

1. 上記で発行された **LIFF ID** をコピー
2. プロジェクトの `.env` の `VITE_LIFF_ID` に貼り付ける

```env
VITE_LIFF_ID=1234567890-AbcdEfgh
```

3. 再度 `npm run build` して、公開用の `dist/` をデプロイする

### 7. LINE でアプリを開く

- LIFF タブの **LIFF URL** に表示されているアドレス（例: `https://liff.line.me/1234567890-AbcdEfgh`）を LINE のトークで送る、またはブラウザで開く
- LINE アプリ内では、そのリンクをタップすると LIFF ブラウザでシフト管理アプリが開く
- 外部ブラウザで開いた場合は LINE ログインが求められる（LIFF の仕様）

### チェックリスト

- [ ] LINE Developers でプロバイダー作成
- [ ] LINE Login チャネル作成
- [ ] LIFF アプリ追加（エンドポイントURL・サイズ・スコープを設定）
- [ ] LIFF ID を `.env` の `VITE_LIFF_ID` に設定
- [ ] `npm run build` でビルドし、エンドポイントURL と一致するようにデプロイ
- [ ] LIFF URL を LINE で開いて動作確認

---

## LINE Bot（Messaging API）とグループ連携

グループトークにボットを招待し、「シフト」と送ると LIFF のリンクが返るようにできます。グループから LIFF を開いた場合は、そのグループ用のシフトとして保存されます。

### 1. Messaging API チャネルを作成

1. [LINE Developers](https://developers.line.biz/ja/) で、**同じプロバイダー**（または新規）を選択
2. **チャネル** タブで **作成** → **Messaging API** を選択
3. チャネル名・説明などを入力して作成
4. 作成後、**Messaging API** タブで次を控える
   - **チャネルシークレット**（Webhook 検証用）
   - **チャネルアクセストークン**（発行または再発行）… メッセージ送信用

> LIFF 用の **LINE Login チャネル** とは別に、**Messaging API チャネル** が1つ必要です。同じ LINE 公式アカウントで両方使う場合は、LINE の「アカウント連携」で LINE Login チャネルと Messaging API チャネルをリンクできます。

### 2. Webhook 用 Edge Function をデプロイ

実装方針は [LINE Messaging APIのWebhookをSupabase Edge Functionsで実装する](https://www.ritaiz.com/articles/implementing-line-messaging-api-webhook-using-supabase-edge-functions) に沿っています（署名検証に HMAC-SHA256 を使用）。

1. [Supabase CLI](https://supabase.com/docs/guides/cli) をインストールし、`supabase login` と `supabase link --project-ref あなたのプロジェクトID` を実行
2. Edge Function に渡すシークレットを設定（Supabase ダッシュボードの **Edge Functions** → **Secrets** でも可）

**方式A（記事と同じ環境変数名）**

```bash
supabase secrets set LINE_MESSAGING_API_CHANNEL_SECRET=あなたのチャネルシークレット
supabase secrets set LINE_MESSAGING_API_CHANNEL_TOKEN=あなたのチャネルアクセストークン
```

> **重要**: 検証が成功しても `/test` で返信がない場合は、**チャネルアクセストークン**（`LINE_MESSAGING_API_CHANNEL_TOKEN`）が設定されているか確認してください。  
> LINE Developers の **Messaging API** タブ → **チャネルアクセストークン** で「発行」または「再発行」し、その値を `supabase secrets set LINE_MESSAGING_API_CHANNEL_TOKEN=...` で設定します。  
> 設定後は **Edge Function の再デプロイ**（`supabase functions deploy line-webhook --no-verify-jwt`）が必要です。

```bash
supabase secrets set LIFF_URL=https://liff.line.me/あなたのLIFF_ID
supabase secrets set SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=あなたのanonキー
```

**方式B（従来の名前）**

```bash
supabase secrets set LINE_CHANNEL_SECRET=あなたのチャネルシークレット
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=あなたのチャネルアクセストークン
supabase secrets set LIFF_URL=https://liff.line.me/あなたのLIFF_ID
supabase secrets set SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=あなたのanonキー
```

> チャネルシークレットは LINE Developers の **チャネル基本設定** → **チャネルシークレット** で確認できます。**コードや Git に含めず**、必ず `supabase secrets set` でだけ設定してください。

3. Webhook 用関数とグループメンバー取得用関数をデプロイ（**`--no-verify-jwt`** が必要。LINE は Supabase の JWT を送らないため）

```bash
supabase functions deploy line-webhook --no-verify-jwt
supabase functions deploy get-group-members --no-verify-jwt
```

`get-group-members` は、LIFF の「メンバー」タブでグループメンバー一覧を表示するために使います（`LINE_CHANNEL_ACCESS_TOKEN` を同じシークレットで利用）。

**実装の流れ（LINE Developers の手順どおり）**

1. **LIFF で認証とコンテキスト取得** … `liff.init()` 後に `liff.getContext()` で `groupId`（または `roomId`）を取得
2. **サーバーで Messaging API を呼ぶ** … 取得した `groupId` で `GET /v2/bot/group/{groupId}/members/ids` および `GET /v2/bot/group/{groupId}/member/{userId}` を Edge Function（`get-group-members`）から実行し、メンバーID一覧とプロフィールを取得
3. **注意** … LIFF アプリは LINE 公式アカウント（ボット）を友だち追加している必要があります。また、**ボットがグループに参加していないとメンバーIDは取得できません**。加えて、2023年2月より `liff.getContext()` の `groupId`/`roomId` は廃止されているため、多くの環境では `groupId` が `null` になり、メンバー一覧が出ない場合があります。その場合は、ボットが送る LIFF リンクに `?groupId=...` を付与し、LIFF 側で URL パラメータから `groupId` を読む対応が必要です。**403 が出る場合** … グループメンバー一覧の API は **認証済み** または **プレミアム** の LINE 公式アカウントでのみ利用可能です。無料の開発者向けチャネルでは利用できません（`/member` コマンド・LIFF の「メンバー」タブも同様）。

4. デプロイ後、次の URL が発行されます（プロジェクト参照 ID は環境に合わせて読み替え）

```
https://あなたのプロジェクトID.supabase.co/functions/v1/line-webhook
```

### 3. LINE に Webhook URL を追加・設定

Messaging API チャネルで、ボットが受け取ったメッセージを Supabase の Edge Function に送るために Webhook URL を設定します。

1. **[LINE Developers Console](https://developers.line.biz/console/)** にログインする  
2. 対象の **プロバイダー** を選び、**Messaging API** の **チャネル** を開く（LIFF 用の LINE Login チャネルとは別の、ボット用チャネル）  
3. 左メニューまたはタブから **「Messaging API」** を開く  
4. 下の方にある **「Webhook 設定」** の項目を探す  
5. **「Webhook URL」** の入力欄に、次の URL を入力する（`あなたのプロジェクトID` は Supabase のプロジェクト参照 ID に置き換え）

   ```
   https://あなたのプロジェクトID.supabase.co/functions/v1/line-webhook
   ```

   - 例: プロジェクト ID が `abcdefghijk` の場合  
     `https://abcdefghijk.supabase.co/functions/v1/line-webhook`  
   - **https** であること・末尾に `/line-webhook` が付いていることを確認する  

6. **「更新」** または **「検証」** ボタンを押す  
   - 「検証」が成功すると、Webhook URL が有効な設定として保存されます  
   - 失敗する場合は、Edge Function がデプロイ済みか・URL の typo がないか・Supabase のプロジェクトが有効かを確認する  

7. **「Webhook の利用」** を **オン** にする（トグルを有効）  
   - オフのままだと、LINE から Webhook が送信されません  

8. （任意）**「あいさつメッセージ」** を **オフ** にする  
   - オンだと、友だち追加時に LINE 標準のあいさつが送られ、ボット側のメッセージと二重になります  

**補足**

- Webhook URL は **1チャネルに1つ** だけ設定できます  
- 変更したあと、LINE 側の反映に数十秒かかることがあります  
- Supabase のプロジェクト ID は、Supabase ダッシュボードの **Settings → General** の **Reference ID** で確認できます

### 4. 動作の流れ

- **ボットを友だち追加** … シフト管理ボットのベーシックID（例: `@929wqjsr`）で検索するか、リンク `https://line.me/R/ti/p/@929wqjsr` から追加
- **グループにボットを招待** … ボットが「シフト管理アプリへようこそ…」とコマンド一覧 + LIFF リンクを送信
- **「シフト」「シフト管理」** など … 従来どおり LIFF リンクを返す代わりに、**コマンドは / から始めてください**（例: `/help` `/test`）
- **そのリンクをタップ** … LIFF が開き、**そのグループ用**のシフトとして登録・一覧が共有される（`group_id` 付きで保存）。グループから開いたときだけ **メンバー** タブが表示され、タップするとグループメンバー一覧（表示名・ユーザーID）を表示します。

個人用（1対1やリンク単体で開いた場合）は `group_id` なしで、従来どおり自分のシフトのみ表示され、メンバータブは出ません。

### 5. ボットで使えるコマンド（/ スラッシュ形式）

コマンドは **`/名前`** で実行します。追加・変更は `supabase/functions/line-webhook/commands/` のファイルで行います（[commands/README.md](supabase/functions/line-webhook/commands/README.md) 参照）。

| コマンド | 説明 |
|----------|------|
| `/test` | 動作確認 |
| `/help` `/ヘルプ` `/シフト` `/h` | コマンド一覧と LIFF リンク |
| `/regist` | シフト管理アプリ（https://line-shift.vercel.app/）を開くボタン付きメッセージを返す |
| `/一覧` `/list` `/ls` | 今月のシフト一覧（`/一覧 来月` で来月） |
| `/登録` `/register` `/add` | シフト登録（例: `/登録 3/15 09:00-18:00 早番`） |
| `/削除` `/delete` `/del` | シフト削除（例: `/削除 3/15`） |
| `/iamadmin` `/管理者` | 自分をそのグループの管理者に（**そのグループに管理者がまだいないときのみ**） |
| `/addadmin` `/管理者追加` `<ユーザーID>` | 既存管理者が、別のメンバーを管理者に追加（LIFF のメンバー一覧で確認できる U で始まる ID を指定） |

グループトークで送った場合は、そのグループ用のシフトとして登録・一覧・削除されます。

### 6. 管理者とメンバーの区別

- **管理者**: グループごとに「誰が管理者か」を DB（`group_admins`）で保持します。**最初にそのグループで `/iamadmin` または `/管理者` を送った人が管理者**になり、以降は管理者だけが `/addadmin <ユーザーID>` で他の管理者を追加できます。
- **グローバル管理者**（任意）: 全グループで常に管理者にしたい LINE アカウントがある場合は、Supabase のシークレットに `LINE_GLOBAL_ADMIN_USER_IDS` を設定します（カンマ区切りで LINE のユーザー ID を並べる）。例: `U1234567890,U9876543210`
- LIFF の「メンバー」タブでは、各メンバーの横に **管理者** バッジが表示されます。
