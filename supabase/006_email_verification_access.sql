-- Run after 005. Preserves existing role, privacy and ownership policies.
-- Requires Supabase Confirm email enabled and the email OTP template configured.
begin;
create or replace function public.campus_email_session() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
  and coalesce((auth.jwt()->'amr') @> '[{"method":"otp"}]'::jsonb,false)
  and exists(select 1 from auth.users u where u.id=auth.uid()
    and u.email_confirmed_at is not null and u.email=auth.jwt()->>'email');
$$;
revoke all on function public.campus_email_session() from public,anon;
grant execute on function public.campus_email_session() to authenticated;

-- Security-definer role helpers and QR admission cannot use a password-only session.
create or replace function public.campus_role() returns text
language sql stable security definer set search_path='' as $$
 select case when public.campus_email_session() then
  coalesce((select role from public.account_roles where user_id=auth.uid()),'student')
  else 'unverified' end;
$$;
revoke all on function public.campus_role() from public,anon;
grant execute on function public.campus_role() to authenticated;

do $$
declare target text;
begin
 foreach target in array array['resources','helpdesk','helpdesk_questions','helpdesk_replies','member_profiles','account_roles','campus_courses','course_enrollments','class_sessions','attendance_records','campus_notices','campus_events','event_registrations','lost_found_posts','campus_complaints','transport_routes','transport_departures','campus_notifications','notification_reads'] loop
  execute format('drop policy if exists campus_email_required on public.%I',target);
  execute format('create policy campus_email_required on public.%I as restrictive for all to authenticated using ((select public.campus_email_session())) with check ((select public.campus_email_session()))',target);
 end loop;
end $$;
drop policy if exists campus_email_required on storage.objects;
create policy campus_email_required on storage.objects as restrictive for all to authenticated
 using(bucket_id not in ('campus-resources','campus-photos','campus-documents') or (select public.campus_email_session()))
 with check(bucket_id not in ('campus-resources','campus-photos','campus-documents') or (select public.campus_email_session()));
commit;
