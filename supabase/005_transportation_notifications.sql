-- Apply after 002, 003 and 004. No example schedules are inserted.
begin;
create table public.transport_routes (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 120),
 origin text not null check(length(trim(origin)) between 1 and 120),
 destination text not null check(length(trim(destination)) between 1 and 120),
 stops text not null default '' check(length(stops)<=2000),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.transport_departures (
 id uuid primary key default gen_random_uuid(),
 route_id uuid not null references public.transport_routes(id),
 bus_label text not null check(length(trim(bus_label)) between 1 and 80),
 service_date date not null,
 scheduled_at timestamptz not null,
 expected_at timestamptz,
 status text not null default 'scheduled' check(status in ('scheduled','delayed','boarding','departed','cancelled')),
 notes text not null default '' check(length(notes)<=2000),
 updated_by uuid not null default auth.uid() references auth.users(id),
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 check((scheduled_at at time zone 'Asia/Dhaka')::date=service_date),
 check(expected_at is null or (expected_at at time zone 'Asia/Dhaka')::date=service_date),
 check(status<>'cancelled' or length(trim(notes))>0),
 unique(service_date,bus_label,scheduled_at)
);
create table public.campus_notifications (
 id uuid primary key default gen_random_uuid(),
 notice_id uuid not null references public.campus_notices(id) on delete cascade,
 title text not null,
 created_at timestamptz not null default now(),
 unique(notice_id)
);
create table public.notification_reads (
 notification_id uuid not null references public.campus_notifications(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(notification_id,user_id)
);
alter table public.transport_routes enable row level security;
alter table public.transport_departures enable row level security;
alter table public.campus_notifications enable row level security;
alter table public.notification_reads enable row level security;
revoke all on public.transport_routes,public.transport_departures,public.campus_notifications,public.notification_reads from anon,authenticated;
grant select on public.transport_routes,public.transport_departures,public.campus_notifications,public.notification_reads to authenticated;
grant insert(name,origin,destination,stops,active),update(name,origin,destination,stops,active) on public.transport_routes to authenticated;
grant insert(route_id,bus_label,service_date,scheduled_at,expected_at,status,notes),update(route_id,bus_label,service_date,scheduled_at,expected_at,status,notes) on public.transport_departures to authenticated;
grant insert(notification_id,user_id) on public.notification_reads to authenticated;
create policy transport_routes_read on public.transport_routes for select to authenticated using(true);
create policy transport_routes_insert on public.transport_routes for insert to authenticated with check(public.campus_role() in ('teacher','admin'));
create policy transport_routes_update on public.transport_routes for update to authenticated using(public.campus_role() in ('teacher','admin')) with check(public.campus_role() in ('teacher','admin'));
create policy transport_departures_read on public.transport_departures for select to authenticated using(true);
create policy transport_departures_insert on public.transport_departures for insert to authenticated with check(public.campus_role() in ('teacher','admin'));
create policy transport_departures_update on public.transport_departures for update to authenticated using(public.campus_role() in ('teacher','admin')) with check(public.campus_role() in ('teacher','admin'));
-- A notification inherits its notice's RLS audience (including course notices).
create policy notification_read on public.campus_notifications for select to authenticated using(exists(select 1 from public.campus_notices n where n.id=notice_id));
create policy own_notification_reads on public.notification_reads for select to authenticated using(user_id=auth.uid());
create policy mark_notification_read on public.notification_reads for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.campus_notifications n where n.id=notification_id));

create function public.stamp_transport_departure() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.campus_role() not in ('teacher','admin') then raise exception 'Staff access required' using errcode='42501'; end if;
 new.updated_by:=auth.uid(); new.updated_at:=now();
 return new;
end $$;
create trigger stamp_transport before insert or update on public.transport_departures for each row execute function public.stamp_transport_departure();

create function public.notify_published_notice() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.campus_notifications(notice_id,title) values(new.id,new.title);
 return new;
end $$;
create trigger notify_notice after insert on public.campus_notices for each row execute function public.notify_published_notice();

create function public.publish_transport_change() returns trigger language plpgsql security definer set search_path='' as $$
declare route_name text; heading text; staff_name text; should_publish boolean:=false;
begin
 if tg_op='INSERT' then should_publish:=new.status in ('cancelled','delayed');
 else
  should_publish:=(new.status in ('cancelled','delayed') or old.status='cancelled') and
   (new.status,new.notes,new.scheduled_at,new.expected_at,new.bus_label,new.route_id,new.service_date) is distinct from
   (old.status,old.notes,old.scheduled_at,old.expected_at,old.bus_label,old.route_id,old.service_date);
 end if;
 if should_publish then
  select name into route_name from public.transport_routes where id=new.route_id;
  select full_name into staff_name from public.member_profiles where id=auth.uid();
  heading:=left(new.bus_label||' · '||case when new.status='cancelled' then 'Bus unavailable' when new.status='delayed' then 'Departure delayed' else 'Bus service updated' end,200);
  insert into public.campus_notices(title,body,category,author_id,author_name)
   values(heading,route_name||E'\nService date: '||new.service_date||E'\nScheduled departure: '||to_char(new.scheduled_at at time zone 'Asia/Dhaka','HH24:MI')||' (Dhaka)'||
    case when new.expected_at is null then '' else E'\nUpdated departure: '||to_char(new.expected_at at time zone 'Asia/Dhaka','HH24:MI')||' (Dhaka)' end||
    E'\nStatus: '||new.status||case when new.notes='' then '' else E'\n'||new.notes end,
    'bus',auth.uid(),coalesce(staff_name,'Campus staff'));
 end if;
 return new;
end $$;
create trigger transport_change_notice after insert or update on public.transport_departures for each row execute function public.publish_transport_change();
revoke all on function public.stamp_transport_departure(),public.notify_published_notice(),public.publish_transport_change() from public,anon,authenticated;
create index transport_service_idx on public.transport_departures(service_date,scheduled_at);
create index notifications_created_idx on public.campus_notifications(created_at desc);
commit;
