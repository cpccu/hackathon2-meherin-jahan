-- Run after 002. Safe to rerun. Allow admins to edit staff events without
-- changing ownership; restrict updates to editable event fields.
begin;
drop policy if exists event_update on public.campus_events;
create policy event_update on public.campus_events for update to authenticated
using (public.manages_event(id))
with check (public.manages_event(id));
revoke update on public.campus_events from authenticated;
grant update(title,club,event_type,starts_at,location,description)
on public.campus_events to authenticated;
commit;
