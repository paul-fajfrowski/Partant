-- Durable erasure is enqueued in the same transaction as the product tombstone.
-- Jobs deliberately survive Auth deletion. No email, file name or token is stored here.
create table private.account_deletion_jobs (
 actor uuid primary key,
 status text not null default 'pending' check (status in ('pending','running','completed')),
 stage text not null default 'queued' check (stage in ('queued','storage','auth','completed')),
 attempts integer not null default 0,
 due_at timestamptz not null default now(),
 lease uuid, leased_until timestamptz,
 error_code text,
 created_at timestamptz not null default now(), completed_at timestamptz
);
alter table private.account_deletion_jobs enable row level security;
revoke all on private.account_deletion_jobs from public,anon,authenticated;
create index account_deletion_due_idx on private.account_deletion_jobs(due_at)
 where status <> 'completed';

create function private.partant_account_active() returns boolean
language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and not exists(
  select 1 from private.product_documents where key='deletedAccounts' and body ? (select auth.uid())::text
 );
$$;
revoke all on function private.partant_account_active() from public,anon,authenticated;
grant execute on function private.partant_account_active() to authenticated;
-- Restrictive policies also cover old JWTs while provider cleanup is pending.
create policy partant_active_storage_account on storage.objects as restrictive
 for all to authenticated
 using (bucket_id not in ('coach-documents','coach-photos') or (select private.partant_account_active()))
 with check (bucket_id not in ('coach-documents','coach-photos') or (select private.partant_account_active()));
do $$ declare t text; begin
 foreach t in array array['profiles','coaches','offers','slots','bookings','notifications','calendar_connections'] loop
  execute format('create policy partant_active_account on public.%I as restrictive for all to authenticated using ((select private.partant_account_active())) with check ((select private.partant_account_active()))',t);
 end loop;
end $$;

create function private.enqueue_account_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
declare who uuid; raw text;
begin
 if new.key <> 'deletedAccounts' or jsonb_typeof(new.body) <> 'array' then return new; end if;
 for raw in select jsonb_array_elements_text(new.body) loop
  if raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then continue; end if;
  who := raw::uuid;
  insert into private.account_deletion_jobs(actor) values(who) on conflict do nothing;
  -- Immediately remove credentials/leases so background integrations cannot reconnect.
  delete from private.calendar_oauth_states where coach=who;
  delete from private.calendar_links where coach=who;
  delete from private.push_outbox where recipient=who;
  delete from private.push_devices where actor=who;
  delete from private.push_preferences where actor=who;
  delete from private.product_staff where id=who;
 end loop;
 return new;
end $$;
revoke all on function private.enqueue_account_deletion() from public,anon,authenticated;
create trigger enqueue_account_deletion after insert or update of body on private.product_documents
 for each row when (new.key='deletedAccounts') execute function private.enqueue_account_deletion();

create function private.prevent_deleted_calendar() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.product_documents where key='deletedAccounts' and body ? new.coach::text)
 then raise exception 'ACCOUNT_DELETED'; end if;
 return new;
end $$;
revoke all on function private.prevent_deleted_calendar() from public,anon,authenticated;
create trigger prevent_deleted_calendar before insert or update on private.calendar_links
 for each row execute function private.prevent_deleted_calendar();
create trigger prevent_deleted_calendar_oauth before insert or update on private.calendar_oauth_states
 for each row execute function private.prevent_deleted_calendar();

create function public.product_deletion_claim(p_lease uuid,p_limit integer default 3,p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 with chosen as (
  select actor from private.account_deletion_jobs
  where status <> 'completed' and due_at <= now()
   and (leased_until is null or leased_until < now()) and (p_actor is null or actor=p_actor)
  order by due_at,created_at limit least(greatest(p_limit,1),5) for update skip locked
 ), claimed as (
  update private.account_deletion_jobs j set status='running',lease=p_lease,
   leased_until=now()+interval '2 minutes',attempts=attempts+1
  from chosen c where j.actor=c.actor returning j.actor,j.attempts
 ) select coalesce(jsonb_agg(to_jsonb(claimed)),'[]') into result from claimed;
 return result;
end $$;
create function public.product_deletion_finish(p_actor uuid,p_lease uuid,p_stage text,p_error text default null)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_stage not in ('storage','auth','completed') then raise exception 'INVALID_STAGE'; end if;
 if p_error is not null and p_error not in ('storage_unavailable','auth_unavailable','storage_pending') then raise exception 'INVALID_ERROR'; end if;
 update private.account_deletion_jobs set stage=p_stage,error_code=p_error,
  status=case when p_stage='completed' and p_error is null then 'completed' else 'pending' end,
  completed_at=case when p_stage='completed' and p_error is null then now() else null end,
  due_at=now()+make_interval(secs => least(3600,30*power(2,least(attempts,7)))::integer),
  lease=null,leased_until=null
 where actor=p_actor and lease=p_lease and leased_until>now();
 return found;
end $$;
revoke all on function public.product_deletion_claim(uuid,integer,uuid),public.product_deletion_finish(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.product_deletion_claim(uuid,integer,uuid),public.product_deletion_finish(uuid,uuid,text,text) to service_role;
-- Replay existing tombstones, if present, without changing live accounts.
update private.product_documents set body=body where key='deletedAccounts';
