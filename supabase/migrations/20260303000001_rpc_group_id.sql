-- RPC に group_id 対応を追加（既存関数を上書き）

create or replace function public.add_shift(
  p_line_user_id text,
  p_date date,
  p_start text,
  p_end text,
  p_memo text default null,
  p_group_id text default null
)
returns public.shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shifts;
begin
  insert into public.shifts (line_user_id, date, start, "end", memo, group_id)
  values (p_line_user_id, p_date, p_start, p_end, p_memo, p_group_id)
  returning * into v_row;
  return v_row;
exception when others then raise;
end;
$$;

create or replace function public.add_shifts_bulk(
  p_line_user_id text,
  p_items jsonb,
  p_group_id text default null
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
    insert into public.shifts (line_user_id, date, start, "end", memo, group_id)
    values (
      p_line_user_id,
      (v_item->>'date')::date,
      v_item->>'start',
      v_item->>'end',
      nullif(trim(v_item->>'memo'), ''),
      p_group_id
    )
    returning * into v_row;
    return next v_row;
  end loop;
  return;
exception when others then raise;
end;
$$;

grant execute on function public.add_shift(text, date, text, text, text, text) to anon;
grant execute on function public.add_shift(text, date, text, text, text, text) to authenticated;
grant execute on function public.add_shifts_bulk(text, jsonb, text) to anon;
grant execute on function public.add_shifts_bulk(text, jsonb, text) to authenticated;
