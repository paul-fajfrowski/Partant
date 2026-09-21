const fs = require("node:fs");
const users = JSON.parse(
  fs.readFileSync("/private/tmp/partant-connected-qa.json", "utf8"),
);
if (
  !users.length ||
  !users.every(
    (u) =>
      u.email.startsWith("partant-qa-") && u.email.endsWith("@example.invalid") &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id),
  )
)
  throw Error("Not a QA fixture");
const ids = users.map((u) => `'${u.id}'`).join(",");
const sql = `begin;
-- Serialize with product_commit so concurrent user saves cannot be overwritten.
select version from private.product_revision where id=true for update;
-- Delete only the isolated fixture identities and their product documents.
do $$ declare ids text[]:=array[${ids}]; booked text[]; d record; cleaned jsonb;
begin
 select coalesce(array_agg(x->>'id'),'{}') into booked from private.product_documents p,jsonb_array_elements(p.body) x where p.key='bookings' and (x->>'coach'=any(ids) or x->>'clientId'=any(ids));
 for d in select * from private.product_documents loop
  if jsonb_typeof(d.body)='array' then
   select coalesce(jsonb_agg(x),'[]') into cleaned from jsonb_array_elements(d.body) x
   where not(coalesce(x->>'id','')=any(ids) or coalesce(x->>'owner','')=any(ids) or coalesce(x->>'recipient','')=any(ids) or coalesce(x->>'coach','')=any(ids) or coalesce(x->>'clientId','')=any(ids) or coalesce(x->'offer'->>'coach','')=any(ids) or coalesce(x->>'booking','')=any(booked) or trim(both '"' from x::text)=any(ids) or split_part(trim(both '"' from x::text),'|',1)=any(ids));
   update private.product_documents set body=cleaned where key=d.key;
  elsif jsonb_typeof(d.body)='object' then
   select coalesce(jsonb_object_agg(key,value),'{}') into cleaned from jsonb_each(d.body) where not(key=any(ids) or key=any(booked) or split_part(key,':',1)=any(ids));
   update private.product_documents set body=cleaned where key=d.key;
  end if;
 end loop;
 update private.product_revision set version=version+1;
end $$;
delete from private.product_requests where actor::text=any(array[${ids}]);
delete from private.product_rate_limits where actor=any(array[${ids}]) or actor=any(array(select 'push:'||x from unnest(array[${ids}]::text[]) x));
delete from auth.refresh_tokens where user_id::text=any(array[${ids}]);
delete from auth.sessions where user_id::text=any(array[${ids}]);
delete from auth.users where id::text=any(array[${ids}]) and email like 'partant-qa-%@example.invalid';
commit;
select count(*) as remaining_qa_users from auth.users where id::text=any(array[${ids}]);`;
fs.writeFileSync("/private/tmp/partant-connected-qa-cleanup.sql", sql, {
  mode: 0o600,
});
console.log("Targeted cleanup SQL prepared.");
