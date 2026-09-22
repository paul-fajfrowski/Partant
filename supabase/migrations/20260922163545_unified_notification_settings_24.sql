-- One preferences screen: update push and legacy business flags atomically under
-- the same product revision lock as bookings. Service-role only; actor/session
-- are verified by push-devices before reaching this RPC.
create function public.product_push_settings(p_actor uuid,p_session uuid,p_action text,p_input jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; input jsonb:=p_input; cats jsonb; settings jsonb; info jsonb; prefs jsonb; k text; coach boolean;
begin
 if p_action='preferences' then
  cats:=p_input->'categories';
  if cats ? 'availability' and jsonb_typeof(cats->'availability')<>'boolean' then raise exception 'PUSH_INVALID_INPUT'; end if;
  input:=jsonb_set(p_input,'{categories}',cats-'availability');
  perform 1 from private.product_revision for update;
 end if;
 -- Existing RPC performs active Auth session, registered account, device and input checks.
 result:=public.product_push_device(p_actor,p_session,p_action,input);
 select coalesce(body->p_actor::text,'{}'::jsonb) into settings from private.product_documents where key='settings';
 select coalesce(body->p_actor::text,'{}'::jsonb) into info from private.product_documents where key='accountInfo';
 settings:=coalesce(settings,'{}'::jsonb); info:=coalesce(info,'{}'::jsonb);
 select exists(select 1 from private.product_documents d, jsonb_array_elements(d.body) a where d.key='identities' and a->>'id'=p_actor::text and a->>'role'='coach') into coach;
 if p_action='preferences' then
  if coach then
   prefs:=coalesce(settings->'notifications','{}'::jsonb);
   foreach k in array array['booking','changes','reminder'] loop
    if cats ? k then prefs:=jsonb_set(prefs,array[k],cats->k); end if;
   end loop;
   settings:=jsonb_set(settings,'{notifications}',prefs);
   update private.product_documents set body=jsonb_set(body,array[p_actor::text],settings) where key='settings';
  end if;
  if cats ? 'reminder' then info:=jsonb_set(info,'{reminders}',cats->'reminder'); end if;
  if cats ? 'availability' then info:=jsonb_set(info,'{alerts}',cats->'availability'); end if;
  insert into private.product_documents(key,body) values('accountInfo',jsonb_build_object(p_actor::text,info))
   on conflict(key) do update set body=private.product_documents.body||excluded.body;
  update private.product_revision set version=version+1, maintained_at=null;
 end if;
 prefs:=result->'categories';
 foreach k in array array['booking','changes','reminder'] loop
  prefs:=jsonb_set(prefs,array[k],to_jsonb(coalesce((prefs->>k)::boolean,true) and (not coach or coalesce((settings->'notifications'->>k)::boolean,true)) and (k<>'reminder' or coalesce((info->>'reminders')::boolean,true))));
 end loop;
 prefs:=prefs||jsonb_build_object('availability',coalesce((info->>'alerts')::boolean,true));
 return jsonb_set(result,'{categories}',prefs);
end $$;
revoke all on function public.product_push_settings(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.product_push_settings(uuid,uuid,text,jsonb) to service_role;
