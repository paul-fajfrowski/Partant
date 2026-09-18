-- OAuth credentials stay encrypted in a private, server-only store.
create table private.calendar_links (
  coach uuid primary key references auth.users(id) on delete cascade,
  body jsonb not null,
  locked_until timestamptz,
  lock_id uuid
);
create table private.calendar_oauth_states (
  state text primary key,
  coach uuid not null references auth.users(id) on delete cascade,
  body jsonb not null,
  expires_at timestamptz not null default now() + interval '10 minutes'
);
alter table private.calendar_links enable row level security;
alter table private.calendar_oauth_states enable row level security;
revoke all on private.calendar_links, private.calendar_oauth_states from public,anon,authenticated;
create function public.calendar_store(p_action text, p_actor uuid default null, p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_action='job' then
    select to_jsonb(exists(select 1 from vault.decrypted_secrets where name='partant_calendar_job' and decrypted_secret=p_data->>'key')) into result;
  elsif p_action='get' then
    select body into result from private.calendar_links where coach=p_actor;
  elsif p_action='save' then
    insert into private.calendar_links(coach,body) values(p_actor,p_data)
    on conflict(coach) do update set body=excluded.body;
    result := p_data;
  elsif p_action='delete' then
    delete from private.calendar_links where coach=p_actor;
    delete from private.calendar_oauth_states where coach=p_actor;
  elsif p_action='lock' then
    update private.calendar_links set locked_until=now()+interval '3 minutes',lock_id=(p_data->>'id')::uuid
    where coach=p_actor and (locked_until is null or locked_until<now()) returning body into result;
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
revoke all on function public.calendar_store(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.calendar_store(text,uuid,jsonb) to service_role;

create index calendar_oauth_coach_idx on private.calendar_oauth_states(coach);
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.secrets where name='partant_calendar_job') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'partant_calendar_job');
 end if;
end $$;
-- Persistent reconciliation: no client must stay open for booked sessions to be exported.
select cron.schedule('partant-calendar-sync','*/5 * * * *',$job$
 select net.http_post(
   url:='https://jhhsysjdeyqsuztjtgea.supabase.co/functions/v1/google-calendar',
   headers:=jsonb_build_object('Content-Type','application/json','x-calendar-job',(select decrypted_secret from vault.decrypted_secrets where name='partant_calendar_job')),
   body:=jsonb_build_object('action','scheduled','coach',coach),timeout_milliseconds:=120000)
 from private.calendar_links
 where jsonb_array_length(coalesce(body->'read','[]'::jsonb))>0
 and (locked_until is null or locked_until<now());
$job$);
