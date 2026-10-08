-- Run after setup.sql, once. This migration preserves existing resources and FAQs.
begin;
create table public.member_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null, department text not null default ''
);
create table public.account_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'student' check(role in ('student','teacher','admin'))
);
create function public.campus_role() returns text language sql stable security definer set search_path = '' as $$
 select coalesce((select role from public.account_roles where user_id = auth.uid()), 'student');
$$;
revoke all on function public.campus_role() from public;
grant execute on function public.campus_role() to authenticated;
create function public.campus_new_member() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.member_profiles(id,full_name,department) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Campus member'),coalesce(new.raw_user_meta_data->>'department',''));
 insert into public.account_roles(user_id,role) values(new.id,'student');
 return new;
end;
$$;
revoke all on function public.campus_new_member() from public;
create trigger campus_member_created after insert on auth.users for each row execute function public.campus_new_member();
insert into public.member_profiles select id,coalesce(raw_user_meta_data->>'full_name','Campus member'),coalesce(raw_user_meta_data->>'department','') from auth.users;
insert into public.account_roles(user_id) select id from auth.users;
alter table public.member_profiles enable row level security;
alter table public.account_roles enable row level security;
grant select on public.member_profiles, public.account_roles to authenticated;
grant update(role) on public.account_roles to authenticated;
create policy member_read on public.member_profiles for select to authenticated using(id=auth.uid() or public.campus_role() in ('teacher','admin'));
create policy role_read on public.account_roles for select to authenticated using(user_id=auth.uid() or public.campus_role() in ('teacher','admin'));
create policy role_admin on public.account_roles for update to authenticated using(public.campus_role()='admin') with check(public.campus_role()='admin');

create table public.campus_courses (
 id uuid primary key default gen_random_uuid(), code text not null, title text not null,
 department text not null, semester text not null, teacher_id uuid not null references auth.users(id),
 unique(code,semester), check(length(trim(title))>0), check(length(trim(code))>0)
);
create table public.course_enrollments (
 course_id uuid references public.campus_courses(id) on delete cascade,
 student_id uuid references auth.users(id) on delete cascade,
 primary key(course_id,student_id)
);
create function public.manages_course(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select public.campus_role()='admin' or (public.campus_role()='teacher' and exists(select 1 from public.campus_courses where id=target and teacher_id=auth.uid()));
$$;
create function public.enrolled_course(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.course_enrollments where course_id=target and student_id=auth.uid());
$$;
create function public.validate_campus_academic_member() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if tg_table_name='campus_courses' then
   if not exists(select 1 from public.account_roles where user_id=new.teacher_id and role in ('teacher','admin')) then
     raise exception 'Assign Teacher or Admin access before assigning this account to a course';
   end if;
 else
   if not exists(select 1 from public.account_roles where user_id=new.student_id and role='student') then
     raise exception 'Only student accounts can be enrolled as students';
   end if;
 end if;
 return new;
end;
$$;
revoke all on function public.validate_campus_academic_member() from public;
create trigger campus_validate_teacher before insert or update on public.campus_courses for each row execute function public.validate_campus_academic_member();
create trigger campus_validate_student before insert or update on public.course_enrollments for each row execute function public.validate_campus_academic_member();
revoke all on function public.manages_course(uuid), public.enrolled_course(uuid) from public;
grant execute on function public.manages_course(uuid), public.enrolled_course(uuid) to authenticated;
create table public.class_sessions (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.campus_courses(id) on delete cascade,
 class_date date not null, topic text not null, unique(id,course_id), unique(course_id,class_date,topic)
);
create table public.attendance_records (
 session_id uuid not null, course_id uuid not null, student_id uuid not null,
 status text not null check(status in ('Present','Absent','Late','Excused')),
 primary key(session_id,student_id),
 foreign key(session_id,course_id) references public.class_sessions(id,course_id) on delete cascade,
 foreign key(course_id,student_id) references public.course_enrollments(course_id,student_id) on delete cascade
);
alter table public.campus_courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendance_records enable row level security;
grant select,insert,update,delete on public.campus_courses,public.course_enrollments,public.class_sessions,public.attendance_records to authenticated;
create policy course_read on public.campus_courses for select to authenticated using(public.manages_course(id) or public.enrolled_course(id));
create policy course_write on public.campus_courses for all to authenticated using(public.campus_role()='admin') with check(public.campus_role()='admin');
create policy enrollment_read on public.course_enrollments for select to authenticated using(student_id=auth.uid() or public.manages_course(course_id));
create policy enrollment_write on public.course_enrollments for all to authenticated using(public.manages_course(course_id)) with check(public.manages_course(course_id));
create policy session_read on public.class_sessions for select to authenticated using(public.manages_course(course_id) or public.enrolled_course(course_id));
create policy session_write on public.class_sessions for all to authenticated using(public.manages_course(course_id)) with check(public.manages_course(course_id));
create policy attendance_read on public.attendance_records for select to authenticated using(student_id=auth.uid() or public.manages_course(course_id));
create policy attendance_write on public.attendance_records for all to authenticated using(public.manages_course(course_id)) with check(public.manages_course(course_id));

create table public.campus_notices (
 id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title)) between 1 and 200),
 body text not null check(length(trim(body))>0), category text not null check(category in ('bus','exam','rules','academic','general','closure','event')),
 course_id uuid references public.campus_courses(id) on delete cascade,
 source_url text, attachment_path text, attachment_name text,
 author_id uuid not null default auth.uid() references auth.users(id),
 author_name text not null, created_at timestamptz not null default now(),
 check(attachment_path is null or split_part(attachment_path,'/',1)=author_id::text)
);
alter table public.campus_notices enable row level security;
grant select,insert,delete on public.campus_notices to authenticated;
create policy notice_read on public.campus_notices for select to authenticated using(course_id is null or public.enrolled_course(course_id) or public.manages_course(course_id));
create policy notice_insert on public.campus_notices for insert to authenticated with check(author_id=auth.uid() and (public.campus_role()='admin' or (course_id is not null and public.manages_course(course_id))));
create policy notice_delete on public.campus_notices for delete to authenticated using(public.campus_role()='admin' or (author_id=auth.uid() and public.manages_course(course_id)));
grant insert,update,delete on public.helpdesk to authenticated;
alter table public.helpdesk add column attachment_path text, add column attachment_name text;
create policy helpdesk_admin_write on public.helpdesk for all to authenticated using(public.campus_role()='admin') with check(public.campus_role()='admin');

