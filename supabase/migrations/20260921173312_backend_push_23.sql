-- Private durable push queue. No client role can read device tokens or invoke worker RPCs.
alter table private.product_revision add column if not exists maintained_at timestamptz;
create index if not exists product_rate_limits_started_idx on private.product_rate_limits(started_at);
create table private.push_preferences (
 actor uuid primary key references auth.users(id) on delete cascade,
 categories jsonb not null default '{"booking":true,"changes":true,"reminder":true,"messages":true,"activity":true}'::jsonb
);
create table private.push_devices (
 id uuid primary key, actor uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null references auth.sessions(id) on delete cascade,
 token text not null check(token ~ '^[0-9a-f]+$' and length(token) between 64 and 512),
 environment text not null check(environment in ('sandbox','production')),
 generation uuid not null default gen_random_uuid(), enabled boolean not null default true,
 updated_at timestamptz not null default now(), unique(token,environment)
);
create index push_devices_actor_idx on private.push_devices(actor);
create index push_devices_session_idx on private.push_devices(session_id);
create table private.push_outbox (
 id uuid primary key default gen_random_uuid(), device uuid not null references private.push_devices(id) on delete cascade,
 generation uuid not null, recipient uuid not null references auth.users(id) on delete cascade,
 notice_id text not null, event text not null, category text not null, booking text not null default '',
 status text not null default 'pending' check(status in ('pending','sending','accepted','failed','cancelled')),
 attempts integer not null default 0, due_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours', lease uuid, leased_until timestamptz,
 last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(device,generation,notice_id)
);
create index push_outbox_due_idx on private.push_outbox(due_at) where status in ('pending','sending');
create index push_outbox_recipient_idx on private.push_outbox(recipient);
create index push_outbox_created_idx on private.push_outbox(created_at);
alter table private.push_preferences enable row level security;
alter table private.push_devices enable row level security;
alter table private.push_outbox enable row level security;
revoke all on private.push_preferences,private.push_devices,private.push_outbox from public,anon,authenticated;

create function private.push_allowed(p_actor uuid,p_category text,p_event text default null) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select categories->>p_category from private.push_preferences where actor=p_actor),'true')='true'
 and case
 when p_category in ('booking','changes','reminder') then
   coalesce((select body->p_actor::text->'notifications'->>p_category from private.product_documents where key='settings'),'true')='true'
   and (p_category<>'reminder' or coalesce((select body->p_actor::text->>'reminders' from private.product_documents where key='accountInfo'),'true')='true')
 else true end
 and (p_event is distinct from 'availability' or coalesce((select body->p_actor::text->>'alerts' from private.product_documents where key='accountInfo'),'true')='true');
$$;
create function private.queue_product_push() returns trigger
language plpgsql security definer set search_path='' as $$
declare previous jsonb := '[]'; n jsonb; category text; event text;
begin
 if new.key<>'notices' or jsonb_typeof(new.body)<>'array' then return new; end if;
 if TG_OP='UPDATE' then previous := old.body; end if;
 for n in select value from jsonb_array_elements(new.body) a
   where not exists(select 1 from jsonb_array_elements(previous) b where b.value->>'id'=a.value->>'id')
 loop
  event := coalesce(n->>'event',n->>'category','other');
  category := case when event='message' then 'messages' when event='booking' then 'booking'
   when event='reminder' then 'reminder'
   when event in ('cancelled','rescheduled','transferred','seats','proposal','proposal-result','changes') then 'changes'
   else 'activity' end;
  -- Do not replay old notices or send marketing. Payloads never contain message text or addresses.
  if event not in ('message','booking','reminder','cancelled','rescheduled','transferred','seats','proposal','proposal-result','changes','review','review-reply','support','dossier','calendar','availability')
   or not coalesce(n->>'createdAt','') ~ '^[0-9]{10,16}$' then continue; end if;
  if (n->>'createdAt')::numeric < extract(epoch from now()-interval '1 hour')*1000 then continue; end if;
  insert into private.push_outbox(device,generation,recipient,notice_id,event,category,booking,expires_at)
   select d.id,d.generation,d.actor,n->>'id',event,category,coalesce(n->>'booking',''),
     now()+case when event='reminder' then interval '1 hour' else interval '24 hours' end
   from private.push_devices d where d.actor::text=n->>'recipient' and d.enabled
    and private.push_allowed(d.actor,category,event)
   on conflict(device,generation,notice_id) do nothing;
 end loop;
 return new;
