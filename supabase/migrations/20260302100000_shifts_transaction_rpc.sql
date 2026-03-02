-- トランザクション付き RPC: シフトの登録・削除を明示的なトランザクションで実行

-- 1件登録（トランザクション内で INSERT し、挿入した行を返す）
create or replace function public.add_shift(
  p_line_user_id text,
  p_date date,
  p_start text,
  p_end text,
  p_memo text default null
)
returns public.shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shifts;
begin
  insert into public.shifts (line_user_id, date, start, "end", memo)
  values (p_line_user_id, p_date, p_start, p_end, p_memo)
  returning * into v_row;

  return v_row;
exception
  when others then
    raise;
end;
$$;

-- 1件削除（トランザクション内で DELETE、line_user_id 一致時のみ）
create or replace function public.delete_shift(
  p_line_user_id text,
  p_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  with deleted as (
    delete from public.shifts
    where id = p_id and line_user_id = p_line_user_id
    returning 1
  )
  select count(*)::int into v_deleted from deleted;

  return v_deleted > 0;
exception
  when others then
    raise;
end;
$$;

-- 複数件を一括登録（1トランザクションで全部成功 or 全部ロールバック）
-- 引数: p_line_user_id, p_items = jsonb array [{"date":"2025-03-01","start":"09:00","end":"18:00","memo":null}, ...]
create or replace function public.add_shifts_bulk(
  p_line_user_id text,
  p_items jsonb
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
    insert into public.shifts (line_user_id, date, start, "end", memo)
    values (
      p_line_user_id,
      (v_item->>'date')::date,
      v_item->>'start',
      v_item->>'end',
      nullif(trim(v_item->>'memo'), '')
    )
    returning * into v_row;
    return next v_row;
  end loop;
  return;
exception
  when others then
    raise;
end;
$$;

-- RPC の実行権限
grant execute on function public.add_shift(text, date, text, text, text) to anon;
grant execute on function public.add_shift(text, date, text, text, text) to authenticated;
grant execute on function public.delete_shift(text, uuid) to anon;
grant execute on function public.delete_shift(text, uuid) to authenticated;
grant execute on function public.add_shifts_bulk(text, jsonb) to anon;
grant execute on function public.add_shifts_bulk(text, jsonb) to authenticated;