create table public.campus_events (
 id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title))>0),
 club text not null, event_type text not null check(event_type in ('Workshop','Contest','Seminar','Cultural','Sports','Other')),
 starts_at timestamptz not null, location text not null, description text not null,
 created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now()
);
create function public.manages_event(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select public.campus_role()='admin' or (public.campus_role()='teacher' and exists(select 1 from public.campus_events where id=target and created_by=auth.uid()));
$$;
revoke all on function public.manages_event(uuid) from public;
grant execute on function public.manages_event(uuid) to authenticated;
create table public.event_registrations (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.campus_events(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 attendee_name text not null, checkin_code uuid not null default gen_random_uuid(), checked_in_at timestamptz,
 created_at timestamptz not null default now(), unique(event_id,user_id), unique(checkin_code)
);
alter table public.campus_events enable row level security;
alter table public.event_registrations enable row level security;
grant select,insert,update,delete on public.campus_events to authenticated;
grant select,delete on public.event_registrations to authenticated;
grant insert(event_id,user_id,attendee_name) on public.event_registrations to authenticated;
grant update(checked_in_at) on public.event_registrations to authenticated;
create policy event_read on public.campus_events for select to authenticated using(true);
create policy event_insert on public.campus_events for insert to authenticated with check(created_by=auth.uid() and public.campus_role() in ('admin','teacher'));
create policy event_update on public.campus_events for update to authenticated using(public.manages_event(id)) with check(public.manages_event(id) and created_by=auth.uid());
create policy event_delete on public.campus_events for delete to authenticated using(public.manages_event(id));
create policy registration_read on public.event_registrations for select to authenticated using(user_id=auth.uid() or public.manages_event(event_id));
create policy registration_insert on public.event_registrations for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.campus_events where id=event_id and starts_at>now()));
create policy registration_delete on public.event_registrations for delete to authenticated using(user_id=auth.uid() or public.manages_event(event_id));
create policy registration_checkin on public.event_registrations for update to authenticated using(public.manages_event(event_id)) with check(public.manages_event(event_id));

