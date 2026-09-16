create or replace function private.reserve_slot(p_slot uuid,p_seats integer,p_request uuid) returns public.bookings
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
 if exists(select 1 from public.bookings existing join public.slots x on x.id=existing.slot_id where existing.client_id=auth.uid() and existing.status='confirmed' and x.starts_at<s.ends_at and x.ends_at>s.starts_at)
 then raise exception 'CLIENT_BUSY'; end if;
 insert into public.bookings(client_id,coach_id,slot_id,seats,total_cents,request_id,request_slot_id,request_seats)
 values(auth.uid(),s.coach_id,s.id,p_seats,s.price_cents*(case when fmt='group' then p_seats else 1 end),p_request,p_slot,p_seats) returning * into b;
 insert into public.notifications(recipient_id,booking_id,kind,body) values
 (s.coach_id,b.id,'booked','Une nouvelle séance a été réservée.'),(auth.uid(),b.id,'booked','Votre séance de test est confirmée. Aucun paiement encaissé.');
 return b;
end $$;
