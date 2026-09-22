begin;
select version from private.product_revision where id=true for update;
do $$
declare actor uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); device uuid:=gen_random_uuid(); r jsonb; v bigint;
begin
 insert into auth.users(id,aud,role) values(actor,'authenticated','authenticated');
 insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,actor,now(),now());
 update private.product_documents set body=body||jsonb_build_array(jsonb_build_object('id',actor,'name','QA settings','role','coach')) where key='identities';
 update private.product_documents set body=body||jsonb_build_object(actor::text,'{"notifications":{"booking":false,"changes":true,"reminder":false,"marketing":false},"published":false}'::jsonb) where key='settings';
 insert into private.product_documents(key,body) values('accountInfo',jsonb_build_object(actor::text,'{"reminders":false,"alerts":false,"phone":"QA"}'::jsonb)) on conflict(key) do update set body=private.product_documents.body||excluded.body;
 r:=public.product_push_settings(actor,sid,'status',jsonb_build_object('device',device));
 if r->'categories'->>'booking'<>'false' or r->'categories'->>'reminder'<>'false' or r->'categories'->>'availability'<>'false' then raise exception 'legacy off not reflected'; end if;
 select version into v from private.product_revision;
 r:=public.product_push_settings(actor,sid,'preferences',jsonb_build_object('device',device,'categories','{"booking":true,"reminder":true,"availability":true}'::jsonb));
 if r->'categories'->>'booking'<>'true' or r->'categories'->>'reminder'<>'true' then raise exception 'cannot enable category'; end if;
 if not private.push_allowed(actor,'booking','booking') or not private.push_allowed(actor,'reminder','reminder') or not private.push_allowed(actor,'activity','availability') then raise exception 'server suppresses enabled switch'; end if;
 if (select version from private.product_revision)<>v+1 then raise exception 'revision not incremented'; end if;
 if (select body->actor::text->>'phone' from private.product_documents where key='accountInfo')<>'QA' then raise exception 'phone lost'; end if;
 if (select body->actor::text->>'published' from private.product_documents where key='settings')<>'false' then raise exception 'coach settings lost'; end if;
 r:=public.product_push_settings(actor,sid,'preferences',jsonb_build_object('device',device,'categories','{"messages":false,"reminder":false,"availability":false}'::jsonb));
 if private.push_allowed(actor,'messages','message') or private.push_allowed(actor,'reminder','reminder') or private.push_allowed(actor,'activity','availability') then raise exception 'opt out not enforced'; end if;
 begin
  perform public.product_push_settings(actor,sid,'preferences','{"categories":{"availability":"yes"}}');
  raise exception 'invalid accepted';
 exception when others then if sqlerrm not like '%PUSH_INVALID_INPUT%' then raise; end if; end;
 begin
  perform public.product_push_settings(actor,gen_random_uuid(),'preferences','{"categories":{"booking":true}}');
  raise exception 'wrong session accepted';
 exception when others then if sqlerrm not like '%PUSH_SESSION_REQUIRED%' then raise; end if; end;
 -- A delayed logout of session A must not delete a registration made by session B.
 perform public.product_push_settings(actor,sid,'register',jsonb_build_object('device',device,'token',repeat('c',64),'environment','sandbox'));
 declare newer uuid:=gen_random_uuid(); begin
  insert into auth.sessions(id,user_id,created_at,updated_at) values(newer,actor,now(),now());
  perform public.product_push_settings(actor,newer,'register',jsonb_build_object('device',device,'token',repeat('c',64),'environment','sandbox'));
  perform public.product_push_settings(actor,sid,'remove',jsonb_build_object('device',device));
  if not exists(select 1 from private.push_devices where id=device and session_id=newer) then raise exception 'old logout removed new session'; end if;
  perform public.product_push_settings(actor,newer,'remove',jsonb_build_object('device',device));
  if exists(select 1 from private.push_devices where id=device) then raise exception 'current session removal failed'; end if;
 end;
 if has_function_privilege('anon','public.product_push_settings(uuid,uuid,text,jsonb)','execute') or has_function_privilege('authenticated','public.product_push_settings(uuid,uuid,text,jsonb)','execute') then raise exception 'client RPC exposed'; end if;
end $$;
select 'PASS unified preferences, existing opt-outs, atomic flags, revisions, isolation, invalid input, grants' as result;
rollback;
