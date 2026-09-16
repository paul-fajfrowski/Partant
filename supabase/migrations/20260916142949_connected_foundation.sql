create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
create extension if not exists btree_gist with schema extensions;
create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(full_name) between 1 and 100),
 phone text not null default '', preferences jsonb not null default '{}', created_at timestamptz not null default now());
create table public.coaches(
 id uuid primary key references public.profiles(id), display_name text not null check(length(display_name) between 1 and 100),
 bio text not null default '' check(length(bio)<=3000), sports text[] not null default '{}',
 published boolean not null default false, city text not null default '',
 latitude double precision check(latitude between -90 and 90),longitude double precision check(longitude between -180 and 180),
 travel_radius_km integer not null default 10 check(travel_radius_km between 0 and 100));
create table public.offers(
 id uuid primary key default gen_random_uuid(),coach_id uuid not null references public.coaches(id),
 title text not null check(length(title) between 1 and 120), sport text not null,
 format text not null check(format in ('individual','duo','group')),
 duration_minutes integer not null check(duration_minutes between 15 and 240),
 price_cents integer not null check(price_cents between 0 and 100000),
 capacity integer not null check(capacity between 1 and 20),active boolean not null default true,
 check((format='individual' and capacity=1) or (format='duo' and capacity=2) or (format='group' and capacity>=2)),unique(id,coach_id));
create index offers_coach_idx on public.offers(coach_id);
create table public.slots(
 id uuid primary key default gen_random_uuid(),coach_id uuid not null references public.coaches(id),offer_id uuid not null,
 starts_at timestamptz not null,ends_at timestamptz not null,
 capacity integer not null check(capacity between 1 and 20),price_cents integer not null check(price_cents>=0),
 location text not null check(length(location) between 1 and 300),
 latitude double precision check(latitude between -90 and 90),longitude double precision check(longitude between -180 and 180),
 open boolean not null default true,
 foreign key(offer_id,coach_id) references public.offers(id,coach_id),
 check(ends_at>starts_at),unique(id,coach_id),
 exclude using gist(coach_id with =,tstzrange(starts_at,ends_at,'[)') with &&));
create index slots_offer_idx on public.slots(offer_id,coach_id);
create index slots_starts_idx on public.slots(starts_at) where open;
create table public.bookings(
 id uuid primary key default gen_random_uuid(),client_id uuid not null references public.profiles(id),
 coach_id uuid not null references public.coaches(id),slot_id uuid not null,seats integer not null check(seats between 1 and 20),
 total_cents integer not null check(total_cents>=0),status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
 payment_status text not null default 'not_collected' check(payment_status='not_collected'),
 request_id uuid not null,request_slot_id uuid not null,request_seats integer not null,revision integer not null default 1,
 created_at timestamptz not null default now(),foreign key(slot_id,coach_id) references public.slots(id,coach_id),
 unique(client_id,request_id),check(client_id<>coach_id));
create index bookings_coach_idx on public.bookings(coach_id);
create index bookings_slot_idx on public.bookings(slot_id,coach_id);
create table public.notifications(
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references public.profiles(id),
 booking_id uuid references public.bookings(id),kind text not null,body text not null,read_at timestamptz,created_at timestamptz not null default now());
create index notifications_recipient_idx on public.notifications(recipient_id,created_at desc);
create index notifications_booking_idx on public.notifications(booking_id);
create table public.calendar_connections(
 id uuid primary key default gen_random_uuid(),coach_id uuid not null references public.coaches(id),
 provider text not null check(provider in ('google','outlook')),calendar_id text not null default 'primary',
 status text not null default 'pending' check(status in ('pending','connected','error','revoked')),
 synced_at timestamptz,sync_until timestamptz,error_code text,unique(coach_id,provider));
