-- グループごとの管理者（LINE user ID）
-- グローバル管理者は環境変数 LINE_GLOBAL_ADMIN_USER_IDS で別途指定可能

create table if not exists public.group_admins (
  group_id text not null,
  line_user_id text not null,
  created_at timestamptz not null default now(),
  primary key (group_id, line_user_id)
);

comment on table public.group_admins is 'グループごとの管理者。このテーブルにいない場合は「メンバー」';

create index if not exists idx_group_admins_group_id on public.group_admins (group_id);

alter table public.group_admins enable row level security;

-- 読み取りは anon 可（管理者かどうかの表示用）。追加・削除は RPC 経由
create policy "Allow anon read group_admins"
  on public.group_admins for select to anon using (true);

create policy "Allow anon insert/update/delete via service"
  on public.group_admins for all to anon using (true) with check (true);

-- グループに管理者が0人のとき、最初に登録した人を管理者にする。すでにいる場合は「既存管理者のみ追加可能」
create or replace function public.ensure_group_admin(
  p_group_id text,
  p_line_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if nullif(trim(p_group_id), '') is null or nullif(trim(p_line_user_id), '') is null then
    raise exception 'group_id and line_user_id required';
  end if;

  select count(*) into v_count from public.group_admins where group_id = p_group_id;

  if v_count = 0 then
    insert into public.group_admins (group_id, line_user_id)
    values (p_group_id, p_line_user_id)
    on conflict (group_id, line_user_id) do nothing;
    return;
  end if;

  -- すでに管理者がいる場合は、このユーザーが管理者か確認
  if exists (select 1 from public.group_admins where group_id = p_group_id and line_user_id = p_line_user_id) then
    return;
  end if;

  raise exception 'ONLY_ADMIN_CAN_ADD: 管理者のみ、他の管理者を追加できます。';
end;
$$;

-- 既存管理者が別のユーザーを管理者に追加する
create or replace function public.add_group_admin(
  p_group_id text,
  p_requester_user_id text,
  p_new_admin_user_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_group_id), '') is null or nullif(trim(p_new_admin_user_id), '') is null then
    raise exception 'group_id and new_admin_user_id required';
  end if;

  if not exists (
    select 1 from public.group_admins
    where group_id = p_group_id and line_user_id = p_requester_user_id
  ) then
    raise exception 'ONLY_ADMIN_CAN_ADD: 管理者のみ実行できます。';
  end if;

  insert into public.group_admins (group_id, line_user_id)
  values (p_group_id, p_new_admin_user_id)
  on conflict (group_id, line_user_id) do nothing;
end;
$$;

grant execute on function public.ensure_group_admin(text, text) to anon;
grant execute on function public.add_group_admin(text, text, text) to anon;
