
begin;

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  department text not null check (char_length(trim(department)) > 0),
  course text not null check (char_length(trim(course)) > 0),
  subject text not null default '',
  category text not null check (category in ('Notes', 'Question Paper', 'Lab Manual', 'Notice')),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  visibility text not null default 'Public' check (visibility in ('Public', 'Private')),
  storage_path text not null unique,
  file_name text not null,
  file_type text not null check (file_type in ('PDF', 'DOCX', 'PPTX')),
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  uploaded_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  uploader_name text not null default 'Student',
  created_at timestamptz not null default now(),
  constraint resources_owner_folder check (
    split_part(storage_path, '/', 1) = uploaded_by::text
    and char_length(split_part(storage_path, '/', 2)) > 0
  )
);

create index resources_created_at_idx on public.resources (created_at desc);
create index resources_uploaded_by_idx on public.resources (uploaded_by);
create index resources_department_category_idx on public.resources (department, category);

alter table public.resources enable row level security;
revoke all on public.resources from anon, authenticated;
grant select, insert, update, delete on public.resources to authenticated;

-- Public means shared with signed-in campus users.
-- Private records are visible only to their uploader.
create policy campusos_resources_read
on public.resources for select to authenticated
using (visibility = 'Public' or uploaded_by = (select auth.uid()));

create policy campusos_resources_insert
on public.resources for insert to authenticated
with check (uploaded_by = (select auth.uid()));

create policy campusos_resources_update
on public.resources for update to authenticated
using (uploaded_by = (select auth.uid()))
with check (uploaded_by = (select auth.uid()));

create policy campusos_resources_delete
on public.resources for delete to authenticated
using (uploaded_by = (select auth.uid()));

create table public.helpdesk (
  id uuid primary key default gen_random_uuid(),
  question text not null unique check (char_length(trim(question)) between 1 and 300),
  answer text not null check (char_length(trim(answer)) > 0),
  category text not null check (category in ('bus', 'exam', 'rules', 'academic', 'general')),
  keywords text[] not null default '{}',
  source_label text not null default 'CampusOS guide',
  source_url text,
  updated_at timestamptz not null default now()
);

create index helpdesk_category_idx on public.helpdesk (category);
alter table public.helpdesk enable row level security;
revoke all on public.helpdesk from anon, authenticated;
grant select on public.helpdesk to authenticated;

-- Students can read answers. Manage verified information from the dashboard
-- Table Editor or SQL Editor; students cannot rewrite official answers.
create policy campusos_helpdesk_read
on public.helpdesk for select to authenticated
using (true);

-- These are app guidance examples, not invented university policies or timings.
-- Add verified CU bus schedules, exam information and rules separately.
insert into public.helpdesk (question, answer, category, keywords) values
  ('Where can I find previous question papers?',
   'Open the Resource Hub and choose Question Paper in the resource type filter. Narrow the list by department and search for the course you need.',
   'academic', array['questions', 'papers', 'resource hub', 'course']),
  ('Who can see a private resource?',
   'A private resource is accessible only to the account that uploaded it. Public resources are shared with signed-in CampusOS users.',
   'general', array['private', 'public', 'visibility', 'upload']);

-- The bucket stays private so the app can check access before downloads.
-- Step 5 will upload files under <user-id>/<unique-file-name> and generate
-- short-lived signed download URLs for permitted users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campus-resources',
  'campus-resources',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);

create policy campusos_files_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'campus-resources'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy campusos_files_read
on storage.objects for select to authenticated
using (
  bucket_id = 'campus-resources'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.resources resource
      where resource.storage_path = storage.objects.name
        and resource.visibility = 'Public'
    )
  )
);

create policy campusos_files_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'campus-resources'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