end $$;
create trigger product_push_outbox after insert or update of body on private.product_documents
 for each row when(new.key='notices') execute function private.queue_product_push();

create function public.product_checkpoint(p_actor uuid default null) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('version',r.version,'fresh',r.maintained_at>now()-interval '55 seconds',
 'deleted',coalesce((select body ? p_actor::text from private.product_documents where key='deletedAccounts'),false),
 'staff',exists(select 1 from private.product_staff where id=p_actor)) from private.product_revision r;
$$;
create function public.product_maintenance_done(p_version bigint) returns void
language sql security definer set search_path='' as $$
 update private.product_revision set maintained_at=now() where version=p_version;
$$;

create function public.product_push_device(p_actor uuid,p_session uuid,p_action text,p_input jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare device uuid; prefs jsonb; k text; t text; env text;
begin
 if not exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and (not_after is null or not_after>now()))
 or not exists(select 1 from private.product_documents d,jsonb_array_elements(case when d.key='identities' then d.body else '[]'::jsonb end) x where d.key='identities' and x->>'id'=p_actor::text)
 then raise exception 'PUSH_SESSION_REQUIRED'; end if;
 if p_action='preferences' then
  prefs := p_input->'categories';
  if jsonb_typeof(prefs)<>'object' or prefs is null then raise exception 'PUSH_INVALID_INPUT'; end if;
  for k in select jsonb_object_keys(prefs) loop
   if k not in ('booking','changes','reminder','messages','activity') or jsonb_typeof(prefs->k)<>'boolean' then raise exception 'PUSH_INVALID_INPUT'; end if;
  end loop;
  insert into private.push_preferences(actor,categories) values(p_actor,'{"booking":true,"changes":true,"reminder":true,"messages":true,"activity":true}'::jsonb||prefs)
   on conflict(actor) do update set categories=push_preferences.categories||prefs;
 elsif p_action='register' then
  device := (p_input->>'device')::uuid; t := lower(p_input->>'token'); env := p_input->>'environment';
  if device is null or t is null or (t !~ '^[0-9a-f]+$' or length(t) not between 64 and 512) or env is null or env not in ('sandbox','production') then raise exception 'PUSH_INVALID_INPUT'; end if;
  if (select count(*) from private.push_devices where actor=p_actor and id<>device)>=10 then raise exception 'PUSH_DEVICE_LIMIT'; end if;
  delete from private.push_devices where token=t and environment=env and id<>device;
  insert into private.push_devices(id,actor,session_id,token,environment) values(device,p_actor,p_session,t,env)
  on conflict(id) do update set actor=excluded.actor,session_id=excluded.session_id,token=excluded.token,environment=excluded.environment,
   generation=case when push_devices.actor=excluded.actor and push_devices.session_id=excluded.session_id and push_devices.token=excluded.token and push_devices.environment=excluded.environment then push_devices.generation else gen_random_uuid() end,
   enabled=true,updated_at=now();
 elsif p_action='remove' then
  delete from private.push_devices where actor=p_actor and id=(p_input->>'device')::uuid;
 elsif p_action<>'status' then raise exception 'PUSH_INVALID_INPUT';
 end if;
 select coalesce((select categories from private.push_preferences where actor=p_actor),'{"booking":true,"changes":true,"reminder":true,"messages":true,"activity":true}'::jsonb) into prefs;
 return jsonb_build_object('categories',prefs,'registered',exists(select 1 from private.push_devices where actor=p_actor and id=(p_input->>'device')::uuid and enabled and session_id=p_session));
end $$;

create function public.product_push_claim(p_lease uuid,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 update private.push_outbox q set status='cancelled',updated_at=now() where q.status in ('pending','sending') and
 (q.expires_at<=now() or q.attempts>=5 or not exists(select 1 from private.push_devices d join auth.sessions s on s.id=d.session_id
  where d.id=q.device and d.actor=q.recipient and d.generation=q.generation and d.enabled
  and (s.not_after is null or s.not_after>now()) and private.push_allowed(q.recipient,q.category,q.event)));
 with picked as (
  select id from private.push_outbox where status in ('pending','sending') and due_at<=now()
   and (leased_until is null or leased_until<now()) order by due_at limit least(greatest(p_limit,1),20) for update skip locked
 ), claimed as (
  update private.push_outbox q set status='sending',lease=p_lease,leased_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now()
   from picked where q.id=picked.id returning q.*
 ) select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('token',d.token,'environment',d.environment)),'[]') into result
 from claimed c join private.push_devices d on d.id=c.device;
 return result;
