create function private.is_product_staff() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.product_staff where id=(select auth.uid()))
$$;
revoke all on function private.is_product_staff() from public,anon,authenticated;
grant execute on function private.is_product_staff() to authenticated;
create policy partant_documents_team_read on storage.objects for select to authenticated
using(bucket_id='coach-documents' and (select private.is_product_staff()));
-- The foundation pilot is archived; product-api is now the only mutation path.
-- No existing rows needed migration, verified before this deployment.
revoke insert,update on public.profiles,public.coaches,public.offers from authenticated;
revoke update(full_name,phone,preferences) on public.profiles from authenticated;
revoke update(display_name,bio,sports,published,city,latitude,longitude,travel_radius_km) on public.coaches from authenticated;
revoke update(title,sport,active) on public.offers from authenticated;
revoke execute on function public.open_slot(uuid,timestamptz,text,double precision,double precision),private.open_slot(uuid,timestamptz,text,double precision,double precision),public.reserve_slot(uuid,integer,uuid),private.reserve_slot(uuid,integer,uuid),public.change_booking(uuid,uuid),private.change_booking(uuid,uuid) from authenticated;
