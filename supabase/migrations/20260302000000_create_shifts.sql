-- シフトテーブル
-- Supabase ダッシュボードの SQL Editor で実行するか、マイグレーションで適用

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null,
  date date not null,
  start text not null,
  "end" text not null,
  memo text,
  created_at timestamptz not null default now()
);

-- インデックス（LINE ユーザーごとの取得を高速化）
create index if not exists idx_shifts_line_user_id on public.shifts (line_user_id);
create index if not exists idx_shifts_date on public.shifts (date);

-- RLS: 匿名キーで line_user_id を指定してアクセスするため、
-- 本番では Edge Function 等で LINE トークン検証後にサービスロールで操作する運用を推奨
alter table public.shifts enable row level security;

-- 開発用: 認証なしで全件読み書き可能（本番では削除または厳格なポリシーに変更）
create policy "Allow all for anon (dev)"
  on public.shifts
  for all
  to anon
  using (true)
  with check (true);