end $$;
create function public.product_push_finish(p_id uuid,p_lease uuid,p_status text,p_error text default null,p_disable boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare job private.push_outbox;
begin
 select * into job from private.push_outbox where id=p_id and lease=p_lease and status='sending' for update;
 if not found then return; end if;
 if p_status not in ('accepted','failed','pending','cancelled') then raise exception 'INVALID_STATUS'; end if;
 update private.push_outbox set status=case when p_status='pending' and attempts>=5 then 'failed' else p_status end,
 due_at=now()+make_interval(secs=>least(3600,30*(2^attempts)::integer)),last_error=left(p_error,80),lease=null,leased_until=null,updated_at=now() where id=p_id;
 if p_disable then update private.push_devices set enabled=false where id=job.device and generation=job.generation; end if;
end $$;
create function public.product_push_eligible(p_id uuid,p_lease uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.push_outbox q join private.push_devices d on d.id=q.device join auth.sessions s on s.id=d.session_id
 where q.id=p_id and q.lease=p_lease and q.status='sending' and q.leased_until>now() and q.expires_at>now()
 and d.enabled and d.actor=q.recipient and d.generation=q.generation and (s.not_after is null or s.not_after>now()) and private.push_allowed(q.recipient,q.category,q.event));
$$;
create function private.product_housekeeping() returns void language plpgsql security definer set search_path='' as $$
begin
 delete from private.product_requests where created_at<now()-interval '14 days';
 delete from private.product_rate_limits where started_at<now()-interval '1 day';
 delete from private.push_outbox where created_at<now()-interval '7 days';
 delete from private.push_devices where updated_at<now()-interval '90 days';
end $$;
-- Remove cleanup scans from the hot commit and rate-limit paths; scheduled below.
create or replace function public.product_rate_limit(p_actor text) returns boolean
language plpgsql security definer set search_path='' as $$
declare total integer;
begin
 insert into private.product_rate_limits(actor,started_at,calls) values(left(p_actor,160),now(),1)
 on conflict(actor) do update set calls=case when product_rate_limits.started_at<now()-interval '1 minute' then 1 else product_rate_limits.calls+1 end,started_at=case when product_rate_limits.started_at<now()-interval '1 minute' then now() else product_rate_limits.started_at end returning calls into total;
 return total<=120;
end $$;
-- Public RPCs are transport endpoints reserved exclusively for authenticated server code.
revoke all on function private.push_allowed(uuid,text,text),private.queue_product_push(),private.product_housekeeping() from public,anon,authenticated;
revoke all on function public.product_checkpoint(uuid),public.product_maintenance_done(bigint),public.product_push_device(uuid,uuid,text,jsonb),public.product_push_claim(uuid,integer),public.product_push_finish(uuid,uuid,text,text,boolean),public.product_push_eligible(uuid,uuid) from public,anon,authenticated;
grant execute on function public.product_checkpoint(uuid),public.product_maintenance_done(bigint),public.product_push_device(uuid,uuid,text,jsonb),public.product_push_claim(uuid,integer),public.product_push_finish(uuid,uuid,text,text,boolean),public.product_push_eligible(uuid,uuid) to service_role;
select cron.schedule('partant-housekeeping','17 * * * *','select private.product_housekeeping()');

create or replace function public.product_commit(p_version bigint,p_documents jsonb,p_actor uuid default null,p_request uuid default null,p_digest text default '') returns boolean
language plpgsql security definer set search_path='' as $$
declare current_version bigint; prior text;
begin
 select version into current_version from private.product_revision where id=true for update;
 if p_actor is not null and p_request is not null then
  select digest into prior from private.product_requests where actor=p_actor and request=p_request;
  if found then
   if prior<>p_digest then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return true;
  end if;
 end if;
 if current_version<>p_version then return false; end if;
 if jsonb_typeof(p_documents)<>'object' then raise exception 'INVALID_DOCUMENTS'; end if;
 insert into private.product_documents(key,body) select key,value from jsonb_each(p_documents)
 on conflict(key) do update set body=excluded.body where product_documents.body is distinct from excluded.body;
 delete from private.product_documents where not (p_documents ? key);
 update private.product_revision set version=version+1 where id=true;
 if p_actor is not null and p_request is not null then
  insert into private.product_requests(actor,request,digest) values(p_actor,p_request,p_digest);
 end if;
 return true;
end $$;
