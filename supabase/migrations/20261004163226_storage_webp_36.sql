-- Align the private verification library with the shared iOS/web file picker.
-- Preserve bucket visibility, quotas and all ownership policies.
update storage.buckets
set allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']::text[]
where id = 'coach-documents';
