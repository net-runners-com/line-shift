/**
 * 環境変数の読み込み
 * Vite は VITE_ プレフィックスの変数のみクライアントに公開
 */

function getEnv(key: string): string {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    console.warn(`環境変数 ${key} が設定されていません`);
  }
  return value ?? '';
}

export const env = {
  /** LINE LIFF アプリ ID */
  liffId: getEnv('VITE_LIFF_ID'),
  /** Supabase プロジェクト URL */
  supabaseUrl: getEnv('VITE_SUPABASE_URL'),
  /** Supabase 匿名キー（クライアント用） */
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  /** Google OAuth 2.0 クライアント ID（スプレッドシート出力用） */
  googleClientId: getEnv('VITE_GOOGLE_CLIENT_ID'),
} as const;
