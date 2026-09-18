begin;
do $$
declare test_coach uuid:=gen_random_uuid(); a jsonb; lease uuid:=gen_random_uuid(); denied boolean:=false;
begin
 if has_function_privilege('anon','public.calendar_store(text,uuid,jsonb)','EXECUTE') or has_function_privilege('authenticated','public.calendar_store(text,uuid,jsonb)','EXECUTE') then raise exception 'Private calendar RPC exposed'; end if;
 insert into auth.users(id,aud,role,email,created_at,updated_at) values(test_coach,'authenticated','authenticated','calendar-qa-'||test_coach||'@example.invalid',now(),now());
 perform public.calendar_store('state',test_coach,jsonb_build_object('state','qa-state','verifier','encrypted'));
 a:=public.calendar_store('consume',null,'{"state":"qa-state"}');
 if a->>'coach'<>test_coach::text then raise exception 'Wrong OAuth owner'; end if;
 if public.calendar_store('consume',null,'{"state":"qa-state"}')<>'null'::jsonb then raise exception 'OAuth replay'; end if;
 perform public.calendar_store('state',test_coach,'{"state":"qa-expired"}');
 update private.calendar_oauth_states set expires_at=now()-interval '1 minute' where state='qa-expired';
 if public.calendar_store('consume',null,'{"state":"qa-expired"}')<>'null'::jsonb then raise exception 'Expired OAuth accepted'; end if;
 perform public.calendar_store('save',test_coach,'{"tokens":"encrypted"}');
 a:=public.calendar_store('lock',test_coach,jsonb_build_object('id',lease));
 if a->>'_lease'<>lease::text then raise exception 'Missing lease'; end if;
 if public.calendar_store('lock',test_coach,jsonb_build_object('id',gen_random_uuid()))<>'null'::jsonb then raise exception 'Concurrent sync lease'; end if;
 begin perform public.calendar_store('save',test_coach,'{"tokens":"other"}'); exception when others then denied:=true; end;
 if not denied then raise exception 'Sync overwritten without lease'; end if;
 perform public.calendar_store('save',test_coach,jsonb_build_object('_lease',lease,'tokens','encrypted2'));
 if (public.calendar_store('get',test_coach)) ? '_lease' then raise exception 'Lease persisted in body'; end if;
 update private.calendar_links set locked_until=now()-interval '1 minute' where private.calendar_links.coach=test_coach;
denied:=false;
 begin perform public.calendar_store('save',test_coach,jsonb_build_object('_lease',lease)); exception when others then denied:=true; end;
 if not denied then raise exception 'Expired lease can still save'; end if;
 if public.calendar_store('job',null,'{"key":"forged"}')<>'false'::jsonb then raise exception 'Invalid scheduler token accepted'; end if;
end $$;
select 'PASS 10 OAuth state, lease and private access SQL assertions' as result;
rollback;
