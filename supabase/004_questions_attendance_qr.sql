-- Run after migrations 002 and 003. Safe to rerun; preserves existing records.
begin;
alter table public.member_profiles add column if not exists student_number text;
create unique index if not exists member_student_number_unique on public.member_profiles (upper(student_number)) where student_number is not null;
alter table public.member_profiles drop constraint if exists student_number_format;
alter table public.member_profiles add constraint student_number_format check(student_number is null or student_number ~ '^[A-Z0-9][A-Z0-9/-]{1,49}$');
grant update(student_number) on public.member_profiles to authenticated;
drop policy if exists member_admin_update on public.member_profiles;
create policy member_admin_update on public.member_profiles for update to authenticated using(public.campus_role()='admin') with check(public.campus_role()='admin');

create table if not exists public.helpdesk_questions (
 id uuid primary key default gen_random_uuid(),
 asked_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 200),
 body text not null check(length(trim(body)) between 1 and 5000),
 category text not null check(category in ('bus','exam','rules','academic','general')),
 created_at timestamptz not null default now()
);
create table if not exists public.helpdesk_replies (
 id uuid primary key default gen_random_uuid(),
 question_id uuid not null references public.helpdesk_questions(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 author_name text not null default '', author_role text not null default 'student',
 body text not null check(length(trim(body)) between 1 and 5000),
 created_at timestamptz not null default now()
);
alter table public.helpdesk_questions enable row level security;
alter table public.helpdesk_replies enable row level security;
revoke all on public.helpdesk_questions, public.helpdesk_replies from anon, authenticated;
grant select on public.helpdesk_questions, public.helpdesk_replies to authenticated;
grant insert(title,body,category) on public.helpdesk_questions to authenticated;
grant insert(question_id,body) on public.helpdesk_replies to authenticated;
drop policy if exists question_read on public.helpdesk_questions;
create policy question_read on public.helpdesk_questions for select to authenticated using(asked_by=auth.uid() or public.campus_role() in ('teacher','admin'));
drop policy if exists question_ask on public.helpdesk_questions;
create policy question_ask on public.helpdesk_questions for insert to authenticated with check(asked_by=auth.uid() and public.campus_role()='student');
drop policy if exists reply_read on public.helpdesk_replies;
create policy reply_read on public.helpdesk_replies for select to authenticated using(exists(select 1 from public.helpdesk_questions q where q.id=question_id and (q.asked_by=auth.uid() or public.campus_role() in ('teacher','admin'))));
drop policy if exists reply_add on public.helpdesk_replies;
create policy reply_add on public.helpdesk_replies for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.helpdesk_questions q where q.id=question_id and (q.asked_by=auth.uid() or public.campus_role() in ('teacher','admin'))));
create or replace function public.stamp_helpdesk_reply() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.author_id := auth.uid();
 new.author_role := public.campus_role();
 select full_name into new.author_name from public.member_profiles where id=auth.uid();
 new.author_name := coalesce(new.author_name,'Campus member');
 return new;
end;
$$;
revoke all on function public.stamp_helpdesk_reply() from public;
drop trigger if exists helpdesk_reply_identity on public.helpdesk_replies;
create trigger helpdesk_reply_identity before insert on public.helpdesk_replies for each row execute function public.stamp_helpdesk_reply();
create index if not exists helpdesk_question_owner on public.helpdesk_questions(asked_by,created_at);
create index if not exists helpdesk_reply_thread on public.helpdesk_replies(question_id,created_at);

-- The server checks event ownership and consumes a registered ticket once.
-- Locking prevents two scanners admitting the same ticket concurrently.
revoke update on public.event_registrations from authenticated;
revoke update(checked_in_at) on public.event_registrations from authenticated;
drop policy if exists registration_delete on public.event_registrations;
create policy registration_delete on public.event_registrations for delete to authenticated using(checked_in_at is null and (user_id=auth.uid() or public.manages_event(event_id)));
create or replace function public.check_in_event_ticket(target_event uuid, ticket_code uuid)
returns table(attendee_name text, checked_in_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare registration public.event_registrations%rowtype; admitted_at timestamptz;
begin
 if auth.uid() is null or not public.manages_event(target_event) then
  raise exception 'Only the event organizer or an administrator can admit attendees' using errcode='42501';
 end if;
 select * into registration from public.event_registrations r where r.event_id=target_event and r.checkin_code=ticket_code for update;
 if not found then raise exception 'Ticket is not registered for this event'; end if;
 if registration.checked_in_at is not null then raise exception 'This ticket has already been checked in'; end if;
 admitted_at := now();
 update public.event_registrations r set checked_in_at=admitted_at where r.id=registration.id;
 return query select registration.attendee_name, admitted_at;
end;
$$;
revoke all on function public.check_in_event_ticket(uuid,uuid) from public,anon;
grant execute on function public.check_in_event_ticket(uuid,uuid) to authenticated;
commit;
