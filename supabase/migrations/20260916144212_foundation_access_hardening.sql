revoke all on private.calendar_busy from public,anon,authenticated;
grant all on private.calendar_busy to service_role;
create policy calendar_backend_only on private.calendar_busy for all to service_role using(true) with check(true);
-- Participants keep access to their booked session when a coach pauses discovery.
alter policy coaches_read on public.coaches using(published or id=(select auth.uid()) or exists(select 1 from public.bookings b where b.coach_id=coaches.id and b.client_id=(select auth.uid())));
alter policy offers_read on public.offers using(coach_id=(select auth.uid()) or (active and exists(select 1 from public.coaches c where c.id=coach_id and c.published)) or exists(select 1 from public.bookings b join public.slots s on s.id=b.slot_id where s.offer_id=offers.id and b.client_id=(select auth.uid())));
alter policy slots_read on public.slots using(coach_id=(select auth.uid()) or exists(select 1 from public.coaches c where c.id=coach_id and c.published) or exists(select 1 from public.bookings b where b.slot_id=slots.id and b.client_id=(select auth.uid())));
