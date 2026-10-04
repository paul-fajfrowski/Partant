-- A removed coach dossier must not leave an assignment to a deleted profile.
create function private.prune_review_claims() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 delete from private.product_review_claims where not (new.body ? coach);
 return new;
end $$;
revoke all on function private.prune_review_claims() from public,anon,authenticated;
create trigger prune_review_claims after update of body on private.product_documents
 for each row when (new.key='settings' and old.body is distinct from new.body)
 execute function private.prune_review_claims();
