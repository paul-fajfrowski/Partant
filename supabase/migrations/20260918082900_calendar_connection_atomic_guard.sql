create or replace function public.calendar_store(p_action text, p_actor uuid default null, p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_action='job' then
    select to_jsonb(exists(select 1 from vault.decrypted_secrets where name='partant_calendar_job' and decrypted_secret=p_data->>'key')) into result;
  elsif p_action='get' then
    select body into result from private.calendar_links where coach=p_actor;
  elsif p_action='lease' then
    select to_jsonb(exists(select 1 from private.calendar_links where coach=p_actor and locked_until>now() and lock_id=(p_data->>'id')::uuid)) into result;
  elsif p_action='save' then
    perform 1 from private.calendar_links where coach=p_actor for update;
    if p_data ? '_lease' and not exists(select 1 from private.calendar_links where coach=p_actor and locked_until>now() and lock_id=(p_data->>'_lease')::uuid) then raise exception 'CALENDAR_LEASE_EXPIRED'; end if;
    if exists(select 1 from private.calendar_links where coach=p_actor and locked_until>now() and lock_id is distinct from nullif(p_data->>'_lease','')::uuid) then raise exception 'CALENDAR_BUSY'; end if;
    insert into private.calendar_links(coach,body) values(p_actor,p_data-'_lease')
    on conflict(coach) do update set body=excluded.body;
    result := p_data;
  elsif p_action='delete' then
    perform 1 from private.calendar_links where coach=p_actor for update;
    if exists(select 1 from private.calendar_links where coach=p_actor and locked_until>now() and lock_id is distinct from nullif(p_data->>'_lease','')::uuid) then raise exception 'CALENDAR_BUSY'; end if;
    delete from private.calendar_links where coach=p_actor;
    delete from private.calendar_oauth_states where coach=p_actor;
  elsif p_action='lock' then
    update private.calendar_links set locked_until=now()+interval '3 minutes',lock_id=(p_data->>'id')::uuid
    where coach=p_actor and (locked_until is null or locked_until<now()) returning body || jsonb_build_object('_lease',lock_id) into result;
  elsif p_action='unlock' then
    update private.calendar_links set locked_until=null,lock_id=null where coach=p_actor and lock_id=(p_data->>'id')::uuid;
  elsif p_action='state' then
    delete from private.calendar_oauth_states where expires_at<now() or coach=p_actor;
    insert into private.calendar_oauth_states(state,coach,body) values(p_data->>'state',p_actor,p_data-'state');
  elsif p_action='consume' then
    delete from private.calendar_oauth_states where state=p_data->>'state' and expires_at>now()
    returning body || jsonb_build_object('coach',coach) into result;
  else raise exception 'INVALID_ACTION'; end if;
  return coalesce(result,'null'::jsonb);
end $$;
