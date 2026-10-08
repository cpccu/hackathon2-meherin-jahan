-- Read-only setup checks. Run in Supabase SQL Editor after all migrations.
-- These check installed schema/permissions, not authenticated user workflows.
do $$
declare target text; bucket text;
begin
  foreach target in array array['resources','helpdesk','helpdesk_questions','helpdesk_replies','member_profiles','account_roles','campus_courses','course_enrollments','class_sessions','attendance_records','campus_notices','campus_events','event_registrations','lost_found_posts','campus_complaints','transport_routes','transport_departures','campus_notifications','notification_reads'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=target and c.relrowsecurity) then
      raise exception 'Missing table or RLS disabled: %',target;
    end if;
    if has_table_privilege('anon','public.'||target,'SELECT') then
      raise exception 'Unexpected anonymous SELECT grant: %',target;
    end if;
    if not exists(select 1 from pg_policies where schemaname='public' and tablename=target and policyname='campus_email_required' and permissive='RESTRICTIVE' and cmd='ALL') then
      raise exception 'Run 006: email-session restriction is missing on %',target;
    end if;
  end loop;
  foreach bucket in array array['campus-resources','campus-photos','campus-documents'] loop
    if not exists(select 1 from storage.buckets b where b.id=bucket and b.public=false) then
      raise exception 'Missing or public storage bucket: %',bucket;
    end if;
  end loop;
  if has_column_privilege('authenticated','public.campus_events','created_by','UPDATE') then
    raise exception 'Run 003_event_permissions.sql: event ownership is still editable';
  end if;
  if not has_column_privilege('authenticated','public.campus_events','title','UPDATE') then
    raise exception 'Missing event title update permission';
  end if;
  if has_column_privilege('authenticated','public.event_registrations','checkin_code','UPDATE') then
    raise exception 'Ticket codes must not be editable';
  end if;
  if has_column_privilege('authenticated','public.event_registrations','checked_in_at','UPDATE') then
    raise exception 'Run 004: check-in must use the atomic verification function';
  end if;
  if to_regprocedure('public.check_in_event_ticket(uuid,uuid)') is null then
    raise exception 'Run 004: QR check-in function is missing';
  end if;
  if has_function_privilege('anon','public.check_in_event_ticket(uuid,uuid)','EXECUTE') or not has_function_privilege('authenticated','public.check_in_event_ticket(uuid,uuid)','EXECUTE') then
    raise exception 'Unexpected QR check-in function grants';
  end if;
  if has_column_privilege('authenticated','public.helpdesk_replies','author_role','INSERT') then
    raise exception 'Reply roles must be assigned by the server';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='member_profiles' and column_name='student_number') then
    raise exception 'Run 004: university student IDs are missing';
  end if;
  if has_column_privilege('authenticated','public.campus_complaints','submitted_by','UPDATE') then
    raise exception 'Complaint authors must not be editable';
  end if;
  if has_column_privilege('authenticated','public.transport_departures','updated_by','UPDATE') or has_table_privilege('authenticated','public.campus_notifications','INSERT') then
    raise exception 'Transport attribution and notifications must be assigned by the server';
  end if;
  if not exists(select 1 from pg_trigger where tgname='transport_change_notice' and not tgisinternal) or not exists(select 1 from pg_trigger where tgname='notify_notice' and not tgisinternal) then
    raise exception 'Run 005: transportation/notice notification triggers are missing';
  end if;
  if not exists(select 1 from pg_trigger where tgname='campus_member_created' and not tgisinternal) then
    raise exception 'Signup profile/role trigger is missing';
  end if;
  if to_regprocedure('public.campus_email_session()') is null then
    raise exception 'Run 006: verified email-session function is missing';
  end if;
  if has_function_privilege('anon','public.campus_email_session()','EXECUTE') or not has_function_privilege('authenticated','public.campus_email_session()','EXECUTE') then
    raise exception 'Unexpected email-session function grants';
  end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='campus_email_required' and permissive='RESTRICTIVE') then
    raise exception 'Run 006: storage email-session restriction is missing';
  end if;
  raise notice 'Schema, RLS, email-session, bucket and column permission checks passed. Complete email delivery and role workflow checks separately.';
end $$;
