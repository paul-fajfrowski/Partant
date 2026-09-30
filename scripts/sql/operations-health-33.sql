-- Aggregate only: no token, client name, document path or message in this report.
select jsonb_build_object(
 'checked_at',now(),
 'deletions_pending',(select count(*) from private.account_deletion_jobs where status<>'completed'),
 'deletions_stalled',(select count(*) from private.account_deletion_jobs where status<>'completed' and created_at<now()-interval '1 hour'),
 'push_stalled',(select count(*) from private.push_outbox where status in ('pending','sending') and due_at<now()-interval '15 minutes' and expires_at>now()),
 'cron_failures_24h',(select count(*) from cron.job_run_details where start_time>now()-interval '24 hours' and status='failed'),
 'push_devices',(select count(*) from private.push_devices),
 'calendar_connections',(select count(*) from private.calendar_links),
 'team_accounts',(select count(*) from private.product_staff),
 'documents_bytes',(select coalesce(sum(pg_column_size(body)),0) from private.product_documents)
) as health;
