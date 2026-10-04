-- Read-only inventory for the announced 17.11 upgrade. No secret or document data.
select jsonb_build_object(
  'version',current_setting('server_version'),
  'extensions',(select jsonb_agg(jsonb_build_object('name',extname,'version',extversion) order by extname) from pg_extension),
  'ltree_indexes',(select count(*) from pg_index i join lateral unnest(i.indclass::oid[]) with ordinality k(opclass,pos) on true join pg_opclass oc on oc.oid=k.opclass join pg_type t on t.oid=oc.opcintype where k.pos<=i.indnkeyatts and t.typname in ('ltree','_ltree')),
  'float_gist_indexes',(select count(*) from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam join lateral unnest(i.indclass::oid[]) with ordinality k(opclass,pos) on true join pg_opclass oc on oc.oid=k.opclass join pg_type t on t.oid=oc.opcintype where k.pos<=i.indnkeyatts and am.amname='gist' and t.typname in ('float4','float8')),
  'application_pgp_functions',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and p.prosrc ~ 'pgp_(sym|pub)_(encrypt|decrypt)'),
  'custom_estimator_operators',(select count(*) from pg_operator o join pg_namespace n on n.oid=o.oprnamespace where n.nspname not in ('pg_catalog','information_schema') and not exists(select 1 from pg_depend d where d.classid='pg_operator'::regclass and d.objid=o.oid and d.deptype='e') and (o.oprrest::oid>=16384 or o.oprjoin::oid>=16384))
) as preflight;
