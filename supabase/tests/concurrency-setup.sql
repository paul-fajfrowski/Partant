begin;
insert into auth.users(id,email) values
('41000000-0000-4000-8000-000000000001','partant-concurrency-coach@example.test'),
('41000000-0000-4000-8000-000000000002','partant-concurrency-a@example.test'),
('41000000-0000-4000-8000-000000000003','partant-concurrency-b@example.test');
insert into public.profiles(id,full_name) select id,'Concurrence QA temporaire' from auth.users where id in ('41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000003');
insert into public.coaches(id,display_name,published) values('41000000-0000-4000-8000-000000000001','Concurrence QA temporaire',true);
insert into public.offers(id,coach_id,title,sport,format,duration_minutes,price_cents,capacity) values('42000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Test concurrence','Running','individual',60,4500,1);
insert into public.slots(id,coach_id,offer_id,starts_at,ends_at,capacity,price_cents,location) values('43000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','42000000-0000-4000-8000-000000000001',now()+interval '5 days',now()+interval '5 days 1 hour',1,4500,'Lieu fictif QA');
commit;
