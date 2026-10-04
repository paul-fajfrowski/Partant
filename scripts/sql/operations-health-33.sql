-- Aggregate only: no token, client name, document path or message in this report.
select jsonb_build_object(
 'checked_at',now(),
 'deletions_pending',(select count(*) from private.account_deletion_jobs where status<>'completed'),
 'deletions_stalled',(select count(*) from private.account_deletion_jobs where status<>'completed' and created_at<now()-interval '1 hour'),
 'push_stalled',(select count(*) from private.push_outbox where status in ('pending','sending') and due_at<now()-interval '15 minutes' and expires_at>now()),
 'cron_stale_or_missing',(select count(*) from (values
   ('partant-calendar-sync',interval '15 minutes'),
   ('partant-push-dispatch',interval '5 minutes'),
   ('partant-housekeeping',interval '90 minutes')
 ) as expected(name,tolerance) left join cron.job j on j.jobname=expected.name
 where j.jobid is null or not j.active or not exists (
   select 1 from cron.job_run_details r where r.jobid=j.jobid and r.status='succeeded' and r.start_time>now()-expected.tolerance
 )),
 'cron_failures_24h',(select count(*) from cron.job_run_details where start_time>now()-interval '24 hours' and status='failed'),
 'edge_http_failures',(select count(*) from net._http_response where created>now()-interval '24 hours' and (status_code>=400 or timed_out or error_msg is not null)),
 'push_devices',(select count(*) from private.push_devices),
 'calendar_connections',(select count(*) from private.calendar_links),
 'team_accounts',(select count(*) from private.product_staff),
 'documents_bytes',(select coalesce(sum(pg_column_size(body)),0) from private.product_documents)
) as health;
