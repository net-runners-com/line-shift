-- RPC: 期間一覧取得
create or replace function public.get_shift_periods(p_group_id text)
returns setof public.shift_periods
language sql
security definer
set search_path = public
as $$
  select * from public.shift_periods
  where group_id = p_group_id
  order by start_date desc;
$$;

-- RPC: 期間作成
create or replace function public.create_shift_period(
  p_group_id text,
  p_name text,
  p_start_date date,
  p_end_date date,
  p_deadline_at timestamptz default null
)
returns public.shift_periods
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shift_periods;
begin
  insert into public.shift_periods (group_id, name, start_date, end_date, deadline_at)
  values (p_group_id, p_name, p_start_date, p_end_date, p_deadline_at)
  returning * into v_row;
  return v_row;
end;
$$;

-- add_shift に period_id, type を追加（既存はそのまま互換）
create or replace function public.add_shift(
  p_line_user_id text,
  p_date date,
  p_start text,
  p_end text,
  p_memo text default null,
  p_group_id text default null,
  p_period_id uuid default null,
  p_type text default 'work'
)
returns public.shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shifts;
begin
  insert into public.shifts (line_user_id, date, start, "end", memo, group_id, period_id, type, status)
  values (p_line_user_id, p_date, p_start, p_end, p_memo, p_group_id, p_period_id, p_type, 'draft')
  returning * into v_row;
  return v_row;
exception when others then raise;
end;
$$;

-- add_shifts_bulk に period_id, type を追加（p_items の各要素に type があれば使用）
create or replace function public.add_shifts_bulk(
  p_line_user_id text,
  p_items jsonb,
  p_group_id text default null,
  p_period_id uuid default null,
  p_type text default 'work'
)
returns setof public.shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_row public.shifts;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.shifts (line_user_id, date, start, "end", memo, group_id, period_id, type, status)
    values (
      p_line_user_id,
      (v_item->>'date')::date,
      coalesce(v_item->>'start', '00:00'),
      coalesce(v_item->>'end', '00:00'),
      nullif(trim(v_item->>'memo'), ''),
      p_group_id,
      p_period_id,
      coalesce(nullif(trim(v_item->>'type'), ''), p_type),
      'draft'
    )
    returning * into v_row;
    return next v_row;
  end loop;
  return;
exception when others then raise;
end;
$$;

-- 期間内の自分の draft シフトを一括削除
create or replace function public.delete_draft_shifts_in_period(
  p_line_user_id text,
  p_period_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  with deleted as (
    delete from public.shifts
    where line_user_id = p_line_user_id and period_id = p_period_id and status = 'draft'
    returning 1
  )
  select count(*)::int into v_deleted from deleted;
  return v_deleted;
end;
$$;

-- 提出: 期間内の自分の draft を submitted にし、period_submissions に記録
create or replace function public.submit_period(
  p_line_user_id text,
  p_period_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shifts set status = 'submitted'
  where line_user_id = p_line_user_id and period_id = p_period_id and status = 'draft';

  insert into public.period_submissions (period_id, line_user_id)
  values (p_period_id, p_line_user_id)
  on conflict (period_id, line_user_id) do nothing;

  return true;
exception when others then raise;
end;
$$;

-- 提出済みかどうか
create or replace function public.has_submitted_period(
  p_line_user_id text,
  p_period_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.period_submissions
    where period_id = p_period_id and line_user_id = p_line_user_id
  );
$$;

-- 期間内の提出済みシフトを一括確定（管理者用）
create or replace function public.confirm_period_shifts(
  p_period_id uuid,
  p_admin_line_user_id text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.shifts set status = 'confirmed'
  where period_id = p_period_id and status = 'submitted';

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

grant execute on function public.get_shift_periods(text) to anon, authenticated;
grant execute on function public.create_shift_period(text, text, date, date, timestamptz) to anon, authenticated;
grant execute on function public.add_shift(text, date, text, text, text, text, uuid, text) to anon, authenticated;
grant execute on function public.add_shifts_bulk(text, jsonb, text, uuid, text) to anon, authenticated;
grant execute on function public.delete_draft_shifts_in_period(text, uuid) to anon, authenticated;
grant execute on function public.submit_period(text, uuid) to anon, authenticated;
grant execute on function public.has_submitted_period(text, uuid) to anon, authenticated;
grant execute on function public.confirm_period_shifts(uuid, text) to anon, authenticated;
