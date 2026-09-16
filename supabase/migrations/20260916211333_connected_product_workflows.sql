-- Shared product commands run in the Edge Function; no client can write documents.
-- The revision provides optimistic serializable commits for this development MVP.
create table private.product_documents(key text primary key, body jsonb not null);
create table private.product_revision(id boolean primary key default true check(id), version bigint not null default 0);
insert into private.product_revision(id) values(true);
create table private.product_requests(actor uuid not null, request uuid not null, digest text not null, created_at timestamptz not null default now(), primary key(actor,request));
create index product_requests_created_idx on private.product_requests(created_at);
create table private.product_staff(id uuid primary key references auth.users(id) on delete cascade);
create table private.product_rate_limits(actor text primary key, started_at timestamptz not null, calls integer not null);
alter table private.product_documents enable row level security;
alter table private.product_revision enable row level security;
alter table private.product_requests enable row level security;
alter table private.product_staff enable row level security;
alter table private.product_rate_limits enable row level security;
revoke all on private.product_documents,private.product_revision,private.product_requests,private.product_staff,private.product_rate_limits from public,anon,authenticated;

create function public.product_load(p_actor uuid default null, p_request uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object('version',r.version,'documents',coalesce((select jsonb_object_agg(d.key,d.body) from private.product_documents d),'{}'::jsonb),'staff',exists(select 1 from private.product_staff where id=p_actor),'requestDigest',(select digest from private.product_requests where actor=p_actor and request=p_request)) into result from private.product_revision r;
 return result;
end $$;
create function public.product_commit(p_version bigint,p_documents jsonb,p_actor uuid default null,p_request uuid default null,p_digest text default '') returns boolean
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
 delete from private.product_requests where created_at<now()-interval '14 days';
 return true;
end $$;
create function public.product_rate_limit(p_actor text) returns boolean
language plpgsql security definer set search_path='' as $$
declare total integer;
begin
 insert into private.product_rate_limits(actor,started_at,calls) values(p_actor,now(),1)
 on conflict(actor) do update set calls=case when product_rate_limits.started_at<now()-interval '1 minute' then 1 else product_rate_limits.calls+1 end,started_at=case when product_rate_limits.started_at<now()-interval '1 minute' then now() else product_rate_limits.started_at end returning calls into total;
 delete from private.product_rate_limits where started_at<now()-interval '1 day';
 return total<=120;
end $$;
revoke all on function public.product_load(uuid,uuid),public.product_commit(bigint,jsonb,uuid,uuid,text),public.product_rate_limit(text) from public,anon,authenticated;
grant execute on function public.product_load(uuid,uuid),public.product_commit(bigint,jsonb,uuid,uuid,text),public.product_rate_limit(text) to service_role;
-- Team membership is managed outside the app, never via a client-editable role.
comment on table private.product_staff is 'Partant team access granted by an administrator. No self-enrolment.';
