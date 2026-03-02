-- シフト期間テーブル（提出期間・締切・提出済みフラグ）
create table if not exists public.shift_periods (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  deadline_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_shift_periods_group_id on public.shift_periods (group_id);

alter table public.shift_periods enable row level security;
create policy "Allow all for anon (dev) shift_periods"
  on public.shift_periods for all to anon using (true) with check (true);

-- シフトに期間・種別・状態を追加
alter table public.shifts
  add column if not exists period_id uuid references public.shift_periods(id) on delete set null,
  add column if not exists type text not null default 'work' check (type in ('work', 'day_off')),
  add column if not exists status text not null default 'draft' check (status in ('draft', 'submitted', 'confirmed'));

create index if not exists idx_shifts_period_id on public.shifts (period_id) where period_id is not null;

comment on column public.shifts.period_id is '提出期間ID。NULL は従来の自由登録';
comment on column public.shifts.type is 'work=出勤, day_off=休み';
comment on column public.shifts.status is 'draft=編集中, submitted=提出済み, confirmed=確定';

-- 期間の提出済みフラグ（ユーザー単位でいつ提出したか）
create table if not exists public.period_submissions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.shift_periods(id) on delete cascade,
  line_user_id text not null,
  submitted_at timestamptz not null default now(),
  unique(period_id, line_user_id)
);

create index if not exists idx_period_submissions_period on public.period_submissions (period_id);

alter table public.period_submissions enable row level security;
create policy "Allow all for anon (dev) period_submissions"
  on public.period_submissions for all to anon using (true) with check (true);
