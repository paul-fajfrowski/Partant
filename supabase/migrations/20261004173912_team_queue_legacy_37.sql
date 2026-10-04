-- Legacy profiles may only declare a principal sport.
create or replace function public.product_team_queue(p_actor uuid,p_session uuid,p_aal text,p_page integer default 0,p_query text default '',p_filter text default 'pending') returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare access jsonb; result jsonb;
begin
 access:=public.product_team_access(p_actor,p_session,p_aal);
 if not coalesce((access->>'unlocked')::boolean,false) or access->>'role' not in ('reviewer','admin') then raise exception 'TEAM_ACCESS_REQUIRED'; end if;
 if p_page<0 or p_page>100000 or length(p_query)>100 or p_filter not in ('pending','mine','all') then raise exception 'INVALID_QUERY'; end if;
 with items as (
 select c->>'id' as id,c->>'name' as name,c->>'area' as area,
   coalesce(cfg.value->'dossier'->'verification'->'practices',jsonb_build_array(c->>'sport'),'[]'::jsonb) as practices,
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
