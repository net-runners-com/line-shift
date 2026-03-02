// コマンド実行時のコンテキスト・型定義

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface CommandContext {
  userId: string | undefined;
  groupId: string | null;
  /** コマンド名を除いた引数（例: /登録 3/15 09:00-18:00 → ["3/15", "09:00-18:00"]） */
  args: string[];
  rawText: string;
  supabase: SupabaseClient | null;
  liffUrl: string;
  /** このユーザーがグループ管理者か（line-webhook で事前に設定） */
  isAdmin?: boolean;
  /** LINE Messaging API 用 Channel Access Token（メンバー取得などで利用） */
  lineAccessToken?: string;
}

/** 1ファイル = 1コマンド。names のいずれかで /名前 と一致させる */
export interface Command {
  /** コマンド名（/ なし）。複数指定でエイリアス */
  names: string[];
  /** 説明（ヘルプ表示用） */
  description?: string;
  exec(ctx: CommandContext): Promise<string[]>;
}
