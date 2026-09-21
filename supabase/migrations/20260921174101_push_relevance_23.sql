-- Cancel alerts that were read, superseded or whose account no longer exists.
create function private.push_notice_relevant(p_actor uuid,p_notice text) returns boolean
language sql stable security definer set search_path='' as $$
 select not coalesce((select body ? p_actor::text from private.product_documents where key='deletedAccounts'),false)
 and exists(select 1 from private.product_documents d,
 jsonb_array_elements(case when d.key='notices' then d.body else '[]'::jsonb end) n
 where d.key='notices' and n->>'id'=p_notice and n->>'recipient'=p_actor::text and coalesce(n->>'read','false')='false');
$$;
revoke all on function private.push_notice_relevant(uuid,text) from public,anon,authenticated;
create or replace function private.queue_product_push() returns trigger
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
  if category='changes' and coalesce(n->>'booking','')<>'' then
   update private.push_outbox q set status='cancelled',updated_at=now()
   where q.recipient::text=n->>'recipient' and q.booking=n->>'booking'
   and q.category in ('booking','changes','reminder') and q.status in ('pending','sending');
  end if;
  insert into private.push_outbox(device,generation,recipient,notice_id,event,category,booking,expires_at)
   select d.id,d.generation,d.actor,n->>'id',event,category,coalesce(n->>'booking',''),
     now()+case when event='reminder' then interval '1 hour' else interval '24 hours' end
   from private.push_devices d where d.actor::text=n->>'recipient' and d.enabled
    and private.push_allowed(d.actor,category,event)
   on conflict(device,generation,notice_id) do nothing;
 end loop;
 return new;
end $$;

create or replace function public.product_push_claim(p_lease uuid,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 update private.push_outbox q set status='cancelled',updated_at=now() where q.status in ('pending','sending') and
 (q.expires_at<=now() or q.attempts>=5 or not exists(select 1 from private.push_devices d join auth.sessions s on s.id=d.session_id
  where d.id=q.device and d.actor=q.recipient and d.generation=q.generation and d.enabled
  and (s.not_after is null or s.not_after>now()) and private.push_allowed(q.recipient,q.category,q.event) and private.push_notice_relevant(q.recipient,q.notice_id)));
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

create or replace function public.product_push_eligible(p_id uuid,p_lease uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.push_outbox q join private.push_devices d on d.id=q.device join auth.sessions s on s.id=d.session_id
 where q.id=p_id and q.lease=p_lease and q.status='sending' and q.leased_until>now() and q.expires_at>now()
 and d.enabled and d.actor=q.recipient and d.generation=q.generation and (s.not_after is null or s.not_after>now()) and private.push_allowed(q.recipient,q.category,q.event) and private.push_notice_relevant(q.recipient,q.notice_id));
$$;