create table public.lost_found_posts (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('Lost','Found')),
 title text not null, description text not null, location text not null, item_date date not null,
 photo_path text, contact text not null, status text not null default 'Open' check(status in ('Open','Resolved')),
 posted_by uuid not null default auth.uid() references auth.users(id), posted_name text not null,
 created_at timestamptz not null default now(),
 check(photo_path is null or split_part(photo_path,'/',1)=posted_by::text)
);
create table public.campus_complaints (
 id uuid primary key default gen_random_uuid(), subject text not null, body text not null,
 submitted_by uuid not null default auth.uid() references auth.users(id),
 status text not null default 'Received' check(status in ('Received','In progress','Resolved')),
 admin_reply text not null default '', created_at timestamptz not null default now()
);
alter table public.lost_found_posts enable row level security;
alter table public.campus_complaints enable row level security;
grant select,insert,update,delete on public.lost_found_posts to authenticated;
grant select on public.campus_complaints to authenticated;
grant insert(subject,body,submitted_by) on public.campus_complaints to authenticated;
grant update(status,admin_reply) on public.campus_complaints to authenticated;
create policy item_read on public.lost_found_posts for select to authenticated using(true);
create policy item_insert on public.lost_found_posts for insert to authenticated with check(posted_by=auth.uid());
create policy item_update on public.lost_found_posts for update to authenticated using(posted_by=auth.uid() or public.campus_role()='admin') with check(posted_by=auth.uid() or public.campus_role()='admin');
create policy item_delete on public.lost_found_posts for delete to authenticated using(posted_by=auth.uid() or public.campus_role()='admin');
create policy complaint_read on public.campus_complaints for select to authenticated using(submitted_by=auth.uid() or public.campus_role()='admin');
create policy complaint_insert on public.campus_complaints for insert to authenticated with check(submitted_by=auth.uid());
create policy complaint_admin on public.campus_complaints for update to authenticated using(public.campus_role()='admin') with check(public.campus_role()='admin');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('campus-photos','campus-photos',false,5242880,array['image/jpeg','image/png','image/webp']);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('campus-documents','campus-documents',false,20971520,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','image/jpeg','image/png','image/webp']);
create policy campus_document_insert on storage.objects for insert to authenticated with check(bucket_id='campus-documents' and (storage.foldername(name))[1]=auth.uid()::text and public.campus_role() in ('teacher','admin'));
create policy campus_document_read on storage.objects for select to authenticated using(bucket_id='campus-documents' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.campus_notices where attachment_path=name) or exists(select 1 from public.helpdesk where attachment_path=name)));
create policy campus_document_delete on storage.objects for delete to authenticated using(bucket_id='campus-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy campus_photo_insert on storage.objects for insert to authenticated with check(bucket_id='campus-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy campus_photo_read on storage.objects for select to authenticated using(bucket_id='campus-photos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.lost_found_posts where photo_path=name)));
create policy campus_photo_delete on storage.objects for delete to authenticated using(bucket_id='campus-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create index notices_created_idx on public.campus_notices(created_at desc);
create index events_start_idx on public.campus_events(starts_at);
create index attendance_student_idx on public.attendance_records(student_id,course_id);
-- Replace Supabase default grants with the intended column permissions.
revoke all on function public.campus_role(),public.manages_course(uuid),public.enrolled_course(uuid),public.manages_event(uuid) from anon;
revoke all on function public.campus_new_member(),public.validate_campus_academic_member() from anon,authenticated;
revoke all on public.member_profiles,public.account_roles,public.campus_courses,public.course_enrollments,public.class_sessions,public.attendance_records,public.campus_notices,public.campus_events,public.event_registrations,public.lost_found_posts,public.campus_complaints from anon,authenticated;
grant select on public.member_profiles,public.account_roles to authenticated;
grant update(role) on public.account_roles to authenticated;
grant select,insert,update,delete on public.campus_courses,public.course_enrollments,public.class_sessions,public.attendance_records,public.campus_events,public.lost_found_posts to authenticated;
grant select,insert,delete on public.campus_notices to authenticated;
grant select,delete on public.event_registrations to authenticated;
grant insert(event_id,user_id,attendee_name) on public.event_registrations to authenticated;
grant update(checked_in_at) on public.event_registrations to authenticated;
grant select on public.campus_complaints to authenticated;
grant insert(subject,body,submitted_by) on public.campus_complaints to authenticated;
grant update(status,admin_reply) on public.campus_complaints to authenticated;
commit;

-- Bootstrap the first trusted admin separately in SQL Editor after confirming
-- their email in Authentication > Users. Replace the example email:
-- update public.account_roles set role='admin'
-- where user_id=(select id from auth.users where email='YOUR_ADMIN_EMAIL');
-- New signups always become students. Admins assign teachers in CampusOS.
