-- No member is created. Roles are granted only by the explicit operator tool.
alter table private.product_staff add column role text not null default 'reviewer'
  check (role in ('reviewer','support','admin'));
create table private.product_review_claims (
 coach text primary key,
 assigned_to uuid not null references private.product_staff(id) on delete cascade,
 assigned_at timestamptz not null default now()
);
create index product_review_claims_assignee on private.product_review_claims(assigned_to);
alter table private.product_review_claims enable row level security;
revoke all on private.product_review_claims from public,anon,authenticated;
create table private.product_team_events (
 id bigint generated always as identity primary key,
 actor uuid, subject text not null, event text not null,
 created_at timestamptz not null default now()
);
alter table private.product_team_events enable row level security;
revoke all on private.product_team_events from public,anon,authenticated;

create function public.product_team_access(p_actor uuid,p_session uuid,p_aal text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('role',t.role,'unlocked',p_aal='aal2' and exists (
   select 1 from auth.sessions s join auth.mfa_factors f on f.id=s.factor_id
   where s.id=p_session and s.user_id=p_actor and s.aal='aal2'
     and (s.not_after is null or s.not_after>now()) and f.user_id=p_actor and f.status='verified'
 )) from private.product_staff t where t.id=p_actor and not exists(select 1 from private.product_documents where key='deletedAccounts' and body ? p_actor::text)
$$;
revoke all on function public.product_team_access(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.product_team_access(uuid,uuid,text) to service_role;

-- Storage is protected independently of the Edge function or the app's screens.
create or replace function private.is_product_staff() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((public.product_team_access(auth.uid(),nullif(auth.jwt()->>'session_id','')::uuid,auth.jwt()->>'aal')->>'unlocked')::boolean,false)
 and exists(select 1 from private.product_staff where id=auth.uid() and role in ('reviewer','admin'))
$$;

create function public.product_team_claim(p_actor uuid,p_session uuid,p_aal text,p_coach text,p_release boolean default false) returns boolean
language plpgsql security definer set search_path='' as $$
declare access jsonb; changed integer;
begin
 perform 1 from private.product_staff where id=p_actor for share;
 access:=public.product_team_access(p_actor,p_session,p_aal);
 if not coalesce((access->>'unlocked')::boolean,false) or access->>'role' not in ('reviewer','admin') then raise exception 'TEAM_ACCESS_REQUIRED'; end if;
 if not exists(select 1 from private.product_documents where key='settings' and body ? p_coach) then raise exception 'DOSSIER_NOT_FOUND'; end if;
 if p_release then
   delete from private.product_review_claims where coach=p_coach and (assigned_to=p_actor or access->>'role'='admin');
 else
   insert into private.product_review_claims(coach,assigned_to) values(p_coach,p_actor)
   on conflict(coach) do update set assigned_at=now() where product_review_claims.assigned_to=p_actor;
 end if;
 get diagnostics changed=row_count;
 if changed>0 then insert into private.product_team_events(actor,subject,event) values(p_actor,p_coach,case when p_release then 'release' else 'claim' end); end if;
 return changed>0;
end $$;
revoke all on function public.product_team_claim(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.product_team_claim(uuid,uuid,text,text,boolean) to service_role;

-- Pagination bounds the team response. The current JSON storage is deliberately retained.
create function public.product_team_queue(p_actor uuid,p_session uuid,p_aal text,p_page integer default 0,p_query text default '',p_filter text default 'pending') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare access jsonb; result jsonb;
begin
 access:=public.product_team_access(p_actor,p_session,p_aal);
 if not coalesce((access->>'unlocked')::boolean,false) or access->>'role' not in ('reviewer','admin') then raise exception 'TEAM_ACCESS_REQUIRED'; end if;
 if p_page<0 or p_page>100000 or length(p_query)>100 or p_filter not in ('pending','mine','all') then raise exception 'INVALID_QUERY'; end if;
 with items as (
 select c->>'id' as id,c->>'name' as name,c->>'area' as area,
   coalesce(cfg.value->'dossier'->'verification'->'practices',c->'disciplines','[]'::jsonb) as practices,
   coalesce(cfg.value->'dossier'->>'status','draft') as status,
   exists(select 1 from jsonb_each(coalesce(cfg.value->'dossier'->'verification'->'reviews','{}'::jsonb)) r where r.value->>'status'='pending') or cfg.value->'dossier'->>'status'='pending' as pending,
   (select min(r.value->>'at') from jsonb_each(coalesce(cfg.value->'dossier'->'verification'->'reviews','{}'::jsonb)) r where r.value->>'status'='pending') as submitted,
   cl.assigned_to, cl.assigned_at
 from private.product_documents d cross join lateral jsonb_array_elements(case when d.key='extraCoaches' then d.body else '[]'::jsonb end) c
 join private.product_documents settings on settings.key='settings'
 join lateral jsonb_each(settings.body) cfg on cfg.key=c->>'id'
 left join private.product_review_claims cl on cl.coach=c->>'id'
 where d.key='extraCoaches'
 ), filtered as (
 select * from items where (p_filter='all' or (p_filter='pending' and pending) or (p_filter='mine' and assigned_to=p_actor))
 and (strpos(lower(name),lower(trim(p_query)))>0 or strpos(lower(practices::text),lower(trim(p_query)))>0)
 ), page as (select * from filtered order by submitted nulls last,name,id limit 10 offset p_page*10)
 select jsonb_build_object('total',(select count(*) from filtered),'page',p_page,'items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'area',area,'practices',practices,'status',status,'assignment',case when assigned_to=p_actor then 'mine' when assigned_to is null then 'free' else 'other' end) order by submitted nulls last,name,id) from page),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.product_team_queue(uuid,uuid,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.product_team_queue(uuid,uuid,text,integer,text,text) to service_role;

-- Final authorization and ownership check is in the same transaction as the commit.
create function public.product_commit_team(p_version bigint,p_documents jsonb,p_actor uuid,p_request uuid,p_digest text,p_session uuid,p_aal text,p_required text,p_coach text default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare access jsonb;
begin
 perform 1 from private.product_staff where id=p_actor for share;
 access:=public.product_team_access(p_actor,p_session,p_aal);
 if not coalesce((access->>'unlocked')::boolean,false) or not (access->>'role'='admin' or access->>'role'=p_required) then raise exception 'TEAM_ACCESS_REQUIRED'; end if;
 if p_coach is not null then
   perform 1 from private.product_review_claims where coach=p_coach and assigned_to=p_actor for update;
   if not found then raise exception 'CLAIM_REQUIRED'; end if;
 end if;
 return public.product_commit(p_version,p_documents,p_actor,p_request,p_digest);
end $$;
revoke all on function public.product_commit_team(bigint,jsonb,uuid,uuid,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.product_commit_team(bigint,jsonb,uuid,uuid,text,uuid,text,text,text) to service_role;