create table private.calendar_busy(
 connection_id uuid not null references public.calendar_connections(id) on delete cascade,
 coach_id uuid not null references public.coaches(id),external_id text not null,
 starts_at timestamptz not null,ends_at timestamptz not null,check(ends_at>starts_at),primary key(connection_id,external_id));
create index calendar_busy_coach_idx on private.calendar_busy(coach_id,starts_at,ends_at);
alter table private.calendar_busy enable row level security;
do $$ declare t text; begin
 foreach t in array array['profiles','coaches','offers','slots','bookings','notifications','calendar_connections'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;
grant select,insert on public.profiles,public.coaches,public.offers to authenticated;
grant update(full_name,phone,preferences) on public.profiles to authenticated;
grant update(display_name,bio,sports,published,city,latitude,longitude,travel_radius_km) on public.coaches to authenticated;
grant update(title,sport,active) on public.offers to authenticated;
grant select on public.coaches,public.offers,public.slots to anon;
grant select on public.slots,public.bookings,public.notifications,public.calendar_connections to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy profiles_own on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy coaches_read on public.coaches for select to anon,authenticated using(published or id=(select auth.uid()));
create policy coaches_insert on public.coaches for insert to authenticated with check(id=(select auth.uid()));
create policy coaches_update on public.coaches for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy offers_read on public.offers for select to anon,authenticated using(coach_id=(select auth.uid()) or (active and exists(select 1 from public.coaches c where c.id=coach_id and c.published)));
create policy offers_insert on public.offers for insert to authenticated with check(coach_id=(select auth.uid()));
create policy offers_update on public.offers for update to authenticated using(coach_id=(select auth.uid())) with check(coach_id=(select auth.uid()));
create policy slots_read on public.slots for select to anon,authenticated using(coach_id=(select auth.uid()) or exists(select 1 from public.coaches c where c.id=coach_id and c.published));
create policy bookings_read on public.bookings for select to authenticated using(client_id=(select auth.uid()) or coach_id=(select auth.uid()));
create policy notifications_read on public.notifications for select to authenticated using(recipient_id=(select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
create policy calendars_read on public.calendar_connections for select to authenticated using(coach_id=(select auth.uid()));

create function private.assert_available(p_coach uuid,p_start timestamptz,p_end timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if exists(select 1 from public.calendar_connections where coach_id=p_coach and
  (status<>'connected' or synced_at is null or synced_at<now()-interval '5 minutes' or sync_until is null or sync_until<p_end))
 then raise exception 'CALENDAR_SYNC_REQUIRED'; end if;
 if exists(select 1 from private.calendar_busy where coach_id=p_coach and starts_at<p_end and ends_at>p_start)
 then raise exception 'COACH_BUSY'; end if;
end $$;
create function private.open_slot(p_offer uuid,p_start timestamptz,p_location text,p_lat double precision,p_lng double precision) returns public.slots
language plpgsql security definer set search_path='' as $$
declare o public.offers;s public.slots;finish timestamptz;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coach:'||auth.uid()::text,0));
 select * into o from public.offers where id=p_offer and coach_id=auth.uid() and active;
 if not found then raise exception 'OFFER_NOT_OWNED'; end if;
 if p_start is null or p_start<now()+interval '1 hour' or p_start>now()+interval '90 days' then raise exception 'OUTSIDE_BOOKING_WINDOW'; end if;
 finish:=p_start+make_interval(mins=>o.duration_minutes);
 perform private.assert_available(o.coach_id,p_start,finish);
 insert into public.slots(coach_id,offer_id,starts_at,ends_at,capacity,price_cents,location,latitude,longitude)
 values(o.coach_id,o.id,p_start,finish,o.capacity,o.price_cents,p_location,p_lat,p_lng) returning * into s;
 return s;
end $$;
create function public.open_slot(p_offer uuid,p_start timestamptz,p_location text,p_lat double precision default null,p_lng double precision default null) returns public.slots
language sql security invoker set search_path='' as $$select private.open_slot(p_offer,p_start,p_location,p_lat,p_lng)$$;

create function private.reserve_slot(p_slot uuid,p_seats integer,p_request uuid) returns public.bookings
language plpgsql security definer set search_path='' as $$
declare s public.slots;b public.bookings;used integer;fmt text;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_seats is null or p_seats<1 or p_request is null then raise exception 'INVALID_REQUEST'; end if;
 select * into s from public.slots where id=p_slot;
 if not found then raise exception 'SLOT_NOT_FOUND'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coach:'||s.coach_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended('client:'||auth.uid()::text,0));
 select * into b from public.bookings where client_id=auth.uid() and request_id=p_request;
 if found then
  if b.request_slot_id<>p_slot or b.request_seats<>p_seats then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return b;
 end if;
 select * into s from public.slots where id=p_slot;
 if s.coach_id=auth.uid() then raise exception 'SELF_BOOKING'; end if;
 if not s.open or s.starts_at<now()+interval '1 hour' or not exists(select 1 from public.coaches where id=s.coach_id and published)
 then raise exception 'SLOT_UNAVAILABLE'; end if;
 select format into fmt from public.offers where id=s.offer_id and active;
 if not found then raise exception 'OFFER_UNAVAILABLE'; end if;
 if (fmt='individual' and p_seats<>1) or (fmt='duo' and p_seats<>2) then raise exception 'INVALID_SEATS'; end if;
 perform private.assert_available(s.coach_id,s.starts_at,s.ends_at);
 select coalesce(sum(seats),0) into used from public.bookings where slot_id=p_slot and status='confirmed';
 if used+p_seats>s.capacity then raise exception 'SLOT_FULL'; end if;
 if exists(select 1 from public.bookings b join public.slots x on x.id=b.slot_id where b.client_id=auth.uid() and b.status='confirmed' and x.starts_at<s.ends_at and x.ends_at>s.starts_at)
 then raise exception 'CLIENT_BUSY'; end if;
 insert into public.bookings(client_id,coach_id,slot_id,seats,total_cents,request_id,request_slot_id,request_seats)
 values(auth.uid(),s.coach_id,s.id,p_seats,s.price_cents*(case when fmt='group' then p_seats else 1 end),p_request,p_slot,p_seats) returning * into b;
 insert into public.notifications(recipient_id,booking_id,kind,body) values
 (s.coach_id,b.id,'booked','Une nouvelle séance a été réservée.'),(auth.uid(),b.id,'booked','Votre séance de test est confirmée. Aucun paiement encaissé.');
 return b;
end $$;
create function public.reserve_slot(p_slot uuid,p_seats integer,p_request uuid) returns public.bookings
language sql security invoker set search_path='' as $$select private.reserve_slot(p_slot,p_seats,p_request)$$;

create function private.change_booking(p_booking uuid,p_target uuid) returns public.bookings
language plpgsql security definer set search_path='' as $$
declare b public.bookings;s public.slots;old public.slots;used integer;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into b from public.bookings where id=p_booking and client_id=auth.uid();
 if not found then raise exception 'BOOKING_NOT_OWNED'; end if;
 perform pg_advisory_xact_lock(hashtextextended('coach:'||b.coach_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended('client:'||auth.uid()::text,0));
 select * into b from public.bookings where id=p_booking for update;
 if b.status='cancelled' and p_target is null then return b; end if;
 select * into old from public.slots where id=b.slot_id;
 if b.status<>'confirmed' or old.starts_at<now()+interval '24 hours' then raise exception 'CHANGE_WINDOW_CLOSED'; end if;
 if p_target is null then
  update public.bookings set status='cancelled',revision=revision+1 where id=b.id returning * into b;
 else
  select * into s from public.slots where id=p_target;
  if not found or s.coach_id<>b.coach_id or s.offer_id<>old.offer_id or not s.open or s.starts_at<now()+interval '1 hour' or s.price_cents<>old.price_cents then raise exception 'TARGET_UNAVAILABLE'; end if;
  if s.id=old.id then return b; end if;
  if not exists(select 1 from public.coaches where id=s.coach_id and published) or not exists(select 1 from public.offers where id=s.offer_id and active) then raise exception 'TARGET_UNAVAILABLE'; end if;
  perform private.assert_available(s.coach_id,s.starts_at,s.ends_at);
  select coalesce(sum(seats),0) into used from public.bookings where slot_id=s.id and status='confirmed';
  if used+b.seats>s.capacity then raise exception 'SLOT_FULL'; end if;
  if exists(select 1 from public.bookings v join public.slots x on x.id=v.slot_id where v.client_id=auth.uid() and v.status='confirmed' and v.id<>b.id and x.starts_at<s.ends_at and x.ends_at>s.starts_at) then raise exception 'CLIENT_BUSY'; end if;
  update public.bookings set slot_id=s.id,revision=revision+1 where id=b.id returning * into b;
 end if;
 insert into public.notifications(recipient_id,booking_id,kind,body) values
 (b.coach_id,b.id,case when p_target is null then 'cancelled' else 'rescheduled' end,case when p_target is null then 'Une réservation a été annulée.' else 'Un client a changé de créneau.' end),
 (b.client_id,b.id,case when p_target is null then 'cancelled' else 'rescheduled' end,case when p_target is null then 'Votre réservation a été annulée.' else 'Votre nouveau créneau est confirmé.' end);
 return b;
end $$;
create function public.change_booking(p_booking uuid,p_target uuid default null) returns public.bookings
language sql security invoker set search_path='' as $$select private.change_booking(p_booking,p_target)$$;

-- Explicitly limited public aggregate: no customer identity, only inventory counts.
create function private.slot_inventory(p_slots uuid[]) returns table(slot_id uuid,remaining integer)
language sql stable security definer set search_path='' as $$
 select s.id,(s.capacity-coalesce((select sum(b.seats) from public.bookings b where b.slot_id=s.id and b.status='confirmed'),0))::integer
 from public.slots s join public.coaches c on c.id=s.coach_id
 where s.id=any(p_slots) and (c.published or c.id=auth.uid()) and cardinality(p_slots)<=200
$$;
create function public.slot_inventory(p_slots uuid[]) returns table(slot_id uuid,remaining integer)
language sql stable security invoker set search_path='' as $$select * from private.slot_inventory(p_slots)$$;
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.open_slot(uuid,timestamptz,text,double precision,double precision),public.reserve_slot(uuid,integer,uuid),public.change_booking(uuid,uuid),public.slot_inventory(uuid[]) from public,anon,authenticated;
grant execute on function private.open_slot(uuid,timestamptz,text,double precision,double precision),private.reserve_slot(uuid,integer,uuid),private.change_booking(uuid,uuid) to authenticated;
grant execute on function public.open_slot(uuid,timestamptz,text,double precision,double precision),public.reserve_slot(uuid,integer,uuid),public.change_booking(uuid,uuid) to authenticated;
grant execute on function private.slot_inventory(uuid[]),public.slot_inventory(uuid[]) to anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('coach-photos','coach-photos',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('coach-documents','coach-documents',false,10485760,array['application/pdf','image/jpeg','image/png']);
create policy partant_storage_read on storage.objects for select to authenticated using(bucket_id in ('coach-photos','coach-documents') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy partant_storage_insert on storage.objects for insert to authenticated with check(bucket_id in ('coach-photos','coach-documents') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy partant_storage_update on storage.objects for update to authenticated using(bucket_id in ('coach-photos','coach-documents') and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id in ('coach-photos','coach-documents') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy partant_storage_delete on storage.objects for delete to authenticated using(bucket_id in ('coach-photos','coach-documents') and (storage.foldername(name))[1]=(select auth.uid())::text);
alter publication supabase_realtime add table public.bookings,public.notifications;
