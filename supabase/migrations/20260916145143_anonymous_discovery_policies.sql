alter policy coaches_read on public.coaches to authenticated;
alter policy offers_read on public.offers to authenticated;
alter policy slots_read on public.slots to authenticated;
create policy coaches_discovery on public.coaches for select to anon using(published);
create policy offers_discovery on public.offers for select to anon using(active and exists(select 1 from public.coaches c where c.id=coach_id and c.published));
create policy slots_discovery on public.slots for select to anon using(open and exists(select 1 from public.coaches c where c.id=coach_id and c.published));
