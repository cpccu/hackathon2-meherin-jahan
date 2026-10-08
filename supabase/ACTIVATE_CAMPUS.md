# Activate roles and campus modules

## 1. Apply the database migration

The original `setup.sql` must already have run successfully. Existing resources
and Helpdesk answers are preserved.

1. Open Supabase > SQL Editor > New query.
2. Copy the entire contents of `002_campus_modules.sql` into the editor.
3. Run it once. An error rolls back the transaction.
4. Resolve any reported error before retrying. Do not rerun after success.

New and existing accounts receive Student access by default.

After migration 002, run `003_event_permissions.sql`, then `004_questions_attendance_qr.sql`, then `005_transportation_notifications.sql`, then `006_email_verification_access.sql`, then `verify_setup.sql`.
The latter checks schema/grants without changing records. If 002 already
succeeded, run only missing migrations 003/004/005/006 and the verification script. Migration 005 runs once; a failure rolls back its transaction. Follow [email verification setup](../docs/EMAIL_VERIFICATION.md) for required Auth settings, SMTP and templates before member registration/login.

## 2. Assign the first admin

1. Supabase > Authentication > Users: find your registered account and copy its ID.
2. Table Editor > `account_roles`: find the matching `user_id` row.
3. Change its `role` to `admin`, then save.
4. Refresh CampusOS, log out, and log in with **Admin** selected.

After this one-time bootstrap, use CampusOS > Admin panel > Account permissions
to assign teachers or additional admins. Never put service-role keys in the app.

## 3. Populate real information

- Admin panel: publish verified bus schedules, exam information and university
  rules with sources and optional PDF/image attachments.
  You can review/import six official CU guides using **Import official CU guides**.
  Exact route stops and times still need a current Transport Office notice.
- Campus Notices: admins publish closures or campus updates; teachers publish
  notices for assigned courses.
- Transportation: assigned Teachers/Admins maintain route stops and daily bus departures. Update availability, departure estimates and reasons. Unavailable, delayed or restored services automatically publish campus-wide notices and in-app notifications. All users can read services; notifications refresh every 30 seconds while the workspace is open.
- Courses & Attendance: admins create courses and assign teachers. Teachers/admins
  enroll students, create classes and mark or correct attendance.
- Clubs & Events: staff publish events; students register and show their unique
  QR ticket to event staff for camera/image/code check-in.
- Lost & Found / Complaints: students post item photos or private complaints;
  admins reply to complaints and update their status.

See [the questions, bulk attendance and QR guide](../docs/QUESTIONS_ATTENDANCE_QR.md) for university ID assignment and the new workflows.

## 4. Permissions and recordkeeping

Students cannot assign roles, mark attendance, publish campus notices, edit
Helpdesk answers or read other students' private attendance/complaints. Teachers
manage their assigned courses and own events. Database RLS enforces these rules.

Attendance uses recorded marks only: Present/Late count as attended, Excused is
excluded and unmarked classes do not count as absences. Confirm this calculation
with CU before presenting it as official policy. Select the same session to
correct existing attendance marks.

Use exact course codes when uploading resources. Bookmarks are local to each
account on the current browser. Resources accept PDF/DOCX/PPTX up to 20 MB. Item
photos accept JPG/PNG/WebP up to 5 MB. Notice/Helpdesk attachments accept PDF,
DOCX, PPTX, JPG, PNG or WebP up to 20 MB.

Reopen modules or use Refresh to retrieve updates. No bus timetable, event or
academic record is invented. Imported official guidance includes source links;
staff must keep it current and enter actual schedules and academic records.

## Deployment

Use the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` hosting environment
variables. Configure the deployed URL in Supabase Authentication URL settings.
Apply the migration in the same Supabase project used by the deployment.
