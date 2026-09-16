begin;
-- Entire fixture is rolled back, including auth.users. No email is sent.
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','partant-qa-coach@example.test'),
 ('10000000-0000-4000-8000-000000000002','partant-qa-a@example.test'),
 ('10000000-0000-4000-8000-000000000003','partant-qa-b@example.test');
insert into public.profiles(id,full_name) select id,'Test transactionnel' from auth.users where id in
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003');
insert into public.coaches(id,display_name,published) values('10000000-0000-4000-8000-000000000001','Coach QA',true);
insert into public.offers(id,coach_id,title,sport,format,duration_minutes,price_cents,capacity) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Collectif QA','Running','group',60,2500,2);
create function pg_temp.expect_error(q text, expected text) returns void language plpgsql as $$
begin
 begin execute q; exception when others then
  if position(expected in sqlerrm)>0 then return; end if; raise;
 end;
 raise exception 'EXPECTED_ERROR_MISSING: %',expected;
end $$;
create function pg_temp.assert_true(b boolean,label text) returns void language plpgsql as $$
begin if b is distinct from true then raise exception 'ASSERTION_FAILED: %',label; end if; end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.open_slot('20000000-0000-4000-8000-000000000001',date_trunc('day',now())+interval '5 days 17 hours','Parc QA',48.85,2.35);
select public.open_slot('20000000-0000-4000-8000-000000000001',date_trunc('day',now())+interval '6 days 17 hours','Parc QA',48.85,2.35);
select pg_temp.expect_error($q$select public.open_slot('20000000-0000-4000-8000-000000000001',date_trunc('day',now())+interval '5 days 17 hours 30 minutes','Conflit',null,null)$q$,'exclusion constraint');
select pg_temp.assert_true((select count(*)=1 from public.profiles),'profile isolation coach');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.reserve_slot((select id from public.slots where coach_id='10000000-0000-4000-8000-000000000001' order by starts_at limit 1),2,'30000000-0000-4000-8000-000000000001');
select public.reserve_slot((select id from public.slots where coach_id='10000000-0000-4000-8000-000000000001' order by starts_at limit 1),2,'30000000-0000-4000-8000-000000000001');
select pg_temp.assert_true((select count(*)=1 from public.bookings),'idempotent replay');
select pg_temp.assert_true((select total_cents=5000 and payment_status='not_collected' from public.bookings limit 1),'server price and no payment');
select pg_temp.expect_error($q$select public.reserve_slot((select id from public.slots where coach_id='10000000-0000-4000-8000-000000000001' order by starts_at limit 1),1,'30000000-0000-4000-8000-000000000001')$q$,'IDEMPOTENCY_CONFLICT');
select pg_temp.expect_error($q$update public.bookings set total_cents=1$q$,'permission denied');
select pg_temp.expect_error($q$update public.notifications set recipient_id='10000000-0000-4000-8000-000000000003'$q$,'permission denied');
select pg_temp.expect_error($q$select public.open_slot('20000000-0000-4000-8000-000000000001',now()+interval '10 days','Fraude',null,null)$q$,'OFFER_NOT_OWNED');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select pg_temp.assert_true((select count(*)=0 from public.bookings),'other client bookings hidden');
select pg_temp.assert_true((select count(*)=0 from public.notifications),'other client notifications hidden');
select pg_temp.expect_error($q$select public.reserve_slot((select id from public.slots where coach_id='10000000-0000-4000-8000-000000000001' order by starts_at limit 1),1,'30000000-0000-4000-8000-000000000002')$q$,'SLOT_FULL');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.change_booking((select id from public.bookings limit 1),(select id from public.slots where coach_id='10000000-0000-4000-8000-000000000001' order by starts_at desc limit 1));
select pg_temp.assert_true((select revision=2 from public.bookings limit 1),'reschedule persisted');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select pg_temp.assert_true((select count(*)=1 from public.notifications where kind='rescheduled'),'coach notified on reschedule');
update public.coaches set published=false where id='10000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.assert_true((select count(*)=1 from public.slots where id=(select slot_id from public.bookings limit 1)),'booked slot visible after pause');
select public.change_booking((select id from public.bookings limit 1));
select public.change_booking((select id from public.bookings limit 1));
select pg_temp.assert_true((select revision=3 and status='cancelled' from public.bookings limit 1),'cancel idempotent');
reset role;
select pg_temp.assert_true((select count(*)=2 from public.notifications where kind='cancelled'),'cancel notifications once per recipient');
rollback;
