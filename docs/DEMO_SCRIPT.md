# CampusOS presentation and demo

Suggested recording: 4–5 minutes. This is a script, not a recorded video.

## 0:00–0:30 — Problem

“At City University, useful course files, campus notices, club announcements
and support requests can be scattered across messages. Students need one
place to find information and take the next action.”

## 0:30–1:00 — Solution

“CampusOS brings four working modules together: Resource Hub, Smart Helpdesk,
Club & Event Engine, and Lost & Found / Complaint Box. Student, Teacher and
Admin permissions are enforced by the database.”

Show the landing page, login choices and the signed-in dashboard. Explain that
requesting a staff role at signup does not grant staff permissions.

## 1:00–2:00 — Resources and Helpdesk

Upload a permitted course PDF with department, exact course code, category and
tags. Search for it, preview it and download it. Explain private visibility.
Open a sourced Helpdesk guide and its official CU link. Show an actual uploaded
notice image/PDF. Use a dated official bus notice if available; do not present
the transport contact guide as an exact bus timetable.

## 2:00–2:50 — Events

Show a staff-published event with club, date/time and venue. Register as a
Student, copy the ticket code, then switch to the event owner/Admin to check it
in. Refresh the student view to show the checked-in ticket.

## 2:50–3:40 — Lost/found and complaints

Show a clearly labelled demo lost/found report with a photo, description,
location and date. Search for it and resolve it. File a demo complaint as a
Student, show its receipt ID, then reply/update status as Admin. Return to the
student view. Explain that other students cannot read the complaint.

## 3:40–4:20 — Additional features

Show a teacher’s assigned course, an enrolled student and one clearly labelled
demo attendance record. Show the student’s own attendance. Preview a course
notice attachment. Briefly show mobile navigation and the sticky header.

## 4:20–5:00 — Implementation and wrap-up

“The frontend uses React and Vite. Supabase provides email/password login,
PostgreSQL records, row-level access rules and private file storage. Helpdesk
uses searchable, sourced FAQs; it does not invent university policies. The
app uses real saved records rather than hardcoded sample cards.”

Show the final public URL and repository. Mention remaining operational needs
honestly: staff keep current notices and schedules up to date; check-in uses
ticket codes; attendance calculations need university approval for official use.

Upload the recording, enable judge access and add its actual link to the
submission. Record from prepared demo accounts without exposing passwords,
tokens or real private student data.
