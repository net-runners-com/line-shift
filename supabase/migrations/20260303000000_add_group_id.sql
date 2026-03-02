-- グループトーク連携: group_id を追加（NULL = 個人、指定時 = そのグループ用）
alter table public.shifts
  add column if not exists group_id text;

create index if not exists idx_shifts_group_id on public.shifts (group_id) where group_id is not null;

comment on column public.shifts.group_id is 'LINE グループ/トークルーム ID。NULL は個人用';
